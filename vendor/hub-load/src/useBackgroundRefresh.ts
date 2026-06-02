import { useCallback, useRef, useState } from "react";

export type BackgroundRefreshOpts = {
  /** Default true when stale cache exists */
  silent?: boolean;
  /** Force blocking load UI */
  forceLoading?: boolean;
};

export type UseBackgroundRefreshOptions<T> = {
  /** Gate fetch (e.g. session present) */
  enabled: boolean;
  cache: {
    readStale: () => T | null;
    readFresh?: () => T | null;
  };
  fetch: () => Promise<T>;
  onData: (data: T) => void;
  onError?: (error: unknown) => void;
  /** When true, errors only surface if no stale data */
  suppressErrorIfStale?: boolean;
};

export type UseBackgroundRefreshResult = {
  loading: boolean;
  refreshing: boolean;
  refresh: (opts?: BackgroundRefreshOpts) => Promise<void>;
  hasStale: boolean;
};

/**
 * Hub-like refresh: show stale cache immediately, sync in background.
 * - `loading` only when no stale data and not silent
 * - `refreshing` during background sync when stale exists
 */
export function useBackgroundRefresh<T>(options: UseBackgroundRefreshOptions<T>): UseBackgroundRefreshResult {
  const { enabled, cache, fetch, onData, onError, suppressErrorIfStale = true } = options;
  const inFlightRef = useRef(false);

  const hasStale = cache.readStale() != null;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(
    async (opts?: BackgroundRefreshOpts) => {
      if (!enabled) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      const stale = cache.readStale();
      const silent = opts?.silent ?? stale != null;
      const block = opts?.forceLoading ?? (!silent && stale == null);

      if (block) setLoading(true);
      else if (stale != null) setRefreshing(true);

      try {
        const data = await fetch();
        onData(data);
      } catch (error) {
        if (!suppressErrorIfStale || stale == null) onError?.(error);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled, cache, fetch, onData, onError, suppressErrorIfStale],
  );

  return {
    loading,
    refreshing,
    refresh,
    hasStale,
  };
}
