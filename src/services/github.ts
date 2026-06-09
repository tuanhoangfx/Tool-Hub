import { memoFetchGitHubApi, memoFetchRawFile } from "../lib/github-api-cache";
import type {
  GitHubRelease,
  GitHubRepoInfo,
  PackageJson,
  RemoteFileState,
  ToolManifest,
  ToolRemoteState,
  ToolRepository,
} from "../types";

const REQUEST_TIMEOUT_MS = 9000;
const FILE_CACHE_TTL_MS = 5 * 60 * 1000;
const API_CACHE_TTL_MS = 5 * 60 * 1000;

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;

export function githubAuthHeaders(): Record<string, string> {
  return GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {};
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const isApiCall = url.startsWith("https://api.github.com");
  const authHeaders = isApiCall ? githubAuthHeaders() : {};

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json, text/plain, */*",
        ...authHeaders,
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export function repoUrl(repo: string) {
  return repo ? `https://github.com/${repo}` : "#";
}

export function rawFileUrl(repo: ToolRepository, path: string) {
  return `https://raw.githubusercontent.com/${repo.repo}/${repo.branch}/${path}`;
}

async function fetchRemoteFile(repo: ToolRepository, path: string): Promise<RemoteFileState> {
  const url = rawFileUrl(repo, path);

  try {
    const response = await fetchWithTimeout(url, { cache: "no-store" });
    const text = response.ok ? await response.text() : "";

    return {
      path,
      ok: response.ok,
      status: response.status,
      size: text.length,
      text,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      path,
      ok: false,
      status: 0,
      size: 0,
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  }
}

export async function readRemoteFile(repo: ToolRepository, path: string): Promise<RemoteFileState> {
  const cached = await memoFetchRawFile(`raw:${repo.repo}@${repo.branch}/${path}`, () =>
    fetchRemoteFile(repo, path),
  );
  return cached ?? { path, ok: false, status: 0, size: 0, error: "Fetch failed" };
}

async function readJson<T>(repo: ToolRepository, path: string): Promise<T | undefined> {
  const file = await readRemoteFile(repo, path);

  if (!file.ok || !file.text) {
    return undefined;
  }

  try {
    return JSON.parse(file.text) as T;
  } catch {
    return undefined;
  }
}

async function readPublicGitHub<T>(repo: ToolRepository, path: string): Promise<T | undefined> {
  return memoFetchGitHubApi<T>(`api:${repo.repo}${path}`, async () => {
    try {
      const response = await fetchWithTimeout(`https://api.github.com/repos/${repo.repo}${path}`, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      if (!response.ok) return undefined;
      return (await response.json()) as T;
    } catch {
      return undefined;
    }
  });
}

export async function hydrateRepository(repo: ToolRepository): Promise<ToolRemoteState> {
  if (repo.remoteEnabled === false || !repo.repo) {
    return {
      id: repo.id,
      loading: false,
      checkedAt: new Date().toISOString(),
      repoInfo: {
        html_url: repo.repo ? repoUrl(repo.repo) : undefined,
        default_branch: repo.branch,
        visibility: "local",
      },
      manifest: {
        code: repo.code,
        id: repo.id,
        name: repo.name,
        status: repo.status,
        summary: repo.summary,
        release: {
          version: repo.localVersion,
        },
        health: {
          status: repo.status,
          note: "Local-only registry entry. Remote sync is disabled until the GitHub repository is published.",
        },
      },
      packageJson: {
        version: repo.localVersion,
      },
      files: [],
    };
  }

  const uniqueFiles = Array.from(new Set([repo.manifestPath, ...repo.trackedFiles, ...repo.scriptFiles]));

  try {
    const [manifest, packageJson, files, repoInfo, latestRelease, releases, tags] = await Promise.all([
      readJson<ToolManifest>(repo, repo.manifestPath),
      readJson<PackageJson>(repo, "package.json"),
      Promise.all(uniqueFiles.map((path) => readRemoteFile(repo, path))),
      readPublicGitHub<GitHubRepoInfo>(repo, ""),
      readPublicGitHub<GitHubRelease>(repo, "/releases/latest"),
      readPublicGitHub<GitHubRelease[]>(repo, "/releases?per_page=20"),
      readPublicGitHub<Array<{ name: string }>>(repo, "/tags?per_page=100"),
    ]);

    return {
      id: repo.id,
      loading: false,
      checkedAt: new Date().toISOString(),
      repoInfo: {
        html_url: repoInfo?.html_url ?? repoUrl(repo.repo),
        description: repoInfo?.description,
        pushed_at: repoInfo?.pushed_at,
        updated_at: repoInfo?.updated_at,
        stargazers_count: repoInfo?.stargazers_count,
        open_issues_count: repoInfo?.open_issues_count,
        default_branch: repoInfo?.default_branch ?? repo.branch,
        visibility: repoInfo?.visibility ?? "public",
      },
      manifest,
      packageJson,
      latestRelease,
      releases: releases ?? (latestRelease ? [latestRelease] : []),
      gitTags: tags?.map((t) => t.name).filter(Boolean) ?? [],
      files,
    };
  } catch (error) {
    return {
      id: repo.id,
      loading: false,
      checkedAt: new Date().toISOString(),
      files: [],
      error: error instanceof Error ? error.message : "Unable to read repository",
    };
  }
}
