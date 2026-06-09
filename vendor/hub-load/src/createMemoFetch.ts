import { createClientCache, type ClientCache } from "./createClientCache";

export type MemoFetchOptions = {
  /** Storage key prefix (per-app namespace). */
  prefix: string;
  ttlMs?: number;
};

/**
 * Session-backed memo fetch — replaces ad-hoc lib/cache.ts memoFetch in P0004 tools.
 */
export function createMemoFetch({ prefix, ttlMs = 5 * 60_000 }: MemoFetchOptions) {
  const caches = new Map<string, ClientCache<unknown>>();

  function cacheFor<T>(key: string): ClientCache<T> {
    const fullKey = `${prefix}:${key}`;
    const existing = caches.get(fullKey);
    if (existing) return existing as ClientCache<T>;
    const created = createClientCache<T>({ key: fullKey, ttlMs });
    caches.set(fullKey, created as ClientCache<unknown>);
    return created;
  }

  return async function memoFetch<T>(
    key: string,
    fetcher: () => Promise<T | undefined>,
  ): Promise<T | undefined> {
    const cache = cacheFor<T>(key);
    const fresh = cache.readFresh();
    if (fresh !== null) return fresh;
    const result = await fetcher();
    if (result !== undefined) cache.write(result);
    return result ?? cache.readStale() ?? undefined;
  };
}

export function createMemoFetchClear(prefix: string) {
  return function clearMemoFetchCache() {
    if (typeof sessionStorage === "undefined") return;
    const needle = `${prefix}:`;
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.includes(needle)) keys.push(k);
    }
    for (const k of keys) sessionStorage.removeItem(k);
  };
}
