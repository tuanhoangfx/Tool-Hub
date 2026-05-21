const { execSync } = require("node:child_process");

const API = "https://api.github.com";

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN?.trim()) return process.env.GITHUB_TOKEN.trim();
  try {
    return execSync("gh auth token", { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

async function githubRequest(pathname, init = {}, token) {
  const response = await fetch(`${API}${pathname}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const msg = typeof data === "object" && data?.message ? data.message : `HTTP ${response.status}`;
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }
  return data;
}

async function fetchFileContent(repo, branch, filePath, token) {
  try {
    const data = await githubRequest(
      `/repos/${repo}/contents/${filePath.replace(/\\/g, "/")}?ref=${encodeURIComponent(branch)}`,
      {},
      token,
    );
    if (!data || data.type !== "file" || !data.content) return null;
    const text = Buffer.from(data.content, "base64").toString("utf8");
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
    return { sha: data.sha, text, json, updatedAt: json?.manifestUpdatedAt };
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function putFileContent(repo, branch, filePath, object, message, sha, token) {
  const content = Buffer.from(`${JSON.stringify(object, null, 2)}\n`, "utf8").toString("base64");
  const body = { message, content, branch };
  if (sha) body.sha = sha;
  return githubRequest(
    `/repos/${repo}/contents/${filePath.replace(/\\/g, "/")}`,
    { method: "PUT", body: JSON.stringify(body) },
    token,
  );
}

async function fetchRemoteVersion(repo, branch, token) {
  const manifestPath = "tool.manifest.json";
  const manifest = await fetchFileContent(repo, branch || "main", manifestPath, token);
  const fromManifest = manifest?.json?.release?.version;
  if (fromManifest) {
    return { version: String(fromManifest), source: "manifest", manifestUpdatedAt: manifest.json?.manifestUpdatedAt };
  }
  const pkg = await fetchFileContent(repo, branch || "main", "package.json", token);
  const fromPkg = pkg?.json?.version;
  if (fromPkg) {
    return { version: String(fromPkg), source: "package.json" };
  }
  return null;
}

async function listUserRepos(username, token) {
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await githubRequest(
      `/users/${username}/repos?per_page=100&page=${page}&sort=updated`,
      {},
      token,
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

module.exports = {
  getGitHubToken,
  fetchFileContent,
  putFileContent,
  fetchRemoteVersion,
  listUserRepos,
};
