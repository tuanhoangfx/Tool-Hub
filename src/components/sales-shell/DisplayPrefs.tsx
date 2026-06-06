import { useEffect, useState, type ReactNode } from "react";
import {
  countHiddenUserTableColumns,
  UserTableColumnsSettings,
} from "../../features/identity/UserTableColumnsSettings";
import { UserTableColumnsResetAction } from "../../features/identity/UserTableColumnsResetAction";
import { readSystemTab } from "../../features/system-hub/components/SystemTabs";
import {
  patchSystemTabDisplay,
  resetSystemTabDisplay,
  readSystemTabDisplay,
} from "../../features/system-hub/system-display-prefs";
import { readAppScreen } from "../../lib/app-screen";
import { patchHubListPrefs, readHubListPrefs } from "../../lib/url-prefs";
import {
  HubDisplayPrefs,
  type HubDisplayPrefsProps,
  type PrefItem,
} from "@tool-workspace/hub-ui";

export type { PrefItem };

type DisplayPrefsProps = Omit<
  HubDisplayPrefsProps,
  | "readPrefs"
  | "patchPrefs"
  | "getScreen"
  | "getSystemTab"
  | "systemDisplay"
  | "tablePanel"
  | "tableActiveCount"
  | "onLog"
> & {
  showUsersTableColumns?: boolean;
  generalExtras?: ReactNode;
  generalSectionToc?: HubDisplayPrefsProps["generalSectionToc"];
};

/** Match P0020 Cookie Auto header Settings panel (width, tabs, max height). */
const P0020_SETTINGS_PANEL_WIDTH = 420;
const P0020_SETTINGS_MAX_PANEL_HEIGHT = "min(80vh, 42rem)";

export function DisplayPrefs({
  showUsersTableColumns = false,
  generalExtras,
  generalSectionToc,
  panelWidth = P0020_SETTINGS_PANEL_WIDTH,
  maxPanelHeight = P0020_SETTINGS_MAX_PANEL_HEIGHT,
  ...props
}: DisplayPrefsProps) {
  const [hiddenUserCols, setHiddenUserCols] = useState(() =>
    showUsersTableColumns ? countHiddenUserTableColumns() : 0,
  );

  useEffect(() => {
    if (!showUsersTableColumns) return;
    const onUserCols = () => setHiddenUserCols(countHiddenUserTableColumns());
    window.addEventListener("user-table-columns-change", onUserCols);
    return () => window.removeEventListener("user-table-columns-change", onUserCols);
  }, [showUsersTableColumns]);

  return (
    <HubDisplayPrefs
      panelWidth={panelWidth}
      maxPanelHeight={maxPanelHeight}
      {...props}
      generalExtras={generalExtras}
      generalSectionToc={generalSectionToc}
      readPrefs={readHubListPrefs}
      patchPrefs={(patch) => patchHubListPrefs(patch)}
      getScreen={() => readAppScreen()}
      getSystemTab={() => readSystemTab()}
      systemDisplay={{
        read: (tab) => readSystemTabDisplay(tab as ReturnType<typeof readSystemTab>),
        patch: (tab, patch) => patchSystemTabDisplay(tab as ReturnType<typeof readSystemTab>, patch),
        reset: (tab) => resetSystemTabDisplay(tab as ReturnType<typeof readSystemTab>),
      }}
      tablePanel={showUsersTableColumns ? <UserTableColumnsSettings /> : undefined}
      tableSectionActions={showUsersTableColumns ? <UserTableColumnsResetAction /> : undefined}
      tableActiveCount={hiddenUserCols}
      onLog={(scope, message) => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(new CustomEvent("tool-hub-log", { detail: { scope, message } }));
      }}
    />
  );
}
