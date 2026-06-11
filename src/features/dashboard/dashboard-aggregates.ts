import {
  chartBreakdownFromPicker,
  HUB_APP_TAB_GROUP_META,
  HUB_UI_TEMPLATE_META,
  matchesDirectoryTimeRange,
  type TimeRange,
} from "@tool-workspace/hub-ui";
import type { FilterDef, FilterValues } from "../../components/sales-shell";
import { resolveP0004ChartLegendIcon } from "../../lib/badge-registry-chart";
import { enrichFilterDefs } from "../../lib/filter-option-counts";
import type { DashboardTabEntry } from "./dashboard-tab-registry";

const iconFor = resolveP0004ChartLegendIcon;

export type DashboardKpis = {
  total: number;
  hub: number;
  users: number;
  system: number;
  directory: number;
  systemPanels: number;
  documentToc: number;
};

export function dashboardKpis(entries: DashboardTabEntry[]): DashboardKpis {
  const hub = entries.filter((e) => e.group === "hub").length;
  const users = entries.filter((e) => e.group === "users").length;
  const system = entries.filter((e) => e.group === "system").length;
  const directory = entries.filter((e) => e.template === "directory").length;
  const systemPanels = entries.filter((e) => e.template === "system-panels").length;
  const documentToc = entries.filter((e) => e.template === "document-toc").length;
  return {
    total: entries.length,
    hub,
    users,
    system,
    directory,
    systemPanels,
    documentToc,
  };
}

export function dashboardCharts(entries: DashboardTabEntry[]) {
  return {
    group: chartBreakdownFromPicker(
      entries,
      (e) => HUB_APP_TAB_GROUP_META[e.group].label,
      { iconFor },
    ),
    template: chartBreakdownFromPicker(
      entries,
      (e) => HUB_UI_TEMPLATE_META[e.template].label,
      { iconFor },
    ),
  };
}

type DashboardFilterOpts = { pinnedIds?: Set<string>; range?: TimeRange };

function matchesDashboardFilters(
  entry: DashboardTabEntry,
  filters: FilterValues,
  opts?: DashboardFilterOpts,
): boolean {
  if (filters.pinned?.includes("pinned") && !opts?.pinnedIds?.has(entry.id)) return false;
  if (filters.group?.length && !filters.group.includes(entry.group)) return false;
  if (filters.template?.length && !filters.template.includes(entry.template)) return false;
  return true;
}

export function dashboardFiltersWithCounts(
  allEntries: DashboardTabEntry[],
  defs: FilterDef[],
  query: string,
  values: FilterValues,
  opts?: DashboardFilterOpts,
): FilterDef[] {
  return enrichFilterDefs(
    allEntries,
    defs,
    query,
    values,
    (entry, q, f) => filterDashboardTabs([entry], q, f, opts).length > 0,
    (entry, key, value) => {
      if (key === "pinned") return value === "pinned" && Boolean(opts?.pinnedIds?.has(entry.id));
      if (key === "group") return entry.group === value;
      if (key === "template") return entry.template === value;
      return false;
    },
  );
}

export function filterDashboardTabs(
  entries: DashboardTabEntry[],
  query: string,
  filters: FilterValues,
  opts?: DashboardFilterOpts,
): DashboardTabEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (!matchesDashboardFilters(entry, filters, opts)) return false;
    if (
      opts?.range &&
      !matchesDirectoryTimeRange(entry.activityAt, opts.range, { staticAlwaysVisible: true })
    ) {
      return false;
    }
    if (!q) return true;
    const hay = [
      entry.label,
      entry.groupLabel,
      entry.path,
      entry.description,
      entry.template,
      entry.meta ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
