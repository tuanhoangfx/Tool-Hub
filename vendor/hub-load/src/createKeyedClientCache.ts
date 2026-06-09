import { createClientCache, type ClientCache, type ClientCacheOptions } from "./createClientCache";

export type KeyedClientCacheOptions<T> = Omit<ClientCacheOptions<T>, "key"> & {
  keyPrefix: string;
  maxEntries?: number;
};

export type KeyedClientCache<T> = {
  readStale: (id: string) => T | null;
  readFresh: (id: string) => T | null;
  write: (id: string, data: T) => void;
  remove: (id: string) => void;
  clear: () => void;
};

/** Per-id sessionStorage cache with LRU eviction — P0020 note detail / route-lock pattern. */
export function createKeyedClientCache<T>(options: KeyedClientCacheOptions<T>): KeyedClientCache<T> {
  const { keyPrefix, maxEntries = 48, ...cacheOpts } = options;
  const caches = new Map<string, ClientCache<T>>();
  const accessOrder: string[] = [];

  function touch(id: string) {
    const idx = accessOrder.indexOf(id);
    if (idx >= 0) accessOrder.splice(idx, 1);
    accessOrder.push(id);
    while (accessOrder.length > maxEntries) {
      const evict = accessOrder.shift();
      if (!evict) break;
      caches.get(evict)?.clear();
      caches.delete(evict);
    }
  }

  function cacheFor(id: string): ClientCache<T> {
    let cache = caches.get(id);
    if (!cache) {
      cache = createClientCache<T>({ ...cacheOpts, key: `${keyPrefix}:${id}` });
      caches.set(id, cache);
    }
    return cache;
  }

  return {
    readStale(id: string) {
      if (!id) return null;
      const data = cacheFor(id).readStale();
      if (data != null) touch(id);
      return data;
    },

    readFresh(id: string) {
      if (!id) return null;
      const data = cacheFor(id).readFresh();
      if (data != null) touch(id);
      return data;
    },

    write(id: string, data: T) {
      if (!id) return;
      cacheFor(id).write(data);
      touch(id);
    },

    remove(id: string) {
      if (!id) return;
      caches.get(id)?.clear();
      caches.delete(id);
      const idx = accessOrder.indexOf(id);
      if (idx >= 0) accessOrder.splice(idx, 1);
    },

    clear() {
      for (const cache of caches.values()) cache.clear();
      caches.clear();
      accessOrder.length = 0;
    },
  };
}
