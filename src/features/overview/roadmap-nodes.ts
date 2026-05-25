import type { ElementType } from "react";
import { CheckCircle2, Circle, Rocket, Tag } from "lucide-react";
import type { ToolManifest } from "../../types";
import type { VersionSyncStatus } from "../../lib/version-badges";
import type { ToolVersionHistoryRow } from "./tool-versions";

export type RoadmapNode = {
  id: string;
  date: string;
  title: string;
  bullets: string[];
  status: "done" | "current" | "planned";
  version: string;
  syncStatus: VersionSyncStatus;
  releaseUrl?: string;
  icon: ElementType<{ size?: number; className?: string }>;
};

const STATUS_ICON: Record<RoadmapNode["status"], ElementType<{ size?: number; className?: string }>> = {
  done: CheckCircle2,
  current: Rocket,
  planned: Rocket,
};

function statusFor(row: ToolVersionHistoryRow): RoadmapNode["status"] {
  if (row.isCurrent) return "current";
  if (row.syncStatus === "synced" || row.onRelease) return "done";
  if (row.inChangelog || row.onPackage || row.onManifest) return "done";
  return "planned";
}

function compareVersionForRoadmap(a: ToolVersionHistoryRow, b: ToolVersionHistoryRow) {
  const pa = a.version.split(".").map((x) => parseInt(x, 10) || 0);
  const pb = b.version.split(".").map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function pipelineCount(row: ToolVersionHistoryRow): string {
  const done = [row.onPackage, row.inChangelog, row.onManifest, row.onGit, row.onPush, row.onRelease].filter(Boolean).length;
  return `${done}/6 pipeline checks`;
}

const BULLET_MAX_LEN = 80;

function truncateBullet(text: string): string {
  if (text.length <= BULLET_MAX_LEN) return text;
  return `${text.slice(0, BULLET_MAX_LEN - 1).trimEnd()}...`;
}

function bulletsFor(row: ToolVersionHistoryRow): string[] {
  if (row.changes && row.changes.length) {
    return row.changes.slice(0, 3).map(truncateBullet);
  }
  const bullets = [row.title || `${row.display} release`, pipelineCount(row)];
  if (row.onRelease) bullets.push("GitHub release ready");
  else if (row.onGit) bullets.push("Git tag available");
  if (row.compareUrl) bullets.push("compare link available");
  return bullets.slice(0, 3).map(truncateBullet);
}

export function buildRoadmapNodes(manifest: ToolManifest, versions: ToolVersionHistoryRow[] = []): RoadmapNode[] {
  if (versions.length) {
    return [...versions].sort((a, b) => compareVersionForRoadmap(b, a)).map((row) => {
      const status = statusFor(row);
      return {
        id: row.version,
        date: row.publishedLabel ?? row.date ?? (row.isCurrent ? "Current" : "History"),
        title: row.title || `${row.display} release`,
        bullets: bulletsFor(row),
        status,
        version: row.display,
        syncStatus: row.syncStatus,
        releaseUrl: row.releaseUrl,
        icon: STATUS_ICON[status] ?? Circle,
      };
    });
  }

  const fallbackVersion = manifest.release?.version;
  return [
    {
      id: fallbackVersion ?? "empty",
      date: "Manifest",
      title: fallbackVersion ? `v${fallbackVersion} release` : "No version history",
      bullets: [fallbackVersion ? "Version declared in manifest" : "Add version data"],
      status: fallbackVersion ? "current" : "planned",
      version: fallbackVersion ? `v${fallbackVersion}` : "-",
      syncStatus: fallbackVersion ? "current" : "history",
      icon: fallbackVersion ? Tag : Circle,
    },
  ];
}
