/**
 * Bump patch semver + đồng bộ package.json, tool.manifest.json, CHANGELOG.md
 */
const fs = require("node:fs");
const path = require("node:path");

function parseSemver(v) {
  const m = String(v || "")
    .trim()
    .replace(/^v/i, "")
    .match(/^(\d+)\.(\d+)\.(\d+)(?:-.*)?$/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function bumpPatch(version) {
  const p = parseSemver(version);
  if (!p) return "0.1.0";
  return `${p.major}.${p.minor}.${p.patch + 1}`;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function formatTimestampUtc7() {
  const now = new Date();
  const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${utc7.getUTCFullYear()}-${pad(utc7.getUTCMonth() + 1)}-${pad(utc7.getUTCDate())} ${pad(utc7.getUTCHours())}:${pad(utc7.getUTCMinutes())} (UTC+7)`;
}

function todayHeading() {
  const now = new Date();
  const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${utc7.getUTCFullYear()}-${pad(utc7.getUTCMonth() + 1)}-${pad(utc7.getUTCDate())}`;
}

function buildChangelogBlock(version, { title, changeLine, commitHash }) {
  const lines = [
    `## ${todayHeading()} - ${title}`,
    "",
    `- Version: \`${version}\``,
    `- Timestamp: ${formatTimestampUtc7()}`,
    `- Commit: ${commitHash || "pending"}`,
    "- Type: Patch",
    "- Status: Draft",
    "",
    "### Changes",
    "",
    `- ${changeLine}`,
    "",
    "### Verification",
    "",
    "- pending",
    "",
    "---",
    "",
  ];
  return lines.join("\n");
}

function prependChangelog(cwd, version, opts = {}) {
  const changelogPath = path.join(cwd, "CHANGELOG.md");
  const title = opts.title || "Tool Hub pipeline bump";
  const changeLine = opts.changeLine || `Release v${version} — auto bump on commit.`;
  const block = buildChangelogBlock(version, { title, changeLine, commitHash: opts.commitHash });

  let existing = "";
  if (fs.existsSync(changelogPath)) {
    existing = fs.readFileSync(changelogPath, "utf8");
  } else {
    existing = "# Changelog\n\n";
  }

  if (!existing.startsWith("# Changelog")) {
    existing = `# Changelog\n\n${existing}`;
  }

  const body = existing.replace(/^# Changelog\s*\n+/i, "");
  fs.writeFileSync(changelogPath, `# Changelog\n\n${block}${body}`, "utf8");
  return changelogPath;
}

function updateChangelogCommitHash(cwd, version, commitHash) {
  const changelogPath = path.join(cwd, "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) return;
  let text = fs.readFileSync(changelogPath, "utf8");
  const needle = `- Version: \`${version}\``;
  const idx = text.indexOf(needle);
  if (idx < 0) return;
  const slice = text.slice(idx, idx + 800);
  const updated = slice.replace(/- Commit: pending/g, `- Commit: \`${commitHash}\``);
  text = text.slice(0, idx) + updated + text.slice(idx + slice.length);
  fs.writeFileSync(changelogPath, text, "utf8");
}

/**
 * Tăng patch + ghi đồng bộ mọi file tài liệu.
 * @returns {{ version: string, previousVersion: string }}
 */
function bumpAndSyncDocs(cwd, opts = {}) {
  const pkgPath = path.join(cwd, "package.json");
  const manifestPath = path.join(cwd, "tool.manifest.json");
  const pkg = readJson(pkgPath) || { version: "0.1.0" };
  const previousVersion = (pkg.version || "0.1.0").trim();
  const version = bumpPatch(previousVersion);

  pkg.version = version;
  writeJson(pkgPath, pkg);

  const manifest = readJson(manifestPath);
  if (manifest) {
    manifest.release = manifest.release || {};
    manifest.release.version = version;
    manifest.manifestUpdatedAt = new Date().toISOString();
    writeJson(manifestPath, manifest);
  }

  prependChangelog(cwd, version, {
    title: opts.title,
    changeLine: opts.changeLine || `Bump ${previousVersion} → ${version} (${opts.title || "commit"}).`,
    commitHash: opts.commitHash,
  });

  return { version, previousVersion };
}

module.exports = {
  bumpPatch,
  bumpAndSyncDocs,
  prependChangelog,
  updateChangelogCommitHash,
  parseSemver,
};
