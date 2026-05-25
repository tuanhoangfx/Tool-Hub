import { VERSION_PIPELINE_COLS } from "./version-pipeline-defs";
import type { ToolVersionHistoryRow } from "./tool-versions";

export type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
};

export function versionChecklist(row: ToolVersionHistoryRow | undefined): ChecklistItem[] {
  if (!row) return [];
  const flags: Record<string, boolean> = {
    onPackage: row.onPackage,
    inChangelog: row.inChangelog,
    onManifest: row.onManifest,
    onGit: row.onGit,
    onPush: row.onPush,
    onRelease: row.onRelease,
  };
  return VERSION_PIPELINE_COLS.map((col) => ({
    key: col.key,
    label: col.shortLabel,
    done: Boolean(flags[col.key]),
  }));
}
