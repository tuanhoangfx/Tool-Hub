import { Database, LayoutList, Settings2, Tag } from "lucide-react";
import { AppTabHeader } from "../../components/sales-shell/AppTabHeader";
import { APP_VERSION } from "../../lib/app-meta";
import { readSystemTab, type SystemTab } from "./components/SystemTabs";
import { buildSystemHeaderStats, type SystemHeaderMetrics } from "./system-header-metrics";
import { DEFAULT_SYSTEM_HEADER_STAT_KEYS } from "./system-prefs";

const TAB_LABELS: Record<SystemTab, string> = {
  overview: "Overview",
  schema: "Schema",
  template: "Design Template",
};

type SystemTabHeaderProps = {
  registryLive: boolean;
  registryLabel: string;
  versionReleaseDate: string;
  versionReleaseLive: boolean;
  visibleHeaderStats: Set<string>;
  metrics: SystemHeaderMetrics;
  pinSticky?: boolean;
  tab?: SystemTab;
};

export function SystemTabHeader({
  registryLive,
  registryLabel,
  versionReleaseDate,
  versionReleaseLive,
  visibleHeaderStats,
  metrics,
  pinSticky = true,
  tab = readSystemTab(),
}: SystemTabHeaderProps) {
  const statKeys = visibleHeaderStats.size > 0 ? visibleHeaderStats : DEFAULT_SYSTEM_HEADER_STAT_KEYS;

  return (
    <AppTabHeader
      ariaLabel="System header"
      titleIcon={Settings2}
      titleIconClass="text-violet-400"
      title="System"
      pinSticky={pinSticky}
      metaItems={[
        { icon: LayoutList, title: "View", value: TAB_LABELS[tab] },
        { icon: Database, title: "Registry", value: registryLabel, live: registryLive },
        {
          icon: Tag,
          value: `v${APP_VERSION} · ${versionReleaseDate}`,
          live: versionReleaseLive,
        },
      ]}
      centerStats={buildSystemHeaderStats(statKeys, metrics)}
    />
  );
}
