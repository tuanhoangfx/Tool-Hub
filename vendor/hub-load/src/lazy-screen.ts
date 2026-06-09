import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export type LazyScreenLoaders<T extends string> = Record<
  T,
  () => Promise<{ default: ComponentType<unknown> }>
>;

/**
 * Build React.lazy screen map + idle/hover prefetch helpers (P0004 golden pattern).
 */
export function createLazyScreens<T extends string>(loaders: LazyScreenLoaders<T>) {
  const screens = {} as Record<T, LazyExoticComponent<ComponentType<unknown>>>;
  for (const key of Object.keys(loaders) as T[]) {
    screens[key] = lazy(loaders[key]);
  }

  function prefetch(screen: T): void {
    void loaders[screen]();
  }

  function prefetchAll(): void {
    for (const key of Object.keys(loaders) as T[]) prefetch(key);
  }

  function prefetchIdle(screen: T, timeoutMs = 2000): void {
    const run = () => prefetch(screen);
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(run, { timeout: timeoutMs });
    } else {
      window.setTimeout(run, 400);
    }
  }

  return { screens, prefetch, prefetchAll, prefetchIdle };
}
