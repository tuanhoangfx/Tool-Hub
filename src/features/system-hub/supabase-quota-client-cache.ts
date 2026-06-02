import { createClientCache } from "@dev/hub-load";
import { dispatchSupabaseQuotaUpdated } from "./supabase-quota-events";
import type { QuotaPayload } from "./supabase-quota-schema";

const cache = createClientCache<QuotaPayload>({
  key: "system:supabase-quota:v1",
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

export function writeSupabaseQuotaClientCache(payload: QuotaPayload) {
  if (!payload.ok) return;
  cache.write(payload);
  dispatchSupabaseQuotaUpdated();
}
