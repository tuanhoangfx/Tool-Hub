const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const cwd = path.resolve(__dirname, "..");
const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER || "tuanhoangfx";
const repo = process.env.GITHUB_REPO || "Tool-Hub";
const description =
  process.env.GITHUB_DESCRIPTION ||
  "Public catalog and GitHub operations console for published workspace tools.";
const pushOnce = process.argv.includes("--push-once");

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: options.stdio || "pipe",
  });

  return typeof output === "string" ? output.trim() : "";
}

async function github(pathname, init = {}) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const message = data?.message || `GitHub API HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function ensureRepo() {
  try {
    return await github(`/repos/${owner}/${repo}`);
  } catch (error) {
    if (!String(error.message).includes("Not Found")) {
      throw error;
    }
  }

  return github("/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name: repo,
      description,
      private: false,
      has_issues: true,
      has_projects: false,
      has_wiki: false,
    }),
  });
}

async function main() {
  if (!token) {
    throw new Error("Set GITHUB_TOKEN before running publish:github:init.");
  }

  await ensureRepo();

  const cleanRemoteUrl = `https://github.com/${owner}/${repo}.git`;

  if (!fs.existsSync(path.join(cwd, ".git"))) {
    run("git", ["init"], { stdio: "inherit" });
    run("git", ["checkout", "-b", "main"], { stdio: "inherit" });
  }

  const remotes = run("git", ["remote"]);
  if (!remotes.split(/\s+/).includes("origin")) {
    run("git", ["remote", "add", "origin", cleanRemoteUrl], { stdio: "inherit" });
  } else {
    run("git", ["remote", "set-url", "origin", cleanRemoteUrl], { stdio: "inherit" });
  }

  console.log(`Repository ready: https://github.com/${owner}/${repo}`);
  console.log("Day-to-day push: pnpm run push  (uses gh auth, no PAT in remote URL).");
  console.log("Production web: connect repo on Vercel — see docs/DEPLOY-VERCEL.md");

  if (!pushOnce) {
    return;
  }

  const pushRemoteUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
  try {
    run("git", ["remote", "set-url", "origin", pushRemoteUrl], { stdio: "inherit" });
    run("git", ["add", "-A"], { stdio: "inherit" });
    const status = run("git", ["status", "--porcelain"]);
    if (status) {
      run("git", ["commit", "-m", "Initial publish Tool Hub"], { stdio: "inherit" });
    }
    run("git", ["push", "-u", "origin", "HEAD:main"], { stdio: "inherit" });
  } finally {
    run("git", ["remote", "set-url", "origin", cleanRemoteUrl], { stdio: "inherit" });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
