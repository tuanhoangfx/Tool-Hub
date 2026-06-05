import type { PrefItem } from "../components/sales-shell/DisplayPrefs";

/** Default visible KPI count per tab (6–8 range; standard = 7). */
export const DEFAULT_VISIBLE_KPI_COUNT = 7;

/** First N keys from pref defs — used when a tab should show 7 of 8 by default. */
export function defaultKpiKeysFromDefs(defs: PrefItem[], count = DEFAULT_VISIBLE_KPI_COUNT): Set<string> {
  return new Set(defs.map((d) => d.key).slice(0, count));
}

/** Visible keys = all defs except excluded, capped at count (e.g. Overview off). */
export function defaultKpiKeysExcluding(
  defs: PrefItem[],
  exclude: string[],
  count = DEFAULT_VISIBLE_KPI_COUNT,
): Set<string> {
  const keys = defs.map((d) => d.key).filter((k) => !exclude.includes(k));
  return new Set(keys.slice(0, count));
}
