import { FolderTree, LayoutGrid, Settings2 } from "lucide-react";
import type { TabHeaderStatItem } from "../../components/sales-shell/AppTabHeader";
import { DASHBOARD_HEADER_STAT_DEFS, type DashboardHeaderStatKey } from "./dashboard-prefs";
import type { DashboardKpis } from "./dashboard-aggregates";

const STAT_DEFS: Record<
  DashboardHeaderStatKey,
  { icon: typeof LayoutGrid; label: string; toneClass: string; pick: (k: DashboardKpis) => number }
> = {
  total: { icon: LayoutGrid, label: "Screens", toneClass: "text-indigo-300", pick: (k) => k.total },
  system: { icon: Settings2, label: "System tabs", toneClass: "text-violet-300", pick: (k) => k.system },
  directory: { icon: FolderTree, label: "Directory", toneClass: "text-emerald-300", pick: (k) => k.directory },
};

export function buildDashboardHeaderStats(visibleKeys: Set<string>, kpi: DashboardKpis): TabHeaderStatItem[] {
  return DASHBOARD_HEADER_STAT_DEFS.filter((h) => visibleKeys.has(h.key)).map((h) => {
    const def = STAT_DEFS[h.key as DashboardHeaderStatKey];
    return {
      key: h.key,
      icon: def.icon,
      label: def.label,
      value: def.pick(kpi),
      toneClass: def.toneClass,
    };
  });
}
