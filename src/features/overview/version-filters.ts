import type { FilterDef, FilterValues } from "../../components/sales-shell";
import type { ToolVersionHistoryRow } from "./tool-versions";

export const VERSION_FILTER_DEFS: FilterDef[] = [
  {
    key: "sync",
    label: "Sync",
    showAllLabel: true,
    options: [
      { value: "current", label: "Current", color: "#818cf8" },
      { value: "synced", label: "Synced", color: "#4ade80" },
      { value: "needs-push", label: "Needs push", color: "#fbbf24" },
      { value: "needs-sync", label: "Needs sync", color: "#fb7185" },
      { value: "history", label: "History", color: "#94a3b8" },
    ],
  },
];

export function matchesVersionFilters(row: ToolVersionHistoryRow, query: string, values: FilterValues): boolean {
  const q = query.trim().toLowerCase();
  if (q) {
    const hay = `${row.display} ${row.version} ${row.title ?? ""} ${row.syncNote} ${row.date ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (values.sync?.length && !values.sync.includes(row.syncStatus)) return false;
  return true;
}
