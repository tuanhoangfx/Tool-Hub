import { useCallback, useEffect, useRef, useState } from "react";

export type HealthState = "unknown" | "checking" | "online" | "offline";

const TIMEOUT_MS = 2500;
const REFRESH_MS = 30_000;

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
    const results = await pingAll(targets);
    setState((s) => ({ ...s, ...results }));
  }, [urls]);

  useEffect(() => {
    if (stableUrls.current === key) return;
    stableUrls.current = key;
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!key) return;
    const id = window.setInterval(() => void check(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [key, check]);

  return { state, check };
}
