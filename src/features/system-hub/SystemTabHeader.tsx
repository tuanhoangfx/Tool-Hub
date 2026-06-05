import type { ReactNode } from "react";
import { AppTabHeader, type TabHeaderStatItem } from "@tool-workspace/hub-ui";
import { buildVersionMetaItems } from "../../lib/hub-tab-header-meta";
import { readSystemTab, SYSTEM_TAB_ITEMS } from "./components/SystemTabs";

type SystemTabHeaderProps = {
  versionReleaseDate: string;
  centerStats: TabHeaderStatItem[];
  pinSticky?: boolean;
  dividerBelow?: boolean;
  embedded?: boolean;
  actions?: ReactNode;
};

export function SystemTabHeader({
  versionReleaseDate,
  centerStats,
  pinSticky = true,
  dividerBelow = true,
  embedded = false,
  actions,
}: SystemTabHeaderProps) {
  const tab = readSystemTab();
  const item = SYSTEM_TAB_ITEMS.find((row) => row.id === tab) ?? SYSTEM_TAB_ITEMS[0];
  const Icon = item.icon;

  return (
    <AppTabHeader
      ariaLabel={`${item.label} header`}
      titleIcon={Icon}
      titleIconClass="text-violet-400"
      title={item.label}
      pinSticky={pinSticky}
      dividerBelow={dividerBelow}
      embedded={embedded}
      metaItems={buildVersionMetaItems(versionReleaseDate)}
      centerStats={centerStats}
      actions={actions}
    />
  );
}
