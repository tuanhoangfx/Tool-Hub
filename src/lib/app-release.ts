import { APP_VERSION } from "./app-meta";
import changelogRaw from "../../CHANGELOG.md?raw";
import { formatTabHeaderTimestamp } from "./hub-tab-header-meta";
import { formatDate, normalizeVersion } from "./tooling";
import type { ResolvedTool } from "../types";

function parseChangelogTimestamp(version: string, changelog = changelogRaw): string | undefined {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const entry = changelog.match(
    new RegExp(`- Version:\\s*\`${escaped}\`[\\s\\S]*?- Timestamp:\\s*([^\\n]+)`, "i"),
  );
  const raw = entry?.[1]?.trim();
  if (!raw) return undefined;
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+\(UTC([+-]\d{1,2})\)$/i);
  if (!match) return raw;
  const [, date, time, offset] = match;
  const sign = offset.startsWith("-") ? "-" : "+";
  const hour = offset.replace(/^[+-]/, "").padStart(2, "0");
  return `${date}T${time}:00${sign}${hour}:00`;
}

/** GitHub `published_at` for the release whose tag matches `APP_VERSION`. */
export function resolveVersionReleaseMeta(hubTool: ResolvedTool | undefined): {
  label: string;
  shortLabel: string;
  live: boolean;
  publishedAt?: string;
} {
  const currentVersion = normalizeVersion(APP_VERSION);
  const release = hubTool?.remote?.releases?.find((r) => normalizeVersion(r.tag_name) === currentVersion);
  const published = release?.published_at;

  if (published) {
    return { label: formatDate(published), shortLabel: formatTabHeaderTimestamp(published), live: true, publishedAt: published };
  }

  const latestPublished = hubTool?.remote?.manifest?.release?.latestPublished;
  if (normalizeVersion(latestPublished?.tag) === currentVersion && latestPublished?.publishedAt) {
    return {
      label: formatDate(latestPublished.publishedAt),
      shortLabel: formatTabHeaderTimestamp(latestPublished.publishedAt),
      live: true,
      publishedAt: latestPublished.publishedAt,
    };
  }

  const changelogTimestamp = parseChangelogTimestamp(currentVersion);
  if (changelogTimestamp) {
    return {
      label: formatDate(changelogTimestamp),
      shortLabel: formatTabHeaderTimestamp(changelogTimestamp),
      live: false,
      publishedAt: changelogTimestamp,
    };
  }

  return { label: "—", shortLabel: "—", live: false };
}
