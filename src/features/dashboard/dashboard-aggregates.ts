import { HUB_APP_TAB_GROUP_META, HUB_UI_TEMPLATE_META, navChartColor } from "@tool-workspace/hub-ui";
import type { BarItem, FilterDef, FilterValues } from "../../components/sales-shell";
import { enrichFilterDefs } from "../../lib/filter-option-counts";
import type { DashboardTabEntry } from "./dashboard-tab-registry";

const DASHBOARD_GROUP_IDS = ["hub", "users", "system"] as const;
const DASHBOARD_TEMPLATE_IDS = ["directory", "system-panels", "document-toc"] as const;

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
  const kpis = dashboardKpis(entries);
  const group: BarItem[] = DASHBOARD_GROUP_IDS.map((id) => ({
    label: HUB_APP_TAB_GROUP_META[id].label,
    value: id === "hub" ? kpis.hub : id === "users" ? kpis.users : kpis.system,
    color: navChartColor(HUB_APP_TAB_GROUP_META[id].iconTone),
  }));
  const template: BarItem[] = DASHBOARD_TEMPLATE_IDS.map((id) => ({
    label: HUB_UI_TEMPLATE_META[id].label,
    value:
      id === "directory" ? kpis.directory : id === "system-panels" ? kpis.systemPanels : kpis.documentToc,
    color: navChartColor(HUB_UI_TEMPLATE_META[id].iconTone),
  }));
  return { group, template };
}

type DashboardFilterOpts = { pinnedIds?: Set<string> };

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
