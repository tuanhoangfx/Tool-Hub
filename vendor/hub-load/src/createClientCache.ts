export type ClientCacheOptions<T> = {
  /** sessionStorage / localStorage key */
  key: string;
  /** Fresh TTL (ms). Stale reads ignore TTL. */
  ttlMs?: number;
  /** Validate parsed payload before accept */
  validate?: (data: unknown) => data is T;
  /** Use localStorage in addition to sessionStorage */
  persistLocal?: boolean;
};

type Entry<T> = {
  at: number;
  data: T;
};

function getStores(persistLocal: boolean): Storage[] {
  if (typeof window === "undefined") return [];
  const stores: Storage[] = [];
  try {
    if (sessionStorage) stores.push(sessionStorage);
  } catch {
    /* private mode */
  }
  if (persistLocal) {
    try {
      if (localStorage) stores.push(localStorage);
    } catch {
      /* blocked */
    }
  }
  return stores;
}

export type ClientCache<T> = {
  readStale: () => T | null;
  readFresh: () => T | null;
  write: (data: T) => void;
  clear: () => void;
};

/** Stale-while-revalidate storage for list/tab payloads. */
export function createClientCache<T>(options: ClientCacheOptions<T>): ClientCache<T> {
  const { key, ttlMs = 3 * 60_000, validate, persistLocal = true } = options;

  function readRaw(): Entry<T> | null {
    for (const store of getStores(persistLocal)) {
      try {
        const raw = store.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as Entry<T>;
        if (validate && !validate(parsed.data)) continue;
        return parsed;
      } catch {
        continue;
      }
    }
    return null;
  }

  return {
    readStale(): T | null {
      return readRaw()?.data ?? null;
    },

    readFresh(): T | null {
      const entry = readRaw();
      if (!entry || Date.now() - entry.at > ttlMs) return null;
      return entry.data;
    },

    write(data: T): void {
      if (typeof window === "undefined") return;
      const entry: Entry<T> = { at: Date.now(), data };
      const raw = JSON.stringify(entry);
      for (const store of getStores(persistLocal)) {
        try {
          store.setItem(key, raw);
        } catch {
          /* quota */
        }
      }
    },

    clear(): void {
      if (typeof window === "undefined") return;
      for (const store of getStores(persistLocal)) {
        try {
          store.removeItem(key);
        } catch {
          /* ignore */
        }
      }
    },
  };
}
