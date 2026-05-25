import { parseChangelog } from "../../lib/changelog-parser";
import { formatDate, normalizeVersion } from "../../lib/tooling";
import type { ResolvedTool, ToolManifest } from "../../types";

export type VersionSyncStatus = "current" | "synced" | "needs-push" | "needs-sync" | "history";

export type ToolVersionHistoryRow = {
  id: string;
  version: string;
  display: string;
  date?: string;
  title?: string;
  isCurrent: boolean;
  /** tool.manifest.json */
  onManifest: boolean;
  /** package.json */
  onPackage: boolean;
  /** CHANGELOG.md entry */
  inChangelog: boolean;
  /** Git tag or commit recorded in the changelog */
  onGit: boolean;
  /** Code/metadata is available on the remote */
  onPush: boolean;
  /** GitHub Release */
  onRelease: boolean;
  publishedLabel?: string;
  assetSize?: string;
  releaseUrl?: string;
  /** GitHub compare v{prev}...v{this} */
  compareUrl?: string;
  syncStatus: VersionSyncStatus;
  syncNote: string;
  /** Bullet points from the CHANGELOG entry's "### Changes" section */
  changes?: string[];
};

type RowDraft = Omit<
  ToolVersionHistoryRow,
  "syncStatus" | "syncNote" | "display" | "id"
> & { version: string };

function displayVersion(v: string): string {
  const n = normalizeVersion(v);
  return n ? (v.trim().startsWith("v") ? v.trim() : `v${n}`) : v;
}

