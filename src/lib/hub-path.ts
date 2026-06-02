import { buildSystemUrl, migrateSystemUrl, parseSystemRoute, readSystemRoute } from "./system-path";
import { sanitizeQueryForScreen } from "./hub-query";

export type AppScreen = "library" | "system" | "users";

export function pathnameToAppScreen(pathname: string): AppScreen | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/" || normalized === "") return "library";
  if (normalized === "/users" || normalized.startsWith("/users/")) return "users";
  if (normalized === "/system" || normalized.startsWith("/system/")) return "system";
  return null;
}

function parseSearch(search = ""): URLSearchParams {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(raw);
}

export function searchWithoutScreenParam(search = ""): string {
  const screen =
    pathnameToAppScreen(typeof window !== "undefined" ? window.location.pathname : "/") ?? "library";
  return sanitizeQueryForScreen(screen, search).toString();
}

/** Build URL for library/users; system uses path segments via `buildSystemUrl`. */
export function buildAppUrl(screen: AppScreen, search = ""): string {
  if (screen === "system") {
    if (typeof window !== "undefined") {
      const route = readSystemRoute();
      const p = sanitizeQueryForScreen("system", search);
      return buildSystemUrl(route, p.toString());
    }
    const route = parseSystemRoute("/system/overview", search);
    return buildSystemUrl(route, sanitizeQueryForScreen("system", search).toString());
  }

  const base = screen === "users" ? "/users" : "/";
  const q = sanitizeQueryForScreen(screen, search).toString();
  return q ? `${base}?${q}` : base;
}

export { buildSystemUrl, migrateSystemUrl, parseSystemRoute, readSystemRoute };
