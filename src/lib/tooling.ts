import type { RemoteFileState, ResolvedTool, ToolRemoteState, ToolRepository } from "../types";

export const STATUS_ORDER = ["Ready", "Needs review", "Experimental", "Archived"];

export function formatDate(value?: string) {
  if (!value) return "Chua co du lieu";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function normalizeVersion(value?: string) {
  return value?.replace(/^v/i, "") ?? "";
}

export type Freshness = "fresh" | "week" | "month" | "stale" | "unknown";

export function freshnessLevel(updatedAt?: string): Freshness {
  if (!updatedAt) return "unknown";
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return "unknown";
  const days = (Date.now() - t) / (1000 * 60 * 60 * 24);
  if (days < 1) return "fresh";
  if (days < 7) return "week";
  if (days < 30) return "month";
  return "stale";
}

export function freshnessLabel(level: Freshness, updatedAt?: string): string {
  if (level === "unknown" || !updatedAt) return "—";
  const t = new Date(updatedAt).getTime();
  const days = Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
  const hours = Math.floor((Date.now() - t) / (1000 * 60 * 60));
  if (level === "fresh") return hours <= 1 ? "just now" : `${hours}h`;
  if (level === "week") return `${days}d`;
  if (level === "month") return `${days}d`;
  return `${days}d`;
}

function firstReleaseAsset(remote?: ToolRemoteState) {
  return remote?.latestRelease?.assets?.[0]?.browser_download_url;
}

function findFile(remote: ToolRemoteState | undefined, path: string) {
  return remote?.files.find((file) => file.path.toLowerCase() === path.toLowerCase());
}

function extractChangelogVersion(remote?: ToolRemoteState) {
  const changelog = findFile(remote, "CHANGELOG.md")?.text ?? "";
  const versionMatch = changelog.match(/-\s*Version:\s*`?v?([0-9]+\.[0-9]+\.[0-9][^`\s]*)`?/i);
  return versionMatch?.[1] ?? "";
}

export function createVersionAlerts(remote?: ToolRemoteState) {
  if (!remote) return [];

  const manifestVersion = remote?.manifest?.release?.version ?? "";
  const packageVersion = remote?.packageJson?.version ?? "";
  const releaseVersion = normalizeVersion(remote?.latestRelease?.tag_name);
  const changelogVersion = extractChangelogVersion(remote);
  const sources = [
    ["manifest", manifestVersion],
    ["package", packageVersion],
    ["changelog", changelogVersion],
    ["release", releaseVersion],
  ].filter(([, version]) => Boolean(version));

  const alerts: string[] = [];
  const uniqueVersions = Array.from(new Set(sources.map(([, version]) => version)));

  if (uniqueVersions.length > 1) {
    alerts.push(`Version drift: ${sources.map(([source, version]) => `${source} ${version}`).join(", ")}.`);
  }

  if (packageVersion && !releaseVersion) {
    alerts.push(`Missing release for package v${packageVersion}.`);
  }

  if (!changelogVersion) {
    alerts.push("CHANGELOG.md chua co Version parseable theo Changelog Standard.");
  }

  return alerts;
}

function createSuggestions(tool: ToolRepository, remote?: ToolRemoteState) {
  if (tool.remoteEnabled === false) {
    return ["Tool dang hien thi tu local registry. Publish GitHub repo xong thi bat remote sync lai."];
  }

  const files = remote?.files ?? [];
  const missingFiles = files.filter((file) => !file.ok);
  const missingScripts = missingFiles.filter((file) => tool.scriptFiles.includes(file.path));
  const suggestions: string[] = [];

  if (!remote?.repoInfo) suggestions.push("Kiem tra repo public hoac GitHub API rate limit.");
  if (missingFiles.length > 0) suggestions.push(`Bo sung ${missingFiles.length} file public dang thieu trong repo.`);
  if (missingScripts.length > 0) suggestions.push("Dong bo scripts quan trong len GitHub de tool doc duoc ban moi.");
  if (!remote?.latestRelease) suggestions.push("Tao GitHub Release de nguoi dung co link download ro rang.");
  if (remote?.manifest && !remote.manifest.nextActions?.length) {
    suggestions.push("Them nextActions vao manifest de tab quan tri dua ra roadmap.");
  }

  suggestions.push(...createVersionAlerts(remote));

  return suggestions.length > 0 ? suggestions : ["Repo dang on dinh, co the chi can refresh metadata theo chu ky."];
}

export function resolveTool(tool: ToolRepository, remote: ToolRemoteState | undefined, resolveRepoUrl: (repo: string) => string): ResolvedTool {
  const version =
    remote?.manifest?.release?.version ||
    remote?.packageJson?.version ||
    normalizeVersion(remote?.latestRelease?.tag_name) ||
    tool.localVersion ||
    "local";

  return {
    ...tool,
    remote,
    version,
    releaseUrl: remote?.latestRelease?.html_url ?? `${resolveRepoUrl(tool.repo)}/releases`,
    repoUrl: remote?.repoInfo?.html_url ?? resolveRepoUrl(tool.repo),
    downloadUrl: tool.remoteEnabled === false ? resolveRepoUrl(tool.repo) : firstReleaseAsset(remote) ?? `${resolveRepoUrl(tool.repo)}/releases`,
    healthLabel: remote?.manifest?.health?.status ?? remote?.manifest?.status ?? tool.status,
    updatedAt: remote?.repoInfo?.pushed_at ?? remote?.repoInfo?.updated_at ?? remote?.checkedAt ?? "",
    driftAlerts: createVersionAlerts(remote),
    suggestions: createSuggestions(tool, remote),
  };
}

export function countOkFiles(files?: RemoteFileState[]) {
  if (!files?.length) return "0/0";
  return `${files.filter((file) => file.ok).length}/${files.length}`;
}

function mergeKey(repo: ToolRepository) {
  const slug = repo.repo?.trim().toLowerCase();
  return slug ? slug : `local:${repo.id}`;
}

export function mergeRepos(defaultRepos: ToolRepository[], localRepos: ToolRepository[], customRepos: ToolRepository[]) {
  const byKey = new Map<string, ToolRepository>();

  for (const repo of defaultRepos) {
    byKey.set(mergeKey(repo), repo);
  }

  for (const repo of localRepos) {
    const key = mergeKey(repo);
    const current = byKey.get(key);
    byKey.set(
      key,
      current
        ? {
            ...current,
            localPath: repo.localPath || current.localPath,
            localVersion: repo.localVersion || current.localVersion,
          }
        : repo,
    );
  }

  for (const repo of customRepos) {
    byKey.set(mergeKey(repo), repo);
  }

  return Array.from(byKey.values());
}
