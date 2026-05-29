import {
  type AppScreen,
  appScreenToPath,
  buildAppUrl,
  pathnameToAppScreen,
  searchWithoutScreenParam,
} from "./hub-path";

export type { AppScreen };

const LEGACY_SCREEN_MAP: Record<string, AppScreen> = {
  library: "library",
  hub: "library",
  users: "users",
  system: "system",
};

export function readAppScreen(): AppScreen {
  if (typeof window === "undefined") return "library";

  const pathScreen = pathnameToAppScreen(window.location.pathname);
  if (pathScreen) return pathScreen;

  const legacy = new URLSearchParams(window.location.search).get("screen");
  if (legacy && LEGACY_SCREEN_MAP[legacy]) return LEGACY_SCREEN_MAP[legacy];

  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "system") return "system";

  return "library";
}

/** Normalize legacy `?screen=` URLs to path routes on first load. */
export function migrateAppUrl(): AppScreen {
  const p = new URLSearchParams(window.location.search);
  const legacyScreen = p.get("screen") ?? (p.get("tab") === "system" ? "system" : null);

  let screen = readAppScreen();

  if (legacyScreen && LEGACY_SCREEN_MAP[legacyScreen]) {
    screen = LEGACY_SCREEN_MAP[legacyScreen];
  }

  if (screen === "system" && !p.get("stab")) {
    p.set("stab", "overview");
  }

  if (screen === "library") {
    p.delete("stab");
  }

  p.delete("screen");
  p.delete("tab");

  const clean = buildAppUrl(screen, p.toString());
  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== clean) {
    window.history.replaceState(null, "", clean);
  }

  return screen;
}

export function setAppScreen(screen: AppScreen, opts?: { replace?: boolean }) {
  const p = new URLSearchParams(window.location.search);
  p.delete("screen");
  p.delete("tab");

  if (screen === "system" && !p.get("stab")) {
    p.set("stab", "overview");
  }
  if (screen === "library") {
    p.delete("stab");
    p.delete("table");
    p.delete("detail");
  }
  if (screen === "users") {
    p.delete("stab");
    p.delete("table");
    p.delete("detail");
  }

  const qs = searchWithoutScreenParam(p.toString());
  const path = appScreenToPath(screen);
  const url = qs ? `${path}?${qs}` : path;

  if (opts?.replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);

  window.dispatchEvent(new PopStateEvent("popstate"));
}
