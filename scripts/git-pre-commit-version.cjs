#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { bumpAndSyncDocs } = require("./lib/version-bump.cjs");

function exists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function git(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, TOOL_HUB_SKIP_VERSION_HOOK: "1" },
  }).trim();
}

if (process.env.TOOL_HUB_SKIP_VERSION_HOOK === "1") {
  process.exit(0);
}

if (!exists("package.json") || !exists("tool.manifest.json") || !exists("CHANGELOG.md")) {
  console.log("[version-hook] Missing package/manifest/changelog; skipping version stamp.");
  process.exit(0);
}

const title = process.env.TOOL_HUB_VERSION_TITLE || "Git commit version stamp";
const result = bumpAndSyncDocs(process.cwd(), {
  title,
  changeLine: "Version stamp for git commit.",
});

git(["add", "package.json", "tool.manifest.json", "CHANGELOG.md"]);
console.log(`[version-hook] Staged v${result.version} for this commit.`);
