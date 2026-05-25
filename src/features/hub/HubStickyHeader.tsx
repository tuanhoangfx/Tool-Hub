import { Database, LayoutGrid, Tag } from "lucide-react";
import { AppTabHeader } from "../../components/sales-shell/AppTabHeader";
import { APP_VERSION } from "../../lib/app-meta";
import { DEFAULT_HUB_HEADER_STAT_KEYS } from "./hub-prefs";
import { buildHubHeaderStats } from "./hub-header-metrics";

export type HubHeaderKpi = {
  ready: number;
  drift: number;
  releases: number;
  linkGaps: number;
};

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
};

export function HubStickyHeader({
  registryLive,
  registryLabel,
  versionReleaseDate,
  versionReleaseLive,
  visibleHeaderStats,
  kpi,
  pinSticky = true,
  dividerBelow = true,
  embedded = false,
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
      metaItems={[
        { icon: Database, title: "Registry", value: registryLabel, live: registryLive },
        {
          icon: Tag,
          value: `v${APP_VERSION} · ${versionReleaseDate}`,
          live: versionReleaseLive,
        },
      ]}
      centerStats={buildHubHeaderStats(statKeys, kpi)}
      titleIconClass="text-indigo-400"
    />
  );
}
