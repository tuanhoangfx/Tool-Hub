const fs = require("node:fs");
const path = require("node:path");

const workspaceRoot = process.env.TOOL_WORKSPACE || path.resolve(__dirname, "..", "..");
const outputPath = path.resolve(__dirname, "..", "public", "local-registry.json");
const defaultRegistryPath = path.resolve(__dirname, "..", "public", "registry.default.json");

// Fields where scanner output should override curated catalog (filesystem facts
// that drift over time). Everything else (summary, tags, audience, usage…) stays
// curated so manual edits in registry.default.json are not blown away.
/** Historical production URL setup (ISO UTC) — only applied when urls.app exists but appSetupAt is missing. */
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

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return undefined;
  }
}

function normalizeRepo(value) {
  if (!value) return "";
  if (typeof value === "string") {
    return value.replace(/^git\+/, "").replace(/^https:\/\/github\.com\//i, "").replace(/\.git$/i, "");
  }
  return normalizeRepo(value.url);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
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
  if (!had) {
    urls[setupKey] = manifestUpdatedAt || now;
  } else if (previous && previous !== url) {
    urls[setupKey] = now;
  } else if (!urls[setupKey]) {
    urls[setupKey] = manifestUpdatedAt || now;
  }
}

// Detect dev server port from common config locations.
function detectLocalPort(dir, packageJson) {
  // 1. Vite config in repo root
  for (const name of ["vite.config.ts", "vite.config.js", "vite.config.mjs"]) {
    const content = readFile(path.join(dir, name));
    const match = content.match(/port\s*:\s*(\d{4,5})/);
    if (match) return parseInt(match[1], 10);
  }
  // 2. Vite config in /web subfolder
  for (const sub of ["web", "app", "client"]) {
    for (const name of ["vite.config.ts", "vite.config.js", "vite.config.mjs"]) {
      const content = readFile(path.join(dir, sub, name));
      const match = content.match(/port\s*:\s*(\d{4,5})/);
      if (match) return parseInt(match[1], 10);
    }
  }
  // 3. package.json scripts (e.g. "vite --port 5174")
  const scripts = packageJson?.scripts || {};
  for (const cmd of Object.values(scripts)) {
    if (typeof cmd !== "string") continue;
    const m = cmd.match(/--port[= ]+(\d{4,5})/);
    if (m) return parseInt(m[1], 10);
  }
  // 4. config.example.json admin.port
  const cfg = readJson(path.join(dir, "config.example.json")) || readJson(path.join(dir, "config.json"));
  if (cfg?.admin?.port) return cfg.admin.port;
  if (cfg?.server?.port) return cfg.server.port;
  // 5. Next.js default
  if (fs.existsSync(path.join(dir, "next.config.mjs")) || fs.existsSync(path.join(dir, "app", "next.config.mjs"))) {
    return 3000;
  }
  return undefined;
}

// Heuristic deploy target detection.
function detectDeployTarget(dir, manifest, packageJson) {
  if (manifest?.deployTarget) return manifest.deployTarget;
  if (fs.existsSync(path.join(dir, "vercel.json"))) return "vercel";
  if (fs.existsSync(path.join(dir, ".github", "workflows", "deploy-pages.yml"))) return "github-pages";
  const deps = { ...(packageJson?.dependencies || {}), ...(packageJson?.devDependencies || {}) };
  if (deps["electron"]) return "github-release";
  if (deps["next"]) return "vercel";
  if (fs.existsSync(path.join(dir, "deploy.bat")) || fs.existsSync(path.join(dir, "scripts", "deploy-remote.mjs"))) return "vps";
  return "local";
}

function resolveLocalUrl(dir, manifest, packageJson) {
  const port = detectLocalPort(dir, packageJson);
  const detected = port ? `http://127.0.0.1:${port}` : undefined;
  const explicit = manifest?.urls?.local || manifest?.urls?.admin;
  // Filesystem port (vite/next/config) wins over stale manifest URLs.
  if (detected) return detected;
  if (explicit) return normalizeLocalHost(explicit);
  return undefined;
}

/** Write urls + release.version back to each tool.manifest.json (source of truth on disk). */
function syncToolManifest(dir, { localUrl, appUrl, localVersion }) {
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

function toToolRepository(dir, index) {
  const manifestPath = path.join(dir, "tool.manifest.json");
  const packagePath = path.join(dir, "package.json");
  let manifest = readJson(manifestPath);
  const packageJson = readJson(packagePath);

  if (!manifest && !packageJson) {
    return undefined;
  }

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

  if (syncToolManifest(dir, { localUrl, appUrl, localVersion })) {
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
    summary: manifest?.summary || packageJson?.description || "Local workspace tool discovered by scanner.",
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
      : ["scripts/sync-changelog.mjs", "scripts/sync-metadata-version.mjs"],
  };
}

let manifestSyncCount = 0;

const repositories = fs
  .readdirSync(workspaceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules")
  .map((entry, index) => {
    const dir = path.join(workspaceRoot, entry.name);
    const before = readJson(path.join(dir, "tool.manifest.json"));
    const repo = toToolRepository(dir, index);
    const after = readJson(path.join(dir, "tool.manifest.json"));
    if (before && after && JSON.stringify(before) !== JSON.stringify(after)) manifestSyncCount++;
    return repo;
  })
  .filter(Boolean)
  .filter((repo) => repo.repo || repo.remoteEnabled === false);

const registry = {
  generatedAt: new Date().toISOString(),
  root: workspaceRoot,
  repositories,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Wrote ${repositories.length} repositories to ${outputPath}`);
if (manifestSyncCount > 0) {
  console.log(`Updated ${manifestSyncCount} tool.manifest.json file(s) under ${workspaceRoot}`);
}

// --- Sync registry.default.json (the curated catalog read by the SPA) ----
//
// Strategy: merge scanner output into existing curated registry.
//   - Existing entry: keep curated fields, overwrite only filesystem facts.
//   - Brand new entry on disk: append scanner output as a starter row that
//     the maintainer can refine by editing the JSON.
//   - Curated entry without matching folder on disk: keep (could be archived
//     or moved — manual decision, never auto-delete).
const existingDefault = readJson(defaultRegistryPath) || [];
const curatedById = new Map(existingDefault.map((entry) => [entry.id, entry]));

const merged = [];
const seenIds = new Set();
let addedNew = 0;
let updatedExisting = 0;

for (const scanned of repositories) {
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
    merged.push(scanned);
    addedNew++;
  }
  seenIds.add(scanned.id);
}

// Keep curated entries that the scanner did not see this run.
for (const entry of existingDefault) {
  if (!seenIds.has(entry.id)) merged.push(entry);
}

fs.writeFileSync(defaultRegistryPath, `${JSON.stringify(merged, null, 2)}\n`);
console.log(
  `Synced ${defaultRegistryPath} (${merged.length} entries, +${addedNew} new, ~${updatedExisting} path/version updates)`,
);
