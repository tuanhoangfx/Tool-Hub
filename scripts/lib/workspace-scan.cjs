const fs = require("node:fs");
const path = require("node:path");

const APP_SETUP_AT_BACKFILL = {
  "github-tool-manager": "2026-04-29T17:00:00.000Z",
  "zalo-ai-bot": "2026-05-19T11:55:00.000Z",
  "9router-infra": "2026-05-16T17:00:00.000Z",
  "mie-hair-performance": "2026-05-19T17:00:00.000Z",
};

const SCANNER_AUTHORITATIVE = [
  "localPath",
  "localVersion",
  "localUrl",
  "appUrl",
  "deployTarget",
  "remoteEnabled",
];

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "schemas",
  "docs",
  "Backup",
  "Reference",
  "Rules",
  "Web App",
]);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return undefined;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function normalizeRepo(value) {
  if (!value) return "";
  if (typeof value === "string") {
    return value.replace(/^git\+/, "").replace(/^https:\/\/github\.com\//i, "").replace(/\.git$/i, "");
  }
  return normalizeRepo(value.url);
}

function normalizeLocalHost(url) {
  if (!url || typeof url !== "string") return url;
  return url.replace(/^http:\/\/localhost\b/i, "http://127.0.0.1");
}

function stampUrlSetup(urls, key, url, now, previous, manifestUpdatedAt) {
  const setupKey = `${key}SetupAt`;
  if (!url) return;
  const had = urls[key];
  urls[key] = url;
  if (!had) urls[setupKey] = manifestUpdatedAt || now;
  else if (previous && previous !== url) urls[setupKey] = now;
  else if (!urls[setupKey]) urls[setupKey] = manifestUpdatedAt || now;
}

function detectLocalPort(dir, packageJson) {
  for (const name of ["vite.config.ts", "vite.config.js", "vite.config.mjs"]) {
    const content = readFile(path.join(dir, name));
    const match = content.match(/port\s*:\s*(\d{4,5})/);
    if (match) return parseInt(match[1], 10);
  }
  for (const sub of ["web", "app", "client"]) {
    for (const name of ["vite.config.ts", "vite.config.js", "vite.config.mjs"]) {
      const content = readFile(path.join(dir, sub, name));
      const match = content.match(/port\s*:\s*(\d{4,5})/);
      if (match) return parseInt(match[1], 10);
    }
  }
  const scripts = packageJson?.scripts || {};
  for (const cmd of Object.values(scripts)) {
    if (typeof cmd !== "string") continue;
    const m = cmd.match(/--port[= ]+(\d{4,5})/);
    if (m) return parseInt(m[1], 10);
  }
  const cfg = readJson(path.join(dir, "config.example.json")) || readJson(path.join(dir, "config.json"));
  if (cfg?.admin?.port) return cfg.admin.port;
  if (cfg?.server?.port) return cfg.server.port;
  if (fs.existsSync(path.join(dir, "next.config.mjs")) || fs.existsSync(path.join(dir, "app", "next.config.mjs"))) {
    return 3000;
  }
  return undefined;
}

function detectDeployTarget(dir, manifest, packageJson) {
  if (manifest?.deployTarget) return manifest.deployTarget;
  if (fs.existsSync(path.join(dir, "vercel.json"))) return "vercel";
  const deps = { ...(packageJson?.dependencies || {}), ...(packageJson?.devDependencies || {}) };
  if (deps.next) return "vercel";
  if (fs.existsSync(path.join(dir, ".github", "workflows", "deploy-pages.yml"))) return "github-pages";
  if (deps.electron) return "github-release";
  if (fs.existsSync(path.join(dir, "deploy.bat")) || fs.existsSync(path.join(dir, "scripts", "deploy-remote.mjs"))) {
    return "vps";
  }
  return "local";
}

function resolveLocalUrl(dir, manifest, packageJson) {
  const port = detectLocalPort(dir, packageJson);
  const detected = port ? `http://127.0.0.1:${port}` : undefined;
  const explicit = manifest?.urls?.local || manifest?.urls?.admin;
  if (detected) return detected;
  if (explicit) return normalizeLocalHost(explicit);
  return undefined;
}

function syncToolManifestOnDisk(dir, { localUrl, appUrl, localVersion }) {
  const manifestPath = path.join(dir, "tool.manifest.json");
  const manifest = readJson(manifestPath);
  if (!manifest) return false;

  const now = new Date().toISOString();
  let changed = false;
  if (!manifest.urls) manifest.urls = {};

  const pkgVersion = localVersion && localVersion !== "local" ? localVersion : undefined;
  if (pkgVersion) {
    if (!manifest.release) manifest.release = {};
    if (manifest.release.version !== pkgVersion) {
      manifest.release.version = pkgVersion;
      changed = true;
    }
  }

  const normalizedLocal = localUrl ? normalizeLocalHost(localUrl) : undefined;
  if (normalizedLocal) {
    const prev = manifest.urls.local || manifest.urls.admin;
    if (manifest.urls.admin && !manifest.urls.local) {
      if (manifest.urls.admin !== normalizedLocal) {
        stampUrlSetup(manifest.urls, "admin", normalizedLocal, now, prev, manifest.manifestUpdatedAt);
        changed = true;
      }
    } else if (manifest.urls.local !== normalizedLocal) {
      stampUrlSetup(manifest.urls, "local", normalizedLocal, now, prev, manifest.manifestUpdatedAt);
      changed = true;
    }
  }

  const normalizedApp = appUrl ? normalizeLocalHost(appUrl) : undefined;
  if (normalizedApp && manifest.urls.app !== normalizedApp) {
    const prevApp = manifest.urls.app;
    stampUrlSetup(manifest.urls, "app", normalizedApp, now, prevApp, manifest.manifestUpdatedAt);
    changed = true;
  }

  if (manifest.urls.app && !manifest.urls.appSetupAt) {
    const backfill = APP_SETUP_AT_BACKFILL[manifest.id];
    if (backfill) {
      manifest.urls.appSetupAt = backfill;
      changed = true;
    }
  }

  if (changed) {
    manifest.manifestUpdatedAt = now;
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }

  return changed;
}

function toProjectEntry(dir, index, workspaceRootId, options = {}) {
  const { writeManifest = true } = options;
  const manifestPath = path.join(dir, "tool.manifest.json");
  const packagePath = path.join(dir, "package.json");
  let manifest = readJson(manifestPath);
  const packageJson = readJson(packagePath);

  if (!manifest && !packageJson) return undefined;

  const folderName = path.basename(dir);
  const repo = manifest?.github?.repo || normalizeRepo(packageJson?.repository);
  const id =
    manifest?.id ||
    packageJson?.name ||
    folderName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const localUrl = resolveLocalUrl(dir, manifest, packageJson);
  const appUrl = manifest?.urls?.app;
  const localVersion = packageJson?.version || manifest?.release?.version || "local";
  const deployTarget = detectDeployTarget(dir, manifest, packageJson);

  if (writeManifest && syncToolManifestOnDisk(dir, { localUrl, appUrl, localVersion })) {
    manifest = readJson(manifestPath);
  }

  return {
    id,
    code: manifest?.code || `LOCAL-${String(index + 1).padStart(3, "0")}`,
    name: manifest?.name || folderName,
    repo: repo || "",
    branch: manifest?.github?.branch || "main",
    remoteEnabled: Boolean(repo),
    localVersion,
    category: manifest?.type || "Local",
    audience: "Tool maintainers",
    status: manifest?.status || "Needs review",
    summary: manifest?.summary || packageJson?.description || "Local workspace asset discovered by scanner.",
    localPath: dir,
    tags: manifest?.stack || ["Local", "Workspace"],
    appUrl: manifest?.urls?.app || appUrl,
    localUrl: manifest?.urls?.local || manifest?.urls?.admin || localUrl,
    deployTarget,
    usage: [
      manifest?.commands?.dev ? `Dev: ${manifest.commands.dev}` : "Run the configured dev command from package.json.",
      manifest?.commands?.build ? `Build: ${manifest.commands.build}` : "Run the configured build command from package.json.",
      manifest?.urls?.app ? `App: ${manifest.urls.app}` : undefined,
    ].filter(Boolean),
    downloadHint: "Use GitHub release asset when available, otherwise clone the repository.",
    manifestPath: manifest?.github?.manifestPath || "tool.manifest.json",
    trackedFiles: ["tool.manifest.json", "package.json", "README.md", "CHANGELOG.md", "RELEASE.md"],
    scriptFiles: fs.existsSync(path.join(dir, "scripts"))
      ? fs
          .readdirSync(path.join(dir, "scripts"))
          .filter((file) => /\.(cjs|mjs|js|ps1)$/i.test(file))
          .slice(0, 6)
          .map((file) => `scripts/${file}`)
      : [],
    workspaceRoot: workspaceRootId,
    assetKind: "project",
  };
}

function scanProjectRoot(rootPath, workspaceRootId, options) {
  if (!fs.existsSync(rootPath)) return [];
  const entries = [];
  let index = 0;
  for (const entry of fs.readdirSync(rootPath, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".") || SKIP_DIR_NAMES.has(entry.name)) continue;
    const dir = path.join(rootPath, entry.name);
    const repo = toProjectEntry(dir, index++, workspaceRootId, options);
    if (repo && (repo.repo || repo.remoteEnabled === false)) entries.push(repo);
  }
  return entries;
}

