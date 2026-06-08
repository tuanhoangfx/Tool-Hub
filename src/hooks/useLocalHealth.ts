import { useCallback, useEffect, useRef, useState } from "react";

export type HealthState = "unknown" | "checking" | "online" | "offline";

const TIMEOUT_MS = 2500;

async function pingViaProxy(urls: string[]): Promise<Record<string, HealthState>> {
  const q = encodeURIComponent(urls.join(","));
  const res = await fetch(`/api/local-health?urls=${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error("proxy-failed");
  const data = (await res.json()) as { results?: Record<string, string> };
  const out: Record<string, HealthState> = {};
  for (const url of urls) {
    const r = data.results?.[url];
    out[url] = r === "online" ? "online" : "offline";
  }
  return out;
}

async function pingDirect(url: string): Promise<HealthState> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    await fetch(url, { mode: "no-cors", signal: controller.signal, cache: "no-store" });
    window.clearTimeout(timer);
    return "online";
  } catch {
    return "offline";
  }
}

async function pingAll(urls: string[]): Promise<Record<string, HealthState>> {
  try {
    return await pingViaProxy(urls);
  } catch {
    const entries = await Promise.all(urls.map((url) => pingDirect(url).then((r) => [url, r] as const)));
    return Object.fromEntries(entries);
  }
}

export function useLocalHealth(urls: string[], pollIntervalMs: number | null) {
  const [state, setState] = useState<Record<string, HealthState>>({});
  const stableUrls = useRef<string>("");
  const key = urls.filter(Boolean).sort().join("|");

  const check = useCallback(async (opts?: { silent?: boolean }) => {
    const targets = urls.filter(Boolean);
    if (targets.length === 0) return;
    if (!opts?.silent) {
      setState((s) => {
        const next = { ...s };
        for (const u of targets) next[u] = "checking";
        return next;
      });
    }
    const t0 = performance.now();
    const results = await pingAll(targets);
    if (import.meta.env.DEV) {
      const ms = Math.round(performance.now() - t0);
      const online = Object.values(results).filter((s) => s === "online").length;
      console.debug(`[local-health] ${targets.length} urls · ${ms}ms · ${online} online`);
    }
    setState((s) => ({ ...s, ...results }));
  }, [urls]);

  useEffect(() => {
    if (stableUrls.current === key) return;
    stableUrls.current = key;
    if (pollIntervalMs !== null) void check({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pollIntervalMs]);

  useEffect(() => {
    if (!key || pollIntervalMs === null) return;
    const id = window.setInterval(() => void check({ silent: true }), pollIntervalMs);
    return () => window.clearInterval(id);
  }, [key, check, pollIntervalMs]);

  return { state, check };
}
