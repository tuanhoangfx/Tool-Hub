/**
 * P0004 hub — đồng bộ 2 chiều metadata (tool.manifest.json) giữa:
 *   - Local: E:\Dev\Tool, Extension, n8n (workspace.roots.json)
 *   - GitHub: tuanhoangfx/* (gh auth token hoặc GITHUB_TOKEN)
 *
 * Chiến lược manifest: so sánh manifestUpdatedAt (fallback mtime local).
 *   local mới hơn → push lên GitHub (Contents API)
 *   remote mới hơn → ghi xuống local
 *   chỉ GitHub → catalog github-only (không tạo folder local)
 *   chỉ local + có repo → push manifest
 */
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const {
  loadWorkspaceConfig,
  scanAllRoots,
  mergeRegistryDefault,
  readJson,
  isProjectDir,
} = require("./lib/workspace-scan.cjs");
const {
  getGitHubToken,
  fetchFileContent,
  putFileContent,
  fetchRemoteVersion,
  listUserRepos,
} = require("./lib/github-sync.cjs");

const p0004Root = path.resolve(__dirname, "..");
const localRegistryPath = path.join(p0004Root, "public", "local-registry.json");
const defaultRegistryPath = path.join(p0004Root, "public", "registry.default.json");
const catalogPath = path.join(p0004Root, "public", "workspace-catalog.json");

function parseTime(value, fallbackMs) {
  if (!value) return fallbackMs;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? fallbackMs : t;
}

function stableJson(obj) {
  return JSON.stringify(obj);
}

