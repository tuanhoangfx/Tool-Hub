import { HUB_APP_TAB_GROUP_META, HUB_UI_TEMPLATE_META } from "@tool-workspace/hub-ui";
import type { BarItem, FilterDef, FilterValues } from "../../components/sales-shell";
import { enrichFilterDefs } from "../../lib/filter-option-counts";
import type { DashboardTabEntry } from "./dashboard-tab-registry";

const GROUP_CHART_COLOR: Record<string, string> = {
  hub: "#818cf8",
  users: "#38bdf8",
  system: "#a78bfa",
};

const TEMPLATE_CHART_COLOR: Record<string, string> = {
  directory: "#34d399",
  "system-panels": "#a78bfa",
  "document-toc": "#fbbf24",
};

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
  const group: BarItem[] = (["hub", "users", "system"] as const).map((id) => ({
    label: HUB_APP_TAB_GROUP_META[id].label,
    value: id === "hub" ? kpis.hub : id === "users" ? kpis.users : kpis.system,
    color: GROUP_CHART_COLOR[id],
  }));
  const template: BarItem[] = (["directory", "system-panels", "document-toc"] as const).map((id) => ({
    label: HUB_UI_TEMPLATE_META[id].label,
    value:
      id === "directory" ? kpis.directory : id === "system-panels" ? kpis.systemPanels : kpis.documentToc,
    color: TEMPLATE_CHART_COLOR[id],
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
