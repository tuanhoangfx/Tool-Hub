import { useEffect, useState } from "react";
import type { FilterValues } from "../../components/sales-shell";

const STORAGE_PREFIX = "tool-hub:link-filters:";

export type LinkFilterPrefs = {
  query: string;
  values: FilterValues;
};

function storageKey(toolCode: string): string {
  return `${STORAGE_PREFIX}${toolCode}`;
}

export function loadLinkFilterPrefs(toolCode: string): LinkFilterPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(toolCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LinkFilterPrefs;
    if (typeof parsed.query !== "string" || typeof parsed.values !== "object" || parsed.values === null) {
      return null;
    }
    return { query: parsed.query, values: parsed.values };
  } catch {
    return null;
  }
}

export function saveLinkFilterPrefs(toolCode: string, prefs: LinkFilterPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(toolCode), JSON.stringify(prefs));
  } catch {
    // quota / private mode
  }
}

/** Persist search + filter dropdowns per tool (localStorage). */
export function useLinkFilterPrefs(toolCode: string) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const stored = loadLinkFilterPrefs(toolCode);
    setQuery(stored?.query ?? "");
    setFilterValues(stored?.values ?? {});
    setReady(true);
  }, [toolCode]);

  useEffect(() => {
    if (!ready) return;
    saveLinkFilterPrefs(toolCode, { query, values: filterValues });
  }, [toolCode, query, filterValues, ready]);

  return { query, setQuery, filterValues, setFilterValues };
}
