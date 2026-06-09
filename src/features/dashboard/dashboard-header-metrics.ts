import {
  HUB_APP_TAB_GROUP_META,
  HUB_UI_TEMPLATE_META,
  navBadgeIconClass,
  type NavIconTone,
} from "@tool-workspace/hub-ui";
import type { TabHeaderStatItem } from "../../components/sales-shell/AppTabHeader";
import { DASHBOARD_HEADER_STAT_DEFS, type DashboardHeaderStatKey } from "./dashboard-prefs";
import type { DashboardKpis } from "./dashboard-aggregates";

const STAT_DEFS: Record<
  DashboardHeaderStatKey,
  {
    label: string;
    iconTone: NavIconTone;
    icon: (typeof HUB_UI_TEMPLATE_META)["dashboard"]["icon"];
    pick: (k: DashboardKpis) => number;
  }
> = {
  total: {
    label: "Screens",
    iconTone: HUB_UI_TEMPLATE_META.dashboard.iconTone,
    icon: HUB_UI_TEMPLATE_META.dashboard.icon,
    pick: (k) => k.total,
  },
  system: {
    label: "System tabs",
    iconTone: HUB_APP_TAB_GROUP_META.system.iconTone,
    icon: HUB_APP_TAB_GROUP_META.system.icon,
    pick: (k) => k.system,
  },
  directory: {
    label: "Directory",
    iconTone: HUB_UI_TEMPLATE_META.directory.iconTone,
    icon: HUB_UI_TEMPLATE_META.directory.icon,
    pick: (k) => k.directory,
  },
};

export function buildDashboardHeaderStats(visibleKeys: Set<string>, kpi: DashboardKpis): TabHeaderStatItem[] {
  return DASHBOARD_HEADER_STAT_DEFS.filter((h) => visibleKeys.has(h.key)).map((h) => {
    const def = STAT_DEFS[h.key as DashboardHeaderStatKey];
    return {
      key: h.key,
      icon: def.icon,
      label: def.label,
      value: def.pick(kpi),
      toneClass: navBadgeIconClass(def.iconTone),
    };
  });
}
