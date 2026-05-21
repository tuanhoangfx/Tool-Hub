const CACHE_PREFIX = "ghtm.cache.v1:";
const DEFAULT_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
  ts: number;
  value: T;
};

function read<T>(key: string, ttlMs: number): T | undefined {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts > ttlMs) return undefined;
    return entry.value;
  } catch {
    return undefined;
  }
}

function write<T>(key: string, value: T) {
  try {
    const entry: CacheEntry<T> = { ts: Date.now(), value };
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // sessionStorage may be full or unavailable — ignore
  }
}

export async function memoFetch<T>(
  key: string,
  fetcher: () => Promise<T | undefined>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T | undefined> {
  const cached = read<T>(key, ttlMs);
  if (cached !== undefined) return cached;
  const fresh = await fetcher();
  if (fresh !== undefined) write(key, fresh);
  return fresh;
}

export function clearCache() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
}
