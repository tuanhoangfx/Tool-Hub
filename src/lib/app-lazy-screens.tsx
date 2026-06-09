import { createModulePrefetch } from "@dev/hub-load";
import { lazy } from "react";
import type { AppScreen } from "./app-screen";

export const LazyAppScreens = {
  dashboard: lazy(() =>
    import("../features/dashboard/DashboardListPage").then((m) => ({ default: m.DashboardListPage })),
  ),
  library: lazy(() =>
    import("../features/hub/HubListPage").then((m) => ({ default: m.HubListPage })),
  ),
  users: lazy(() =>
    import("../features/identity/UserManagementScreen").then((m) => ({
      default: m.UserManagementScreen,
    })),
  ),
  system: lazy(() =>
    import("../features/system-hub/SystemHubScreen").then((m) => ({ default: m.SystemHubScreen })),
  ),
};

const chunkPrefetch = createModulePrefetch<AppScreen>({
  dashboard: () => import("../features/dashboard/DashboardListPage"),
  library: () => import("../features/hub/HubListPage"),
  users: () => import("../features/identity/UserManagementScreen"),
  system: () => import("../features/system-hub/SystemHubScreen"),
});

export function prefetchAppScreen(screen: AppScreen): void {
  chunkPrefetch.prefetch(screen);
}

export function prefetchAllAppScreens(): void {
  chunkPrefetch.prefetchAll();
}

export function prefetchAppScreenIdle(screen: AppScreen, timeoutMs = 2000): void {
  const run = () => prefetchAppScreen(screen);
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: timeoutMs });
  } else {
    window.setTimeout(run, 400);
  }
}
