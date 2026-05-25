import { APP_VERSION } from "./app-meta";
import { formatDate, formatHubHeaderDate, normalizeVersion } from "./tooling";
import type { ResolvedTool } from "../types";

/** GitHub `published_at` for the release whose tag matches `APP_VERSION`. */
export function resolveVersionReleaseMeta(hubTool: ResolvedTool | undefined): {
  label: string;
  shortLabel: string;
  live: boolean;
  publishedAt?: string;
} {
  const release = hubTool?.remote?.latestRelease;
  const tag = release?.tag_name;
  const published = release?.published_at;
  const matches = Boolean(tag && normalizeVersion(tag) === normalizeVersion(APP_VERSION));

  if (matches && published) {
    return { label: formatDate(published), shortLabel: formatHubHeaderDate(published), live: true, publishedAt: published };
  }
  return { label: "No release", shortLabel: "No release", live: false };
}
