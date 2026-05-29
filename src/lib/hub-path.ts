export type AppScreen = "library" | "system" | "users";

/** Path-first routes for Tool Hub (SPA). */
export const APP_SCREEN_PATH: Record<AppScreen, string> = {
  library: "/",
  users: "/users",
  system: "/system",
};

const PATH_TO_SCREEN = new Map<string, AppScreen>([
  ["/", "library"],
  ["", "library"],
  ["/users", "users"],
  ["/system", "system"],
]);

export function pathnameToAppScreen(pathname: string): AppScreen | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return PATH_TO_SCREEN.get(normalized) ?? null;
}

export function appScreenToPath(screen: AppScreen): string {
  return APP_SCREEN_PATH[screen];
}

function parseSearch(search: string): URLSearchParams {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(raw);
}

export function searchWithoutScreenParam(search = ""): string {
  const p = parseSearch(search);
  p.delete("screen");
  p.delete("tab");
  return p.toString();
}

/** Build URL for a screen; drops legacy `screen` when path is canonical. */
export function buildAppUrl(screen: AppScreen, search = ""): string {
  const base = appScreenToPath(screen);
  const q = searchWithoutScreenParam(search);
  return q ? `${base}?${q}` : base;
}
