/**
 * Fetch JSON and run callback (e.g. write client cache). Swallows errors.
 */
export function prefetchJson(url: string, onData: (json: unknown) => void, init?: RequestInit): void {
  if (typeof window === "undefined") return;
  void fetch(url, { cache: "force-cache", ...init })
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      if (json != null) onData(json);
    })
    .catch(() => {
      /* offline / missing asset */
    });
}
