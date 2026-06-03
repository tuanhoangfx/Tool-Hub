import {
  DEFAULT_LOCAL_HEALTH_POLL,
  parseLocalHealthPoll,
  type LocalHealthPollValue,
} from "./local-health-prefs";

export type TimeRange = "all" | "today" | "yesterday" | "7d" | "30d" | "90d" | "1y";

export const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All" },
];

export const LIMIT_OPTIONS = [25, 50, 100, 200, 500] as const;

export type HubListPrefs = {
  range: TimeRange;
  limit: number;
  kpi: Set<string> | null;
  charts: Set<string> | null;
  /** Visible Hub filter dropdown keys (null = all defaults). */
  hubFilters: Set<string> | null;
  /** Visible Hub header status chips (null = defaults). */
  headerStats: Set<string> | null;
  /** Visible System header stats (null = defaults). */
  systemHeaderStats: Set<string> | null;
  /** Sticky pin for tab headers (default on). */
  headerPin: boolean;
  /** Sticky pin for Hub search/filter bar (default on). */
  searchPin: boolean;
  /** Show the sidebar submenu expand/collapse icon (default on). */
  navToggleIcon: boolean;
  /** Local dev server probe: off or auto interval (seconds) via URL `lhpoll`. */
  localHealthPoll: LocalHealthPollValue;
};

function parseSet(raw: string | null): Set<string> | null {
  if (raw === null) return null;
  return new Set(raw.split(",").filter(Boolean));
}

export function readHubListPrefs(): HubListPrefs {
  if (typeof window === "undefined") {
    return {
      range: "30d",
      limit: 100,
      kpi: null,
      charts: null,
      hubFilters: null,
      headerStats: null,
      systemHeaderStats: null,
      headerPin: true,
      searchPin: true,
      navToggleIcon: true,
      localHealthPoll: DEFAULT_LOCAL_HEALTH_POLL,
    };
  }
  const sp = new URLSearchParams(window.location.search);
  const range = (sp.get("range") ?? "30d") as TimeRange;
  const limitNum = Number(sp.get("limit"));
  const limit = (LIMIT_OPTIONS as readonly number[]).includes(limitNum) ? limitNum : 100;
  const hpin = sp.get("hpin");
  const spin = sp.get("spin");
  const navicon = sp.get("navicon");
  return {
    range: TIME_RANGES.some((r) => r.value === range) ? range : "30d",
    limit,
    kpi: parseSet(sp.get("kpi")),
    charts: parseSet(sp.get("charts")),
    hubFilters: parseSet(sp.get("hfilt")),
    headerStats: parseSet(sp.get("hstat")),
    systemHeaderStats: parseSet(sp.get("sstat")),
    headerPin: hpin !== "0",
    searchPin: spin !== "0",
    navToggleIcon: navicon !== "0",
    localHealthPoll: parseLocalHealthPoll(sp.get("lhpoll")),
  };
}

import { readAppScreen } from "./app-screen";
import { buildAppUrl } from "./hub-path";
import { sanitizeQueryForScreen } from "./hub-query";

export function patchHubListPrefs(patch: Record<string, string | null>) {
  const screen = readAppScreen();
  const sp = sanitizeQueryForScreen(screen, window.location.search);
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") sp.delete(k);
    else sp.set(k, v);
  }
  const url = buildAppUrl(screen, sp.toString());
  window.history.replaceState(null, "", `${url}${window.location.hash}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