function slugFolderName(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveCloneDirName(ghRepo, manifestJson) {
  const code = manifestJson?.code;
  const label = manifestJson?.name || ghRepo.name;
  const slug = slugFolderName(label);
  if (code && /^P\d{4}/i.test(String(code))) {
    return `${code}-${slug || slugFolderName(ghRepo.name)}`;
  }
  return ghRepo.name;
}

function isCloneExcluded(ghRepo, config) {
  const exclude = config.clone?.exclude;
  if (!exclude?.length) return false;
  const names = new Set(exclude.map((x) => String(x).toLowerCase()));
  const repoName = ghRepo.name?.toLowerCase();
  if (names.has(repoName)) return true;
  const slug = `${config.githubUser || "tuanhoangfx"}/${ghRepo.name}`.toLowerCase();
  return names.has(slug);
}

function versionDrift(localVersion, githubVersion) {
  if (!githubVersion) return undefined;
  const local = localVersion && localVersion !== "local" && localVersion !== "remote" ? localVersion : "";
  if (!local) return undefined;
  return local === githubVersion ? "match" : "drift";
}

async function enrichGithubVersion(entry, token) {
  if (!entry.repo || entry.remoteEnabled === false) return;
  try {
    const remote = await fetchRemoteVersion(entry.repo, entry.branch || "main", token);
    if (remote?.version) {
      entry.githubVersion = remote.version;
      entry.githubVersionSource = remote.source;
      entry.versionDrift = versionDrift(entry.localVersion, remote.version);
    }
  } catch (error) {
    entry.githubVersionError = error.message;
  }
}

async function cloneGithubRepoAsync(ghRepo, config, token, dryRun) {
  const cloneRoot = config.clone?.targetRoot || config.roots.find((r) => r.id === "tool")?.path;
  if (!cloneRoot) return { status: "error", detail: "no-clone-targetRoot" };

  const repo = `${config.githubUser || "tuanhoangfx"}/${ghRepo.name}`;
  let manifestJson;
  try {
    const remote = await fetchFileContent(repo, ghRepo.default_branch || "main", "tool.manifest.json", token);
    manifestJson = remote?.json;
  } catch {
    /* manifest optional */
  }

  const dirName = resolveCloneDirName(ghRepo, manifestJson);
  const targetDir = path.join(cloneRoot, dirName);
  if (fs.existsSync(targetDir)) {
    const hasGit = fs.existsSync(path.join(targetDir, ".git"));
    return { status: hasGit ? "exists" : "error", detail: hasGit ? "already-cloned" : "path-blocked", targetDir };
  }

  const url = ghRepo.clone_url || `https://github.com/${repo}.git`;
  if (dryRun) return { status: "would-clone", detail: targetDir, targetDir };

  fs.mkdirSync(cloneRoot, { recursive: true });
  const depthArg = config.clone?.depth ? `--depth ${Number(config.clone.depth)}` : "";
  execSync(`git clone ${depthArg} "${url}" "${targetDir}"`.replace(/\s+/g, " ").trim(), { stdio: "inherit" });
  return { status: "cloned", detail: targetDir, targetDir };
}

async function syncOneManifest(entry, token, dryRun) {
  const { repo, branch, manifestPath, localPath, id } = entry;
  if (!repo || !isProjectDir(localPath)) {
    return { id, status: "skipped", detail: "not-a-syncable-project" };
  }

  const localFile = path.join(localPath, manifestPath || "tool.manifest.json");
  const localManifest = readJson(localFile);
  if (!localManifest) {
    return { id, status: "skipped", detail: "no-local-manifest" };
  }

  const localMtime = fs.statSync(localFile).mtime.toISOString();
  const localTs = parseTime(localManifest.manifestUpdatedAt, localMtime);

  let remote;
  try {
    remote = await fetchFileContent(repo, branch || "main", manifestPath || "tool.manifest.json", token);
  } catch (error) {
    return { id, status: "error", detail: `github-read: ${error.message}` };
  }

  if (!remote?.json) {
    if (dryRun) return { id, status: "would-push", detail: "github-missing-manifest" };
    try {
      await putFileContent(
        repo,
        branch || "main",
        manifestPath || "tool.manifest.json",
        localManifest,
        `sync: publish manifest for ${id} (local only)`,
        undefined,
        token,
      );
      return { id, status: "pushed", detail: "created-on-github" };
    } catch (error) {
      return { id, status: "error", detail: `github-push: ${error.message}` };
    }
  }

  const remoteTs = parseTime(remote.json.manifestUpdatedAt, 0);
  const same = stableJson(localManifest) === stableJson(remote.json);

  if (same) {
    return { id, status: "in-sync", detail: "manifests-match" };
  }

  if (localTs >= remoteTs) {
    if (dryRun) return { id, status: "would-push", detail: `local ${localTs} >= remote ${remoteTs}` };
    try {
      await putFileContent(
        repo,
        branch || "main",
        manifestPath || "tool.manifest.json",
        localManifest,
        `sync: update manifest from local (${id})`,
        remote.sha,
        token,
      );
      return { id, status: "pushed", detail: "local-newer" };
    } catch (error) {
      return { id, status: "error", detail: `github-push: ${error.message}` };
    }
  }

  if (dryRun) return { id, status: "would-pull", detail: `remote ${remoteTs} > local ${localTs}` };
  try {
    fs.writeFileSync(localFile, `${JSON.stringify(remote.json, null, 2)}\n`, "utf8");
    return { id, status: "pulled", detail: "remote-newer" };
  } catch (error) {
    return { id, status: "error", detail: `local-write: ${error.message}` };
  }
}

function githubOnlyEntry(ghRepo, githubUser) {
  const name = ghRepo.name;
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id,
    code: `GH-${String(ghRepo.id).slice(-4)}`,
    name: ghRepo.name,
    repo: `${githubUser}/${ghRepo.name}`,
    branch: ghRepo.default_branch || "main",
    remoteEnabled: true,
    localVersion: "remote",
    category: "GitHub",
    audience: "Tool maintainers",
    status: "Needs review",
    summary: ghRepo.description || "GitHub repository without local folder in workspace roots.",
    localPath: "",
    tags: ["GitHub", ghRepo.language || "repo"].filter(Boolean),
    deployTarget: "vercel",
    usage: [`Clone: ${ghRepo.clone_url}`, `Web: ${ghRepo.html_url}`],
    downloadHint: ghRepo.html_url,
    manifestPath: "tool.manifest.json",
    trackedFiles: ["tool.manifest.json"],
    scriptFiles: [],
    workspaceRoot: "github",
    assetKind: "github-only",
    githubMeta: {
      html_url: ghRepo.html_url,
      pushed_at: ghRepo.pushed_at,
      updated_at: ghRepo.updated_at,
      private: ghRepo.private,
    },
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const cloneMissing = process.argv.includes("--clone-missing");
  const token = getGitHubToken();
  if (!token) {
    console.error("Cần GITHUB_TOKEN hoặc `gh auth login` (device flow trên browser Cursor).");
    process.exit(1);
  }

  let { config, entries: scanned } = scanAllRoots(undefined, { writeManifest: true });
  const syncResults = [];
  const cloneResults = [];
  const byRepo = new Map();

  const githubUser = config.githubUser || "tuanhoangfx";
  let githubOnly = 0;
  const missingOnDisk = [];

  try {
    const remoteRepos = await listUserRepos(githubUser, token);
    for (const entry of scanned) {
      if (entry.repo) byRepo.set(entry.repo, entry);
    }
    for (const gh of remoteRepos) {
      if (gh.archived || gh.disabled) continue;
      if (isCloneExcluded(gh, config)) continue;
      const slug = `${githubUser}/${gh.name}`;
      if (byRepo.has(slug)) continue;
      missingOnDisk.push(gh);
    }
  } catch (error) {
    console.warn(`[sync] listUserRepos: ${error.message}`);
  }

  if (cloneMissing && missingOnDisk.length) {
    const cloneRoot = config.clone?.targetRoot || config.roots.find((r) => r.id === "tool")?.path;
    const toClone = missingOnDisk.filter((gh) => !isCloneExcluded(gh, config));
    console.log(`[clone] target: ${cloneRoot} (${toClone.length} to clone, ${missingOnDisk.length - toClone.length} excluded)`);
    for (const gh of toClone) {
      const result = await cloneGithubRepoAsync(gh, config, token, dryRun);
      cloneResults.push({ repo: `${githubUser}/${gh.name}`, ...result });
      if (result.status === "cloned" || result.status === "would-clone") {
        console.log(`[clone] ${result.status}: ${result.targetDir || result.detail}`);
      } else if (result.status === "error") {
        console.warn(`[clone] ${gh.name}: ${result.detail}`);
      }
    }
    if (!dryRun && cloneResults.some((r) => r.status === "cloned")) {
      ({ entries: scanned } = scanAllRoots(undefined, { writeManifest: true }));
      byRepo.clear();
      for (const entry of scanned) {
        if (entry.repo) byRepo.set(entry.repo, entry);
      }
    }
  }

  for (const entry of scanned) {
    if (entry.assetKind !== "project" || !entry.repo) continue;
    const result = await syncOneManifest(entry, token, dryRun);
    syncResults.push(result);
    entry.sync = {
      manifest: result.status,
      detail: result.detail,
      at: new Date().toISOString(),
    };
    if (entry.repo) byRepo.set(entry.repo, entry);
    await enrichGithubVersion(entry, token);
  }

  for (const gh of missingOnDisk) {
    const slug = `${githubUser}/${gh.name}`;
    if (byRepo.has(slug)) continue;
    const entry = githubOnlyEntry(gh, githubUser);
    entry.sync = { manifest: "github-only", detail: "no-local-folder", at: new Date().toISOString() };
    await enrichGithubVersion(entry, token);
    const cloneMeta = cloneResults.find((r) => r.repo === slug);
    if (cloneMeta) {
      entry.sync = {
        ...entry.sync,
        clone: cloneMeta.status,
        cloneDetail: cloneMeta.detail,
      };
    }
    scanned.push(entry);
    githubOnly++;
  }

  for (const entry of scanned) {
    if (entry.assetKind === "n8n-workflow") continue;
    if (entry.githubVersion !== undefined) continue;
    await enrichGithubVersion(entry, token);
  }

  const toolEntries = scanned.filter((e) => e.assetKind === "project" && e.workspaceRoot === "tool");
  const registry = {
    generatedAt: new Date().toISOString(),
    root: config.roots.find((r) => r.id === "tool")?.path || "",
    repositories: toolEntries.map(({ workspaceRoot, assetKind, sync, githubMeta, ...repo }) => repo),
  };

  const catalog = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    dryRun,
    githubUser,
    roots: config.roots,
    summary: {
      total: scanned.length,
      projects: scanned.filter((e) => e.assetKind === "project").length,
      n8n: scanned.filter((e) => e.assetKind === "n8n-workflow").length,
      githubOnly,
      pushed: syncResults.filter((r) => r.status === "pushed").length,
      pulled: syncResults.filter((r) => r.status === "pulled").length,
      inSync: syncResults.filter((r) => r.status === "in-sync").length,
      errors: syncResults.filter((r) => r.status === "error").length,
      cloned: cloneResults.filter((r) => r.status === "cloned").length,
      cloneErrors: cloneResults.filter((r) => r.status === "error").length,
      versionDrift: scanned.filter((e) => e.versionDrift === "drift").length,
    },
    syncResults,
    cloneResults: cloneMissing ? cloneResults : undefined,
    entries: scanned,
  };

  if (!dryRun) {
    fs.mkdirSync(path.dirname(catalogPath), { recursive: true });
    fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    fs.writeFileSync(localRegistryPath, `${JSON.stringify(registry, null, 2)}\n`);

    const existingDefault = readJson(defaultRegistryPath) || [];
    const { merged, addedNew, updatedExisting } = mergeRegistryDefault(existingDefault, toolEntries);
    fs.writeFileSync(defaultRegistryPath, `${JSON.stringify(merged, null, 2)}\n`);

    console.log(`Wrote ${catalogPath}`);
    console.log(`Wrote ${localRegistryPath} (${toolEntries.length} tool projects)`);
    console.log(`Synced ${defaultRegistryPath} (+${addedNew} new, ~${updatedExisting} updates)`);
  }

  console.log("\n--- Sync summary ---");
  console.log(JSON.stringify(catalog.summary, null, 2));
  if (dryRun) console.log("(dry-run: no files written)");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
