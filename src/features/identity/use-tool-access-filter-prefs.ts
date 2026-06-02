import { useEffect, useState } from "react";
import type { FilterValues } from "../../components/sales-shell";

const STORAGE_PREFIX = "tool-hub:user-access-filters:";

export type ToolAccessFilterPrefs = {
  query: string;
  values: FilterValues;
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function useToolAccessFilterPrefs(userId: string | null) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      setQuery("");
      setFilterValues({});
      setReady(false);
      return;
    }
    setReady(false);
    try {
      const raw = window.localStorage.getItem(storageKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as ToolAccessFilterPrefs;
        if (typeof parsed.query === "string" && parsed.values && typeof parsed.values === "object") {
          setQuery(parsed.query);
          setFilterValues(parsed.values);
          setReady(true);
          return;
        }
      }
    } catch {
      // ignore
    }
    setQuery("");
    setFilterValues({});
    setReady(true);
  }, [userId]);

  useEffect(() => {
    if (!userId || !ready) return;
    try {
      window.localStorage.setItem(storageKey(userId), JSON.stringify({ query, values: filterValues }));
    } catch {
      // quota / private mode
    }
  }, [userId, query, filterValues, ready]);

  return { query, setQuery, filterValues, setFilterValues };
}