function compareSemverDesc(a: string, b: string): number {
  const pa = normalizeVersion(a).split(".").map((x) => parseInt(x, 10) || 0);
  const pb = normalizeVersion(b).split(".").map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function formatAssetSize(bytes?: number): string | undefined {
  if (bytes == null || bytes <= 0) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CHANGE_TEXT_OVERRIDES: Record<string, string> = {
  "dong bo version tren package, manifest va changelog.":
    "Synchronized version across package, manifest, and CHANGELOG.",
  "dong bo version: package + manifest + changelog.":
    "Synchronized version across package, manifest, and CHANGELOG.",
  "versions panel: lich su theo phien ban, pipeline commit auto-bump patch.":
    "Versions panel now tracks per-version history and the Commit pipeline auto-bumps patches.",
  "versions panel: lich su + pipeline auto-bump patch.":
    "Versions panel now includes history and pipeline patch auto-bump.",
};

function legacyChangeKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .trim()
    .toLowerCase();
}

function normalizeChangelogChange(text: string): string {
  return CHANGE_TEXT_OVERRIDES[legacyChangeKey(text)] ?? text;
}

function ensure(map: Map<string, RowDraft>, raw: string): RowDraft | null {
  const n = normalizeVersion(raw);
  if (!n) return null;
  let row = map.get(n);
  if (!row) {
    row = {
      version: n,
      isCurrent: false,
      onManifest: false,
      onPackage: false,
      inChangelog: false,
      onGit: false,
      onPush: false,
      onRelease: false,
    };
    map.set(n, row);
  }
  return row;
}

function tagMatchesVersion(tagName: string, version: string): boolean {
  return normalizeVersion(tagName) === version;
}

function applyPushSignals(tool: ResolvedTool, map: Map<string, RowDraft>) {
  const remote = tool.remote;
  const remoteOff = tool.remoteEnabled === false;
  const pushedAt = remote?.repoInfo?.pushed_at;
  const remotePkg = normalizeVersion(remote?.packageJson?.version);
  const remoteManifest = normalizeVersion(remote?.manifest?.release?.version);

  for (const row of map.values()) {
    if (row.onRelease) {
      row.onPush = true;
      continue;
    }
    if (remoteOff) continue;

    if (row.isCurrent) {
      row.onPush =
        remotePkg === row.version || remoteManifest === row.version || Boolean(pushedAt && remotePkg === row.version);
    }
  }
}

function finalize(row: RowDraft, canonical: string): ToolVersionHistoryRow {
  const pipeline = [row.onPackage, row.inChangelog, row.onManifest, row.onGit, row.onPush, row.onRelease];

  let syncStatus: VersionSyncStatus = "history";
  let syncNote = "";

  if (row.isCurrent) {
    const missing: string[] = [];
    if (!row.onPackage) missing.push("package.json");
    if (!row.inChangelog) missing.push("CHANGELOG");
    if (!row.onManifest) missing.push("manifest");
    if (!row.onGit) missing.push("git tag");
    if (!row.onPush) missing.push("git push (remote)");
    if (!row.onRelease) missing.push("GitHub Release");

    if (missing.length === 0) {
      syncStatus = "synced";
      syncNote = "Complete pipeline: package -> changelog -> manifest -> tag -> push -> release.";
    } else if (!row.onRelease && (!row.onPush || !row.onGit)) {
      syncStatus = "needs-push";
      syncNote = `Missing: ${missing.join(", ")}.`;
    } else {
      syncStatus = "needs-sync";
      syncNote = `Missing: ${missing.join(", ")}.`;
    }
  } else if (row.onRelease && row.inChangelog) {
    syncStatus = "synced";
    syncNote = "Released and documented in CHANGELOG.";
  } else if (row.onRelease) {
    syncNote = "Release exists. Add CHANGELOG notes if needed.";
  } else if (row.inChangelog) {
    syncStatus = "needs-push";
    syncNote = "Only in CHANGELOG. No release or tag yet.";
  } else if (pipeline.some(Boolean)) {
    syncNote = "Historical version with partial pipeline data.";
  }

  if (row.isCurrent && normalizeVersion(canonical) !== row.version) {
    syncStatus = "needs-sync";
    syncNote = `Hub canonical v${canonical} differs from this row.`;
  }

  return {
    id: row.version,
    ...row,
    display: displayVersion(row.version),
    syncStatus,
    syncNote,
  };
}

/** One row per version across the publish pipeline (manifest, package, changelog, git, push, release). */
export function collectVersionHistory(
  tool: ResolvedTool,
  manifest: ToolManifest,
): ToolVersionHistoryRow[] {
  const map = new Map<string, RowDraft>();
  const remote = tool.remote;
  const canonical = normalizeVersion(tool.version);

  const changelogText = remote?.files?.find((f) => f.path.toLowerCase() === "changelog.md")?.text;
  for (const entry of parseChangelog(changelogText)) {
    if (!entry.version) continue;
    const row = ensure(map, entry.version);
    if (!row) continue;
    row.inChangelog = true;
    row.date ??= entry.date;
    row.title ??= entry.title;
    if (entry.changes.length) row.changes = entry.changes.map(normalizeChangelogChange);
    if (entry.commit?.trim()) row.onGit = true;
  }

  for (const tagName of remote?.gitTags ?? []) {
    const n = normalizeVersion(tagName);
    if (!n) continue;
    const row = map.get(n) ?? ensure(map, tagName);
    if (row) row.onGit = true;
  }

  for (const release of remote?.releases ?? []) {
    const tag = release.tag_name;
    if (!tag) continue;
    const row = ensure(map, tag);
    if (!row) continue;
    row.onRelease = true;
    row.onGit = true;
    row.onPush = true;
    row.releaseUrl = release.html_url;
    row.publishedLabel = release.published_at ? formatDate(release.published_at) : undefined;
    row.assetSize = formatAssetSize(release.assets?.[0]?.size) ?? row.assetSize;
    row.date ??= release.published_at?.slice(0, 10);
  }

  const pkgV = remote?.packageJson?.version?.trim() || tool.localVersion?.trim();
  if (pkgV) {
    const row = ensure(map, pkgV);
    if (row) row.onPackage = true;
  }

  const manifestV = manifest.release?.version?.trim() || remote?.manifest?.release?.version?.trim();
  if (manifestV) {
    const row = ensure(map, manifestV);
    if (row) row.onManifest = true;
  }

  const published = manifest.release?.latestPublished;
  if (published?.tag) {
    const row = ensure(map, published.tag);
    if (row) {
      row.onManifest = true;
      row.onRelease = row.onRelease || Boolean(published.url);
      row.onGit = row.onGit || tagMatchesVersion(published.tag, row.version);
      row.releaseUrl ??= published.url;
      row.publishedLabel ??= published.publishedAt ? formatDate(published.publishedAt) : undefined;
    }
  }

  if (canonical) {
    const row = ensure(map, canonical) ?? map.get(canonical);
    if (row) row.isCurrent = true;
  }

  applyPushSignals(tool, map);

  const rows = Array.from(map.values())
    .map((r) => finalize(r, tool.version))
    .sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
      if (a.date && b.date) return b.date.localeCompare(a.date);
      return compareSemverDesc(a.version, b.version);
    });

  if (tool.repo) {
    for (let i = 0; i < rows.length; i++) {
      const newer = rows[i];
      const older = rows[i + 1];
      if (!older?.onRelease || !newer.onRelease) continue;
      const a = `v${older.version}`;
      const b = `v${newer.version}`;
      newer.compareUrl = `https://github.com/${tool.repo}/compare/${a}...${b}`;
    }
  }

  return rows;
}

/** @deprecated Use collectVersionHistory */
export const collectVersionRows = collectVersionHistory;
export type ToolVersionRow = ToolVersionHistoryRow;
