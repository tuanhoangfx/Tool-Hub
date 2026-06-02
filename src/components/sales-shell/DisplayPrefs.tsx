import { useEffect, useState } from "react";
import {
  countHiddenUserTableColumns,
  UserTableColumnsSettings,
} from "../../features/identity/UserTableColumnsSettings";
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
};

export function DisplayPrefs({ showUsersTableColumns = false, ...props }: DisplayPrefsProps) {
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
      {...props}
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
      tableActiveCount={hiddenUserCols}
      onLog={(scope, message) => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(new CustomEvent("tool-hub-log", { detail: { scope, message } }));
      }}
    />
  );
}
