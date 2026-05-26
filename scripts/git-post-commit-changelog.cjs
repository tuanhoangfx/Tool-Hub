#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const {
  readLatestChangelogVersion,
  updateChangelogCommitHash,
} = require("./lib/version-bump.cjs");

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

if (!exists("CHANGELOG.md")) {
  console.log("[version-hook] Missing CHANGELOG.md; skipping commit hash stamp.");
  process.exit(0);
}

const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
const version = readLatestChangelogVersion(process.cwd());
const changelog = fs.readFileSync(changelogPath, "utf8");

if (!version || !changelog.includes("- Commit: pending")) {
  process.exit(0);
}

const commitHash = git(["rev-parse", "--short", "HEAD"]);
updateChangelogCommitHash(process.cwd(), version, commitHash);
git(["add", "CHANGELOG.md"]);
console.log(`[version-hook] Staged CHANGELOG commit hash ${commitHash} for the next commit.`);
