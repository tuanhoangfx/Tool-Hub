import { useCallback, useEffect, useRef, useState } from "react";
import { useDirectoryLoad } from "./useDirectoryLoad";

export type UseStaleWhileRevalidateDirectoryOptions<T> = {
  scopeKey: string;
  active?: boolean;
  hydrate: () => Promise<T | null | undefined>;
  applyCache: (data: T) => void;
  /** Network fetch — receives silent=true when cached rows already painted. */
  fetchFresh: (opts: { silent: boolean }) => void | Promise<void>;
  hasCachedData: boolean;
};

export type UseStaleWhileRevalidateDirectoryResult = {
  loading: boolean;
  refreshing: boolean;
  revalidate: (opts?: { silent?: boolean; force?: boolean }) => Promise<void>;
};

/**
 * Directory tab load: hydrate session/IDB cache, then stale-while-revalidate with loading flags.
 * Combines {@link useDirectoryLoad} scope/revalidate with explicit loading/refreshing state.
 */
export function useStaleWhileRevalidateDirectory<T>({
  scopeKey,
  active = true,
  hydrate,
  applyCache,
  fetchFresh,
  hasCachedData,
}: UseStaleWhileRevalidateDirectoryOptions<T>): UseStaleWhileRevalidateDirectoryResult {
  const [loading, setLoading] = useState(() => !hasCachedData);
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef(false);

  const revalidate = useCallback(
    async (opts?: { silent?: boolean; force?: boolean }) => {
      if (!active) return;
      if (inFlightRef.current && !opts?.force) return;
      inFlightRef.current = true;
      const silent = opts?.silent ?? hasCachedData;
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        await fetchFresh({ silent });
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [active, fetchFresh, hasCachedData],
  );

  useDirectoryLoad({
    scopeKey,
    active,
    hydrate,
    applyCache,
    revalidate: (silent) => void revalidate({ silent }),
    hasCachedData,
  });

  useEffect(() => {
    if (!hasCachedData) setLoading(true);
  }, [hasCachedData]);

  return { loading, refreshing, revalidate };
}
