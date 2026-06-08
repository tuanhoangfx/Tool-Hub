import {
  configureHubUrlPrefs,
  parseHubPrefSet,
  patchHubListPrefs,
  readHubListPrefsCore,
  TIME_RANGES,
  LIMIT_OPTIONS,
  type TimeRange,
} from "@tool-workspace/hub-ui";
import { readAppScreen } from "./app-screen";
import { buildAppUrl } from "./hub-path";
import { sanitizeQueryForScreen } from "./hub-query";

export type { TimeRange };
export { TIME_RANGES, LIMIT_OPTIONS, patchHubListPrefs, parseHubPrefSet };

export type HubListPrefs = {
  range: TimeRange;
  limit: number;
  tablePageSize: number;
  kpi: Set<string> | null;
  charts: Set<string> | null;
  hubFilters: Set<string> | null;
  /** Dashboard filter visibility (`dfilt`) — separate from Hub `hfilt`. */
  dashFilters: Set<string> | null;
  headerStats: Set<string> | null;
  systemHeaderStats: Set<string> | null;
  headerPin: boolean;
  searchPin: boolean;
  navToggleIcon: boolean;
};

configureHubUrlPrefs({
  defaultRange: "30d",
  defaultLimit: 100,
  patchImpl: (patch) => {
    const screen = readAppScreen();
    const sp = sanitizeQueryForScreen(screen, window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) sp.delete(k);
      else sp.set(k, v);
    }
    const url = buildAppUrl(screen, sp.toString());
    window.history.replaceState(null, "", `${url}${window.location.hash}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  },
});

export function readHubListPrefs(): HubListPrefs {
  const core = readHubListPrefsCore();
  if (typeof window === "undefined") {
    return {
      ...core,
      dashFilters: null,
      navToggleIcon: true,
    };
  }
  const sp = new URLSearchParams(window.location.search);
  const navicon = sp.get("navicon");
  return {
    ...core,
    dashFilters: parseHubPrefSet(sp.get("dfilt")),
    navToggleIcon: navicon !== "0",
  };
}
