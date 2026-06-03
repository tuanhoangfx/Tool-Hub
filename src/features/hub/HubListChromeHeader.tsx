import type { ReactNode } from "react";
import { useHubChromePrefs } from "@tool-workspace/hub-ui";
import { HubStickyHeader, type HubHeaderKpi } from "./HubStickyHeader";

type Props = {
  registryLive: boolean;
  registryLabel: string;
  versionReleaseDate: string;
  versionReleaseLive: boolean;
  visibleHeaderStats: Set<string>;
  kpi: HubHeaderKpi;
  actions?: ReactNode;
};

/** Hub list tab header — pin/embedded from `configureHubChromePrefs` + `HubTabChrome` stack. */
export function HubListChromeHeader({
  registryLive,
  registryLabel,
  versionReleaseDate,
  versionReleaseLive,
  visibleHeaderStats,
  kpi,
  actions,
}: Props) {
  const { searchPin, headerPin, stackChrome } = useHubChromePrefs();

  return (
    <HubStickyHeader
      registryLive={registryLive}
      registryLabel={registryLabel}
      versionReleaseDate={versionReleaseDate}
      versionReleaseLive={versionReleaseLive}
      visibleHeaderStats={visibleHeaderStats}
      kpi={kpi}
      pinSticky={stackChrome ? false : headerPin}
      dividerBelow={stackChrome ? false : !searchPin}
      embedded={stackChrome}
      actions={actions}
    />
  );
}
