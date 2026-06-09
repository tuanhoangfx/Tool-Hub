import { readAppScreen, setAppScreen } from "../../lib/app-screen";
import { setSystemTab, SYSTEM_TAB_ITEMS, type SystemTab } from "../../features/system-hub/components/SystemTabs";
import { prefetchSystemTab } from "../../features/system-hub/system-tab-prefetch";
import { NavGroupSubNav } from "@tool-workspace/hub-ui";

function openSystemTab(id: SystemTab) {
  if (readAppScreen() !== "system") setAppScreen("system");
  setSystemTab(id);
}

export function SystemTabSubNav({ activeTab }: { activeTab: SystemTab | null }) {
  return (
    <NavGroupSubNav
      className="system-tab-subnav ml-3 mt-1.5 space-y-0.5"
      activeId={activeTab}
      items={SYSTEM_TAB_ITEMS.map(({ id, label, icon, iconTone }) => ({
        id,
        label,
        icon,
        iconTone,
      }))}
      onSelect={openSystemTab}
      onPrefetch={prefetchSystemTab}
    />
  );
}
