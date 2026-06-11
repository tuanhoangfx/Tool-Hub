import { useEffect, useRef } from "react";

export type UseHydrateTabCacheOptions = {
  enabled?: boolean;
};

/**
 * Hydrate directory tab state from sessionStorage + IndexedDB on mount.
 * `cacheKey` should change when the data scope changes (e.g. botId).
 */
export function useHydrateTabCache<T>(
  cacheKey: string,
  hydrate: () => Promise<T | null | undefined>,
  onHydrate: (data: T) => void,
  opts?: UseHydrateTabCacheOptions,
): void {
  const onHydrateRef = useRef(onHydrate);
  onHydrateRef.current = onHydrate;

  useEffect(() => {
    if (opts?.enabled === false || !cacheKey) return;
    let cancelled = false;
    void hydrate().then((data) => {
      if (cancelled || data == null) return;
      onHydrateRef.current(data);
    });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, hydrate, opts?.enabled]);
}
