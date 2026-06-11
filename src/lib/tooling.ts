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

/** Date only for Hub header, e.g. `19/05/26`. */
export function formatHubHeaderDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export function normalizeVersion(value?: string) {
  return value?.replace(/^v/i, "") ?? "";
}

export type Freshness = "fresh" | "week" | "month" | "stale" | "unknown";

function timeDelta(updatedAt: string) {
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  return {
    hours: Math.floor(ms / (1000 * 60 * 60)),
    days: Math.floor(ms / (1000 * 60 * 60 * 24)),
  };
}

export function freshnessLevel(updatedAt?: string): Freshness {
  if (!updatedAt) return "unknown";
  const delta = timeDelta(updatedAt);
  if (!delta) return "unknown";
  if (delta.days < 1) return "fresh";
  if (delta.days < 7) return "week";
  if (delta.days < 30) return "month";
  return "stale";
}

export function freshnessLabel(level: Freshness, updatedAt?: string): string {
  if (level === "unknown" || !updatedAt) return "—";
  const delta = timeDelta(updatedAt);
  if (!delta) return "—";
  if (level === "fresh") return delta.hours <= 1 ? "just now" : `${delta.hours}h`;
  return `${delta.days}d`;
}

export function folderName(path: string): string {
  if (!path) return "—";
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

export function dateKey(d: Date | number | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export { deployLabel } from "@tool-workspace/hub-ui";

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
    suggestions.push('Them mang "roadmap" (period, title, bullets, status) vao tool.manifest.json.');
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

export function mergeRepos(defaultRepos: ToolRepository[], localRepos: ToolRepository[]) {
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
            localUrl: repo.localUrl || current.localUrl,
            appUrl: repo.appUrl || current.appUrl,
            deployTarget: repo.deployTarget || current.deployTarget,
          }
        : repo,
    );
  }

  return Array.from(byKey.values());
}
