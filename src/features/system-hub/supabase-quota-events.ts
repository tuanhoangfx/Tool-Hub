/** Sidebar Refresh → force Supabase Quota reload (dev API). */
export const SUPABASE_QUOTA_REFRESH_EVENT = "tool-hub:supabase-quota-refresh";

/** Quota client cache was updated — Hub cards may re-read metrics. */
export const SUPABASE_QUOTA_UPDATED_EVENT = "tool-hub:supabase-quota-updated";

export function dispatchSupabaseQuotaRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SUPABASE_QUOTA_REFRESH_EVENT));
}

export function dispatchSupabaseQuotaUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SUPABASE_QUOTA_UPDATED_EVENT));
}
