import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { AppTabHeader, useHubChromePrefs, type TabHeaderStatItem } from "@tool-workspace/hub-ui";
import { buildVersionMetaItems } from "../../lib/hub-tab-header-meta";

type Props = {
  versionReleaseDate: string;
  centerStats: TabHeaderStatItem[];
  actions?: ReactNode;
};

/** Users tab header — same left/center/right contract as Hub. */
export function UserListChromeHeader({ versionReleaseDate, centerStats, actions }: Props) {
  const { searchPin, headerPin, stackChrome } = useHubChromePrefs();

  return (
    <AppTabHeader
      ariaLabel="Users header"
      titleIcon={Users}
      titleIconClass="text-emerald-300"
      title="Users"
      metaItems={buildVersionMetaItems(versionReleaseDate)}
      centerStats={centerStats}
      pinSticky={stackChrome ? false : headerPin}
      dividerBelow={stackChrome ? false : !searchPin}
      embedded={stackChrome}
      actions={actions}
    />
  );
}
