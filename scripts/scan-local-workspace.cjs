const fs = require("node:fs");
const path = require("node:path");

const workspaceRoot = process.env.TOOL_WORKSPACE || path.resolve(__dirname, "..", "..");
const outputPath = path.resolve(__dirname, "..", "public", "local-registry.json");

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
  if (fs.existsSync(path.join(dir, ".github", "workflows", "deploy-pages.yml"))) return "github-pages";
  if (fs.existsSync(path.join(dir, "vercel.json"))) return "vercel";
  const deps = { ...(packageJson?.dependencies || {}), ...(packageJson?.devDependencies || {}) };
  if (deps["electron"]) return "github-release";
  if (deps["next"]) return "vercel";
  if (fs.existsSync(path.join(dir, "deploy.bat")) || fs.existsSync(path.join(dir, "scripts", "deploy-remote.mjs"))) return "vps";
  return "local";
}

function toToolRepository(dir, index) {
  const manifestPath = path.join(dir, "tool.manifest.json");
  const packagePath = path.join(dir, "package.json");
  const manifest = readJson(manifestPath);
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
  const port = detectLocalPort(dir, packageJson);
  const localUrl = port ? `http://127.0.0.1:${port}` : undefined;
  const deployTarget = detectDeployTarget(dir, manifest, packageJson);

  return {
    id,
    code: manifest?.code || `LOCAL-${String(index + 1).padStart(3, "0")}`,
    name: manifest?.name || folderName,
    repo: repo || "",
    branch: manifest?.github?.branch || "main",
    remoteEnabled: Boolean(repo),
    localVersion: packageJson?.version || manifest?.release?.version || "local",
    category: manifest?.type || "Local",
    audience: "Tool maintainers",
    status: manifest?.status || "Needs review",
    summary: manifest?.summary || packageJson?.description || "Local workspace tool discovered by scanner.",
    localPath: dir,
    tags: manifest?.stack || ["Local", "Workspace"],
    appUrl: manifest?.urls?.app,
    localUrl,
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

const repositories = fs
  .readdirSync(workspaceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules")
  .map((entry, index) => toToolRepository(path.join(workspaceRoot, entry.name), index))
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
