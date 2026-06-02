import type { FilterDef, FilterValues } from "../../components/sales-shell";
import { enrichFilterDefs } from "../../lib/filter-option-counts";
import { TOOL_NONE, type UserManagementRow } from "./userManagementRepository";

export { TOOL_NONE };

export function matchesUserFilters(row: UserManagementRow, query: string, filters: FilterValues): boolean {
  const q = query.trim().toLowerCase();
  const selectedRoles = filters.role ?? [];
  const selectedStatuses = filters.status ?? [];
  const selectedTools = filters.tool ?? [];

  if (selectedRoles.length && !selectedRoles.includes(row.role)) return false;
  if (selectedStatuses.length && !selectedStatuses.includes(row.status)) return false;
  if (selectedTools.length) {
    const match = selectedTools.some((sel) => {
      if (sel === TOOL_NONE) return row.toolCount === 0;
      return row.toolCodes.includes(sel);
    });
    if (!match) return false;
  }
  if (!q) return true;
  const haystack = [row.fullName, row.email, row.id, row.role, row.status, ...row.toolCodes]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function matchesUserFilterOption(row: UserManagementRow, filterKey: string, value: string): boolean {
  if (filterKey === "role") return row.role === value;
  if (filterKey === "status") return row.status === value;
  if (filterKey === "tool") {
    if (value === TOOL_NONE) return row.toolCount === 0;
    return row.toolCodes.includes(value);
  }
  return true;
}

export function userFiltersWithCounts(
  rows: UserManagementRow[],
  baseDefs: FilterDef[],
  query: string,
  values: FilterValues,
): FilterDef[] {
  return enrichFilterDefs(rows, baseDefs, query, values, matchesUserFilters, matchesUserFilterOption);
}
