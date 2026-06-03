import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { AppTabHeader, useHubChromePrefs, type TabHeaderStatItem } from "@tool-workspace/hub-ui";
import { APP_VERSION } from "../../lib/app-meta";

type Props = {
  centerStats: TabHeaderStatItem[];
  actions?: ReactNode;
};

/** Users tab header — pin/embedded from URL prefs via `configureHubChromePrefs`. */
export function UserListChromeHeader({ centerStats, actions }: Props) {
  const { searchPin, headerPin, stackChrome } = useHubChromePrefs();

  return (
    <AppTabHeader
      ariaLabel="Users header"
      titleIcon={Users}
      titleIconClass="text-emerald-300"
      title="Users"
      metaItems={[
        { icon: Users, title: "Build", value: `v${APP_VERSION}` },
        { icon: Users, title: "Project", value: "x1z10 P01" },
      ]}
      centerStats={centerStats}
      pinSticky={stackChrome ? false : headerPin}
      dividerBelow={stackChrome ? false : !searchPin}
      embedded={stackChrome}
      actions={actions}
    />
  );
}
