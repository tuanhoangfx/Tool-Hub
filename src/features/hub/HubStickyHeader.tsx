import { LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";
import { AppTabHeader } from "../../components/sales-shell/AppTabHeader";
import { buildVersionMetaItems } from "../../lib/hub-tab-header-meta";
import { DEFAULT_HUB_HEADER_STAT_KEYS } from "./hub-prefs";
import { buildHubHeaderStats, type HubHeaderKpi } from "./hub-header-metrics";

export type { HubHeaderKpi };

type HubStickyHeaderProps = {
  registryLive: boolean;
  registryLabel: string;
  versionReleaseDate: string;
  versionReleaseLive: boolean;
  visibleHeaderStats: Set<string>;
  kpi: HubHeaderKpi;
  pinSticky?: boolean;
  dividerBelow?: boolean;
  embedded?: boolean;
  actions?: ReactNode;
};

export function HubStickyHeader({
  versionReleaseDate,
  versionReleaseLive: _versionReleaseLive,
  visibleHeaderStats,
  kpi,
  pinSticky = true,
  dividerBelow = true,
  embedded = false,
  actions,
}: HubStickyHeaderProps) {
  const statKeys = visibleHeaderStats.size > 0 ? visibleHeaderStats : DEFAULT_HUB_HEADER_STAT_KEYS;

  return (
    <AppTabHeader
      ariaLabel="Hub header"
      titleIcon={LayoutGrid}
      title="Hub"
      pinSticky={pinSticky}
      dividerBelow={dividerBelow}
      embedded={embedded}
      metaItems={buildVersionMetaItems(versionReleaseDate)}
      centerStats={buildHubHeaderStats(statKeys, kpi)}
      titleIconClass="text-indigo-400"
      actions={actions}
    />
  );
}
