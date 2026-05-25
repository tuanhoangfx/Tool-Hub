/**
 * Version pipeline: sync manifest, bump+commit, git push (cwd = tool repo).
 */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, execSync } = require("node:child_process");
const { bumpAndSyncDocs, readLatestChangelogVersion, updateChangelogCommitHash } = require("./lib/version-bump.cjs");

const WORKSPACE_ROOT = process.env.TOOL_WORKSPACE_ROOT || "E:\\Dev\\Tool";

function parseArgs(argv) {
  const out = {
    cwd: "",
    version: "",
    branch: "main",
    actions: [],
    bumpOnCommit: true,
    commitTitle: "",
  };
  for (const arg of argv) {
    if (arg.startsWith("--cwd=")) out.cwd = arg.slice(6);
    else if (arg.startsWith("--version=")) out.version = arg.slice(10);
    else if (arg.startsWith("--branch=")) out.branch = arg.slice(9);
    else if (arg.startsWith("--action=")) out.actions.push(arg.slice(9));
    else if (arg === "--no-bump") out.bumpOnCommit = false;
    else if (arg.startsWith("--title=")) out.commitTitle = arg.slice(8);
  }
  if (!out.actions.length) out.actions = ["sync", "commit", "push"];
  return out;
}

function assertAllowedCwd(cwd) {
  const resolved = path.resolve(cwd);
  const root = path.resolve(WORKSPACE_ROOT);
  if (!resolved.startsWith(root)) {
    throw new Error(`cwd is outside the workspace: ${resolved}`);
  }
  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory not found: ${resolved}`);
  }
  return resolved;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function runGit(cwd, args, opts = {}) {
  const env = opts.skipVersionHook
    ? { ...process.env, TOOL_HUB_SKIP_VERSION_HOOK: "1" }
    : process.env;
  if (opts.shell) {
    return execSync(["git", ...args].join(" "), {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env,
    }).trim();
  }
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env,
  }).trim();
}

function isGitRepo(cwd) {
  try {
    runGit(cwd, ["rev-parse", "--is-inside-work-tree"]);
    return true;
  } catch {
    return false;
  }
}

function syncManifest(cwd, version) {
  const pkgPath = path.join(cwd, "package.json");
  const manifestPath = path.join(cwd, "tool.manifest.json");
  const pkg = readJson(pkgPath);
  const manifest = readJson(manifestPath);
  if (!manifest) {
    return { step: "sync", ok: false, detail: "Missing tool.manifest.json" };
  }
  const changelogVersion = readLatestChangelogVersion(cwd);
  const v = (changelogVersion || version || pkg?.version || "").trim();
  if (!v) {
    return { step: "sync", ok: false, detail: "Missing version (package.json)" };
  }
  if (pkg && pkg.version !== v) {
    pkg.version = v;
    writeJson(pkgPath, pkg);
  }
  manifest.release = manifest.release || {};
  manifest.release.version = v;
  manifest.manifestUpdatedAt = new Date().toISOString();
  writeJson(manifestPath, manifest);
  return { step: "sync", ok: true, detail: `Synced manifest + package to v${v}`, version: v };
}

function commitWithAutoBump(cwd, { bumpOnCommit, commitTitle, fallbackVersion }) {
  if (!isGitRepo(cwd)) {
    return { step: "commit", ok: false, detail: "Not a git repository", version: fallbackVersion };
  }

  let version = fallbackVersion;
  const steps = [];

  try {
    if (bumpOnCommit) {
      const bumped = bumpAndSyncDocs(cwd, {
        title: commitTitle || "Auto bump on commit",
        changeLine: "Synchronized version across package, manifest, and CHANGELOG.",
      });
      version = bumped.version;
      steps.push({
        step: "bump",
        ok: true,
        detail: `v${bumped.previousVersion} -> v${version} (package, manifest, CHANGELOG)`,
      });
    } else {
      const sync = syncManifest(cwd, version);
      steps.push(sync);
      if (!sync.ok) {
        return { step: "commit", ok: false, detail: sync.detail, version, subSteps: steps };
      }
    }

    runGit(cwd, ["add", "-A"]);
    const status = runGit(cwd, ["status", "--porcelain"]);
    if (!status) {
      return {
        step: "commit",
        ok: true,
        skipped: true,
        detail: "No changes to commit",
        version,
        subSteps: steps,
      };
    }

    const msg = `chore(release): v${version}`;
    runGit(cwd, ["commit", "-m", msg], { skipVersionHook: true });
    steps.push({ step: "commit", ok: true, detail: msg });

    if (bumpOnCommit) {
      const hash = runGit(cwd, ["rev-parse", "--short", "HEAD"]);
      updateChangelogCommitHash(cwd, version, hash);
      runGit(cwd, ["add", "CHANGELOG.md"]);
      const amendStatus = runGit(cwd, ["status", "--porcelain"]);
      if (amendStatus) {
        runGit(cwd, ["commit", "--amend", "--no-edit"], { skipVersionHook: true });
        steps.push({ step: "changelog", ok: true, detail: `CHANGELOG Commit: ${hash}` });
      }
    }

    return {
      step: "commit",
      ok: true,
      detail: bumpOnCommit ? `Bumped and committed v${version}` : `Committed v${version}`,
      version,
      subSteps: steps,
    };
  } catch (err) {
    const stderr = err.stderr?.toString?.() || err.message;
    return { step: "commit", ok: false, detail: stderr.slice(0, 500), version, subSteps: steps };
  }
}

function pushRemote(cwd, branch, version) {
  if (!isGitRepo(cwd)) {
    return { step: "push", ok: false, detail: "Not a git repository" };
  }
  try {
    const out = runGit(cwd, ["push", "origin", branch], { shell: true });
    let detail = out || `Pushed origin/${branch}`;
    try {
      const tag = version.startsWith("v") ? version : `v${version}`;
      try {
        runGit(cwd, ["tag", tag], { shell: true });
      } catch {
        runGit(cwd, ["tag", "-f", tag], { shell: true });
      }
      runGit(cwd, ["push", "origin", tag], { shell: true });
      detail += ` · tag ${tag}`;
    } catch {
      /* tag optional */
    }
    return { step: "push", ok: true, detail };
  } catch (err) {
    const stderr = err.stderr?.toString?.() || err.message;
    return { step: "push", ok: false, detail: stderr.slice(0, 500) };
  }
}

function flattenSteps(steps) {
  const flat = [];
  for (const s of steps) {
    if (s.subSteps) flat.push(...s.subSteps);
    flat.push({ step: s.step, ok: s.ok, skipped: s.skipped, detail: s.detail });
  }
  return flat;
}

function runPipeline({ cwd, version, branch, actions, bumpOnCommit = true, commitTitle = "" }) {
  const root = assertAllowedCwd(cwd);
  const pkg = readJson(path.join(root, "package.json"));
  const changelogVersion = readLatestChangelogVersion(root);
  let resolvedVersion = (version || changelogVersion || pkg?.version || "").trim();
  if (!resolvedVersion) {
    return { ok: false, version: "", steps: [{ step: "sync", ok: false, detail: "Missing version" }] };
  }

  const steps = [];

  for (const action of actions) {
    if (action === "sync") {
      const result = syncManifest(root, resolvedVersion);
      if (result.version) resolvedVersion = result.version;
      steps.push(result);
    } else if (action === "commit") {
      const result = commitWithAutoBump(root, {
        bumpOnCommit,
        commitTitle,
        fallbackVersion: resolvedVersion,
      });
      if (result.version) resolvedVersion = result.version;
      steps.push(result);
    } else if (action === "push") {
      steps.push(pushRemote(root, branch || "main", resolvedVersion));
    }
  }

  const flat = flattenSteps(steps);
  const ok = flat.every((s) => s.ok || s.skipped);
  return { ok, version: resolvedVersion, cwd: root, steps: flat, bumpOnCommit };
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  const result = runPipeline(args);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

module.exports = { runPipeline };
