import { useEffect, useState } from "react";
import type { FilterValues } from "../../components/sales-shell";

const STORAGE_PREFIX = "tool-hub:version-filters:";

export type VersionFilterPrefs = {
  query: string;
  values: FilterValues;
};

function storageKey(toolCode: string): string {
  return `${STORAGE_PREFIX}${toolCode}`;
}

export function loadVersionFilterPrefs(toolCode: string): VersionFilterPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(toolCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VersionFilterPrefs;
    if (typeof parsed.query !== "string" || typeof parsed.values !== "object" || parsed.values === null) {
      return null;
    }
    return { query: parsed.query, values: parsed.values };
  } catch {
    return null;
  }
}

export function saveVersionFilterPrefs(toolCode: string, prefs: VersionFilterPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(toolCode), JSON.stringify(prefs));
  } catch {
    // quota / private mode
  }
}

export function useVersionFilterPrefs(toolCode: string) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const stored = loadVersionFilterPrefs(toolCode);
    setQuery(stored?.query ?? "");
    setFilterValues(stored?.values ?? {});
    setReady(true);
  }, [toolCode]);

  useEffect(() => {
    if (!ready) return;
    saveVersionFilterPrefs(toolCode, { query, values: filterValues });
  }, [toolCode, query, filterValues, ready]);

  return { query, setQuery, filterValues, setFilterValues };
}
