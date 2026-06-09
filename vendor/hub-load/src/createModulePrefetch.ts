/**
 * Prefetch dynamic import() or API warmers on sidebar hover / idle (P0004 golden pattern).
 */
export function createModulePrefetch<T extends string>(
  loaders: Record<T, () => Promise<unknown>>,
) {
  const inflight = new Set<T>();

  function prefetch(screen: T): void {
    if (inflight.has(screen)) return;
    inflight.add(screen);
    void loaders[screen]()
      .catch(() => {})
      .finally(() => {
        inflight.delete(screen);
      });
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

  return { prefetch, prefetchAll, prefetchIdle };
}
