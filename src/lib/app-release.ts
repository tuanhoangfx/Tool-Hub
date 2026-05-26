import { APP_VERSION } from "./app-meta";
import changelogRaw from "../../CHANGELOG.md?raw";
import { formatDate, normalizeVersion } from "./tooling";
import type { ResolvedTool } from "../types";

function formatHeaderDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

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
    return { label: formatDate(published), shortLabel: formatHeaderDate(published), live: true, publishedAt: published };
  }

  const latestPublished = hubTool?.remote?.manifest?.release?.latestPublished;
  if (normalizeVersion(latestPublished?.tag) === currentVersion && latestPublished?.publishedAt) {
    return {
      label: formatDate(latestPublished.publishedAt),
      shortLabel: formatHeaderDate(latestPublished.publishedAt),
      live: true,
      publishedAt: latestPublished.publishedAt,
    };
  }

  const changelogTimestamp = parseChangelogTimestamp(currentVersion);
  if (changelogTimestamp) {
    return {
      label: formatDate(changelogTimestamp),
      shortLabel: formatHeaderDate(changelogTimestamp),
      live: false,
      publishedAt: changelogTimestamp,
    };
  }

  return { label: "—", shortLabel: "—", live: false };
}
