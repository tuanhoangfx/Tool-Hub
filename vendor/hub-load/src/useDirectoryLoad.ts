import { useEffect, useRef } from "react";
import { useHydrateTabCache } from "./useHydrateTabCache";

export type UseDirectoryLoadOptions<T> = {
  /** Changes when data scope changes (e.g. botId). */
  scopeKey: string;
  active?: boolean;
  hydrate: () => Promise<T | null | undefined>;
  applyCache: (data: T) => void;
  /** Network revalidate — `silent` true when cached rows already painted. */
  revalidate: (silent: boolean) => void | Promise<void>;
  hasCachedData: boolean;
};

/**
 * Hydrate directory tab from sessionStorage + IndexedDB, then silent revalidate when cache exists.
 */
export function useDirectoryLoad<T>({
  scopeKey,
  active = true,
  hydrate,
  applyCache,
  revalidate,
  hasCachedData,
}: UseDirectoryLoadOptions<T>): void {
  useHydrateTabCache(scopeKey, hydrate, applyCache, { enabled: active });

  const revalidateRef = useRef(revalidate);
  revalidateRef.current = revalidate;
  const hasCachedRef = useRef(hasCachedData);
  hasCachedRef.current = hasCachedData;

  useEffect(() => {
    if (!active || !scopeKey) return;
    void revalidateRef.current(hasCachedRef.current);
  }, [active, scopeKey]);
}
