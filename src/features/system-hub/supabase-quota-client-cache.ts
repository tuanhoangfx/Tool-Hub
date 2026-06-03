import { createClientCache } from "@dev/hub-load";
import { dispatchSupabaseQuotaUpdated } from "./supabase-quota-events";
import type { QuotaPayload } from "./supabase-quota-schema";

const cache = createClientCache<QuotaPayload>({
  // v2: catalog prune 18→14 projects (2026-06-03) — bump invalidates stale localStorage payloads
  key: "system:supabase-quota:v2",
  ttlMs: 15 * 60_000,
  validate: (data): data is QuotaPayload =>
    typeof data === "object" && data !== null && (data as QuotaPayload).ok === true,
});

/** Stale snapshot for instant paint (ignores TTL). */
export function readSupabaseQuotaStaleCache(): QuotaPayload | null {
  return cache.readStale();
}

/** Fresh cache within TTL. */
export function readSupabaseQuotaClientCache(): QuotaPayload | null {
  return cache.readFresh();
}

let quotaDispatchTimer: number | null = null;

export function writeSupabaseQuotaClientCache(payload: QuotaPayload) {
  if (!payload.ok) return;
  cache.write(payload);
  if (quotaDispatchTimer) window.clearTimeout(quotaDispatchTimer);
  quotaDispatchTimer = window.setTimeout(() => {
    quotaDispatchTimer = null;
    dispatchSupabaseQuotaUpdated();
  }, 300);
}
