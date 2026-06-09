import { Gauge } from "lucide-react";
import type { ReactNode } from "react";
import { HUB_UI_TEMPLATE_META, navBadgeIconClass, useHubChromePrefs } from "@tool-workspace/hub-ui";
import { AppTabHeader } from "../../components/sales-shell/AppTabHeader";
import { buildVersionMetaItems } from "../../lib/hub-tab-header-meta";
import { DEFAULT_DASHBOARD_HEADER_STAT_KEYS } from "./dashboard-prefs";
import { buildDashboardHeaderStats } from "./dashboard-header-metrics";
import type { DashboardKpis } from "./dashboard-aggregates";

type Props = {
  versionReleaseDate: string;
  visibleHeaderStats: Set<string>;
  kpi: DashboardKpis;
  actions?: ReactNode;
};

export function DashboardChromeHeader({
  versionReleaseDate,
  visibleHeaderStats,
  kpi,
  actions,
}: Props) {
  const { searchPin, headerPin, stackChrome } = useHubChromePrefs();
  const statKeys = visibleHeaderStats.size > 0 ? visibleHeaderStats : DEFAULT_DASHBOARD_HEADER_STAT_KEYS;

  return (
    <AppTabHeader
      ariaLabel="Dashboard header"
      titleIcon={Gauge}
      title="Dashboard"
      pinSticky={stackChrome ? false : headerPin}
      dividerBelow={stackChrome ? false : !searchPin}
      embedded={stackChrome}
      metaItems={buildVersionMetaItems(versionReleaseDate)}
      centerStats={buildDashboardHeaderStats(statKeys, kpi)}
      titleIconClass={navBadgeIconClass(HUB_UI_TEMPLATE_META.dashboard.iconTone)}
      actions={actions}
    />
  );
}
