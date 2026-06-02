import type { FilterDef, FilterValues } from "../../components/sales-shell";
import { enrichFilterDefs } from "../../lib/filter-option-counts";
import type { HubToolRow } from "./toolAccessRepository";

export const TOOL_ACCESS_GRANT_FILTER: FilterDef = {
  key: "grant",
  label: "Access",
  showAllLabel: true,
  options: [
    { value: "granted", label: "Granted" },
    { value: "not_granted", label: "Not granted" },
  ],
};

export function toolCategoryKey(category: string | null | undefined): string {
  const c = (category ?? "").trim();
  return c || "Uncategorized";
}

export function buildToolCategoryFilterDef(tools: HubToolRow[]): FilterDef {
  const categories = [...new Set(tools.map((t) => toolCategoryKey(t.category)))].sort((a, b) => a.localeCompare(b));
  return {
    key: "category",
    label: "Category",
    showAllLabel: true,
    options: categories.map((value) => ({ value, label: value })),
  };
}

export function matchesToolAccessFilters(
  tool: HubToolRow,
  query: string,
  filters: FilterValues,
  selected: Set<string>,
): boolean {
  const q = query.trim().toLowerCase();
  if (q) {
    const hay = [tool.tool_code, tool.name, tool.category ?? "", tool.status ?? ""].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }

  const grant = filters.grant ?? [];
  const granted = selected.has(tool.tool_code);
  if (grant.length) {
    const ok =
      (grant.includes("granted") && granted) || (grant.includes("not_granted") && !granted);
    if (!ok) return false;
  }

  const categories = filters.category ?? [];
  if (categories.length && !categories.includes(toolCategoryKey(tool.category))) return false;

  return true;
}

export function matchesToolAccessFilterOption(
  tool: HubToolRow,
  filterKey: string,
  value: string,
  selected: Set<string>,
): boolean {
  if (filterKey === "grant") {
    const granted = selected.has(tool.tool_code);
    return value === "granted" ? granted : !granted;
  }
  if (filterKey === "category") return toolCategoryKey(tool.category) === value;
  return true;
}

export function toolAccessFiltersWithCounts(
  tools: HubToolRow[],
  defs: FilterDef[],
  query: string,
  values: FilterValues,
  selected: Set<string>,
): FilterDef[] {
  return enrichFilterDefs(
    tools,
    defs,
    query,
    values,
    (tool, q, f) => matchesToolAccessFilters(tool, q, f, selected),
    (tool, key, value) => matchesToolAccessFilterOption(tool, key, value, selected),
  );
}
