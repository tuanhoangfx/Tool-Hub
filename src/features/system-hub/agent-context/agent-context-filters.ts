import type { FilterDef, FilterValues } from "../../../components/sales-shell";
import { enrichFilterDefs } from "../../../lib/filter-option-counts";
import type { AgentContextItem } from "./types";
import { AGENT_KIND_FILTERS } from "./agent-context-filter-defs";

export { AGENT_KIND_FILTERS };

export function matchesAgentContext(
  item: AgentContextItem,
  query: string,
  filterValues: FilterValues,
): boolean {
  const q = query.trim().toLowerCase();
  if (q) {
    const hay = [item.name, item.path, item.summary, ...item.tags].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (filterValues.kind?.length && !filterValues.kind.includes(item.kind)) return false;
  if (filterValues.scope?.length && !filterValues.scope.includes(item.scope)) return false;
  return true;
}

export function agentFiltersWithCounts(
  items: AgentContextItem[],
  query: string,
  filterValues: FilterValues,
): FilterDef[] {
  return enrichFilterDefs(
    items,
    AGENT_KIND_FILTERS,
    query,
    filterValues,
    matchesAgentContext,
    (item, filterKey, optionValue) => {
      if (filterKey === "kind") return item.kind === optionValue;
      if (filterKey === "scope") return item.scope === optionValue;
      return false;
    },
  );
}
