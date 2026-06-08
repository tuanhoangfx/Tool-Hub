import type { FilterDef, FilterValues } from "../../../components/sales-shell";
import { enrichFilterDefs } from "../../../lib/filter-option-counts";
import type { AgentContextItem } from "./types";
import { AGENT_KIND_FILTERS } from "./agent-context-filter-defs";

export { AGENT_KIND_FILTERS };

function agentSearchHaystack(item: AgentContextItem): string {
  const parts = [
    item.name,
    item.path,
    item.summary,
    item.trigger ?? "",
    item.commandId ?? "",
    item.golden ?? "",
    item.clone ?? "",
    item.keywordGroup ?? "",
    ...item.tags,
  ];
  if (item.contentFields?.length) {
    for (const field of item.contentFields) {
      parts.push(field.label, field.value);
    }
  }
  return parts.join(" ").toLowerCase();
}

export function matchesAgentContext(
  item: AgentContextItem,
  query: string,
  filterValues: FilterValues,
): boolean {
  const q = query.trim().toLowerCase();
  if (q && !agentSearchHaystack(item).includes(q)) return false;
  if (filterValues.agentKind?.length && !filterValues.agentKind.includes(item.kind)) return false;
  if (filterValues.agentLayer?.length && !filterValues.agentLayer.includes(item.layer ?? "")) return false;
  if (filterValues.agentScope?.length && !filterValues.agentScope.includes(item.scope)) return false;
  if (filterValues.agentTag?.length && !filterValues.agentTag.some((t) => item.tags.includes(String(t)))) return false;
  if (filterValues.agentKeywordGroup?.length) {
    const group = item.keywordGroup ?? "";
    if (!filterValues.agentKeywordGroup.includes(group)) return false;
  }
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
      if (filterKey === "agentKind") return item.kind === optionValue;
      if (filterKey === "agentLayer") return item.layer === optionValue;
      if (filterKey === "agentScope") return item.scope === optionValue;
      if (filterKey === "agentTag") return item.tags.includes(String(optionValue));
      if (filterKey === "agentKeywordGroup") return item.keywordGroup === optionValue;
      return false;
    },
  );
}
