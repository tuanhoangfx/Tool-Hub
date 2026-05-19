import { useCallback, useEffect, useRef, useState } from "react";

export type HealthState = "unknown" | "checking" | "online" | "offline";

const TIMEOUT_MS = 1500;

async function ping(url: string): Promise<HealthState> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    // Use no-cors mode — we don't need the response body, just whether the server replies.
    // The browser will return an "opaque" response (status 0) on success.
    await fetch(url, { mode: "no-cors", signal: controller.signal, cache: "no-store" });
    window.clearTimeout(timer);
    return "online";
  } catch {
    return "offline";
  }
}

export function useLocalHealth(urls: string[]) {
  const [state, setState] = useState<Record<string, HealthState>>({});
  const stableUrls = useRef<string>("");
  const key = urls.filter(Boolean).sort().join("|");

  const check = useCallback(async () => {
    const targets = urls.filter(Boolean);
    if (targets.length === 0) return;
    setState((s) => {
      const next = { ...s };
      for (const u of targets) next[u] = "checking";
      return next;
    });
    const results = await Promise.all(targets.map((url) => ping(url).then((r) => [url, r] as const)));
    setState((s) => {
      const next = { ...s };
      for (const [u, r] of results) next[u] = r;
      return next;
    });
  }, [urls]);

  useEffect(() => {
    if (stableUrls.current === key) return;
    stableUrls.current = key;
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { state, check };
}
