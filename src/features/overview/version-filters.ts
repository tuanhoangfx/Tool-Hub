import type { FilterDef, FilterValues } from "../../components/sales-shell";
import type { ToolVersionHistoryRow } from "./tool-versions";

export const VERSION_FILTER_DEFS: FilterDef[] = [
  {
    key: "sync",
    label: "Sync",
    showAllLabel: true,
    options: [
      { value: "current", label: "Current" },
      { value: "synced", label: "Synced" },
      { value: "needs-push", label: "Needs push" },
      { value: "needs-sync", label: "Needs sync" },
      { value: "history", label: "History" },
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
