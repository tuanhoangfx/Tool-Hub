const PINNED_KEY = "dash:pinned";

let legacyPinsMigrated = false;

/** One-time merge from sessionStorage pins (pre-localStorage builds). */
function migrateLegacyPins(): void {
  if (typeof window === "undefined" || legacyPinsMigrated) return;
  legacyPinsMigrated = true;
  try {
    const legacy = sessionStorage.getItem(PINNED_KEY);
    if (!legacy) return;
    const parsed = JSON.parse(legacy) as unknown;
    const legacyIds = Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
    if (legacyIds.length > 0) {
      const merged = new Set(readRawWithoutMigrate());
      for (const id of legacyIds) merged.add(id);
      localStorage.setItem(PINNED_KEY, JSON.stringify([...merged]));
    }
    sessionStorage.removeItem(PINNED_KEY);
  } catch {
    /* ignore corrupt legacy payload */
  }
}

function readRawWithoutMigrate(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function readRaw(): string[] {
  migrateLegacyPins();
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeRaw(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
}

export function readPinnedScreenIds(): Set<string> {
  return new Set(readRaw());
}

export function togglePinnedScreenId(id: string): Set<string> {
  const next = new Set(readRaw());
  if (next.has(id)) next.delete(id);
  else next.add(id);
  writeRaw([...next]);
  return next;
}

export function pinScreenIds(ids: Iterable<string>): Set<string> {
  const next = new Set(readRaw());
  for (const id of ids) next.add(id);
  writeRaw([...next]);
  return next;
}
