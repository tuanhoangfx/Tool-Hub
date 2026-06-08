import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { HubListChromeHeader, type TabHeaderStatItem } from "@tool-workspace/hub-ui";
import { buildVersionMetaItems } from "../../lib/hub-tab-header-meta";

type Props = {
  versionReleaseDate: string;
  centerStats: TabHeaderStatItem[];
  actions?: ReactNode;
};

/** Users tab header — same left/center/right contract as Hub. */
export function UserListChromeHeader({ versionReleaseDate, centerStats, actions }: Props) {
  return (
    <HubListChromeHeader
      ariaLabel="Users header"
      titleIcon={Users}
      titleIconClass="text-emerald-300"
      title="Users"
      metaItems={buildVersionMetaItems(versionReleaseDate)}
      centerStats={centerStats}
      actions={actions}
    />
  );
}
