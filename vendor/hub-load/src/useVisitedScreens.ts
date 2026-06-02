import { useEffect, useState } from "react";

/**
 * Keep route/tab screens mounted after first visit (Hub App.tsx pattern).
 */
export function useVisitedScreens<T extends string>(active: T, initial?: Iterable<T>): Set<T> {
  const [visited, setVisited] = useState<Set<T>>(() => {
    const seed = new Set<T>(initial ?? []);
    seed.add(active);
    return seed;
  });

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(active)) return prev;
      return new Set(prev).add(active);
    });
  }, [active]);

  return visited;
}
