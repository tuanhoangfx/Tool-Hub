import type { AppScreen } from "./hub-path";
import { buildSystemUrl, readSystemRoute } from "./system-path";

const LEGACY_DROP = ["screen", "tab", "stab"] as const;

/** Hub catalog prefs — only on `/` (global shell: hpin, spin, navicon — not listed here). */
const LIBRARY_KEYS = [
  "range",
  "limit",
  "kpi",
  "charts",
  "hfilt",
  "hstat",
  "tool",
  "detail",
] as const;

const DESIGN_QUERY_KEYS = ["dt", "dtpl", "qv", "sqv", "qm", "sqm", "live"] as const;

function parseSearch(search = ""): URLSearchParams {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(raw);
}

/** Map legacy long query keys (migrated to path on next navigation). */
export function normalizeDesignQuery(p: URLSearchParams): void {
  const dtpl = p.get("dtpl");
  if (dtpl === "supabase-quota") {
    p.set("dt", "sq");
    p.delete("dtpl");
  } else if (dtpl) {
    p.set("dt", dtpl);
    p.delete("dtpl");
  }

  const sqv = p.get("sqv");
  if (sqv) {
    const n = sqv.replace(/^V/i, "");
    if (n) p.set("qv", n);
    p.delete("sqv");
  }

  const sqm = p.get("sqm");
  if (sqm) {
    p.set("qm", sqm === "live" ? "1" : "0");
    p.delete("sqm");
  }
}

/** Drop query keys that do not belong on the current screen. */
export function sanitizeQueryForScreen(screen: AppScreen, search = ""): URLSearchParams {
  const p = parseSearch(search);
  for (const k of LEGACY_DROP) p.delete(k);
  normalizeDesignQuery(p);

  if (screen === "dashboard") {
    for (const k of ["tool", "detail"] as const) p.delete(k);
    for (const k of DESIGN_QUERY_KEYS) p.delete(k);
    p.delete("table");
    p.delete("sstat");
  } else if (screen === "library") {
    for (const k of DESIGN_QUERY_KEYS) p.delete(k);
    p.delete("table");
    p.delete("sstat");
  } else if (screen === "users") {
    for (const k of ["range", "limit", "hfilt", "hstat", "tool", "detail"] as const) p.delete(k);
    for (const k of DESIGN_QUERY_KEYS) p.delete(k);
    p.delete("table");
    p.delete("sstat");
  } else if (screen === "system") {
    for (const k of LIBRARY_KEYS) p.delete(k);
    p.delete("detail");
    for (const k of DESIGN_QUERY_KEYS) p.delete(k);
    p.delete("table");
  }

  return p;
}

export type DesignVariant = "V1" | "V2" | "V3" | "V4" | "V5";
const VARIANTS: DesignVariant[] = ["V1", "V2", "V3", "V4", "V5"];

export function readDesignVariant(): DesignVariant {
  const route = readSystemRoute();
  if (route.tab !== "template") return "V1";
  const n = route.design?.variant ?? 1;
  const v = `V${n}` as DesignVariant;
  return VARIANTS.includes(v) ? v : "V1";
}

/** `/system/template` or `/system/template/3` */
export function patchDesignVariant(
  variant: DesignVariant,
  template: "tool-access" | "agent-context" = "agent-context",
) {
  const route = readSystemRoute();
  route.tab = "template";
  route.design = {
    template,
    variant: Number(variant.replace(/^V/i, "")) || 1,
    live: false,
  };
  const p = sanitizeQueryForScreen("system", window.location.search);
  const url = buildSystemUrl(route, p.toString());
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