function scanN8nRoot(rootPath, workspaceRootId) {
  if (!fs.existsSync(rootPath)) return [];
  const entries = [];
  let index = 0;
  for (const file of fs.readdirSync(rootPath)) {
    if (!file.endsWith(".json")) continue;
    const full = path.join(rootPath, file);
    if (!fs.statSync(full).isFile()) continue;
    const base = path.basename(file, ".json");
    const id = `n8n-${base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    entries.push({
      id,
      code: `N8N-${String(index + 1).padStart(3, "0")}`,
      name: base,
      repo: "",
      branch: "main",
      remoteEnabled: false,
      localVersion: "local",
      category: "Workflow",
      audience: "Tool maintainers",
      status: "Needs review",
      summary: `n8n workflow export (${file}).`,
      localPath: full,
      tags: ["n8n", "workflow"],
      deployTarget: "local",
      usage: [`Import ${file} into n8n instance.`],
      downloadHint: "Local JSON workflow file.",
      manifestPath: file,
      trackedFiles: [file],
      scriptFiles: [],
      workspaceRoot: workspaceRootId,
      assetKind: "n8n-workflow",
    });
    index++;
  }
  return entries;
}

function loadWorkspaceConfig(configPath) {
  const resolved =
    configPath ||
    process.env.WORKSPACE_ROOTS_CONFIG ||
    path.resolve(__dirname, "..", "..", "..", "workspace.roots.json");
  const config = readJson(resolved);
  if (!config?.roots?.length) {
    throw new Error(`Missing or invalid workspace config: ${resolved}`);
  }
  return { config, configPath: resolved };
}

function scanAllRoots(configPath, options = {}) {
  const { config } = loadWorkspaceConfig(configPath);
  const all = [];
  for (const root of config.roots) {
    if (!fs.existsSync(root.path)) {
      console.warn(`[scan] skip missing root: ${root.path}`);
      continue;
    }
    if (root.scan === "n8n-json") {
      all.push(...scanN8nRoot(root.path, root.id));
    } else {
      all.push(...scanProjectRoot(root.path, root.id, options));
    }
  }
  return { config, entries: all };
}

function mergeRegistryDefault(existingDefault, scannedEntries) {
  const curatedById = new Map((existingDefault || []).map((entry) => [entry.id, entry]));
  const merged = [];
  const seenIds = new Set();
  let addedNew = 0;
  let updatedExisting = 0;

  for (const scanned of scannedEntries) {
    const curated = curatedById.get(scanned.id);
    if (curated) {
      const next = { ...curated };
      for (const key of SCANNER_AUTHORITATIVE) {
        if (scanned[key] !== undefined && scanned[key] !== "" && scanned[key] !== next[key]) {
          next[key] = scanned[key];
          updatedExisting++;
        }
      }
      merged.push(next);
    } else {
      const { workspaceRoot, assetKind, ...repo } = scanned;
      merged.push(repo);
      addedNew++;
    }
    seenIds.add(scanned.id);
  }

  for (const entry of existingDefault || []) {
    if (seenIds.has(entry.id)) continue;
    const orphanLocal =
      typeof entry.code === "string" && entry.code.startsWith("LOCAL-");
    const missingPath = entry.localPath && !isProjectDir(entry.localPath);
    if (orphanLocal || missingPath) continue;
    merged.push(entry);
  }

  return { merged, addedNew, updatedExisting };
}

function isProjectDir(localPath) {
  return localPath && fs.existsSync(localPath) && fs.statSync(localPath).isDirectory();
}

module.exports = {
  APP_SETUP_AT_BACKFILL,
  SCANNER_AUTHORITATIVE,
  loadWorkspaceConfig,
  scanAllRoots,
  scanProjectRoot,
  mergeRegistryDefault,
  readJson,
  syncToolManifestOnDisk,
  toProjectEntry,
  isProjectDir,
  normalizeRepo,
};
