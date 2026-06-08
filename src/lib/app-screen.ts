import type { AppScreen } from "./hub-path";
import { buildAppUrl, migrateSystemUrl, pathnameToAppScreen } from "./hub-path";
import { sanitizeQueryForScreen } from "./hub-query";
import { buildSystemUrl, readSystemRoute } from "./system-path";

export type { AppScreen };

const LEGACY_SCREEN_MAP: Record<string, AppScreen> = {
  dashboard: "dashboard",
  library: "library",
  hub: "library",
  users: "users",
  system: "system",
};

export function readAppScreen(): AppScreen {
  if (typeof window === "undefined") return "dashboard";

  const pathScreen = pathnameToAppScreen(window.location.pathname);
  if (pathScreen) return pathScreen;

  const legacy = new URLSearchParams(window.location.search).get("screen");
  if (legacy && LEGACY_SCREEN_MAP[legacy]) return LEGACY_SCREEN_MAP[legacy];

  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "system") return "system";

  return "dashboard";
}

/** Normalize legacy URLs → path routes (`/system/overview`, …). */
export function migrateAppUrl(): AppScreen {
  const legacyScreen =
    new URLSearchParams(window.location.search).get("screen") ??
    (new URLSearchParams(window.location.search).get("tab") === "system" ? "system" : null);

  let screen = readAppScreen();
  if (legacyScreen && LEGACY_SCREEN_MAP[legacyScreen]) {
    screen = LEGACY_SCREEN_MAP[legacyScreen];
  }

  let clean: string;
  if (screen === "system") {
    const migrated = migrateSystemUrl();
    clean = migrated ?? buildSystemUrl(readSystemRoute(), sanitizeQueryForScreen("system", window.location.search).toString());
  } else {
    clean = buildAppUrl(screen, sanitizeQueryForScreen(screen, window.location.search).toString());
  }

  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== clean) {
    window.history.replaceState(null, "", clean);
  }

  return screen;
}

export function setAppScreen(screen: AppScreen, opts?: { replace?: boolean }) {
  let url: string;

  if (screen === "system") {
    const route =
      readAppScreen() === "system" ? readSystemRoute() : { tab: "overview" as const };
    const p = sanitizeQueryForScreen("system", window.location.search);
    url = buildSystemUrl(route, p.toString());
  } else {
    url = buildAppUrl(screen, sanitizeQueryForScreen(screen, window.location.search).toString());
  }

  if (opts?.replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);

  window.dispatchEvent(new PopStateEvent("popstate"));
}
