import type { ProjectRow, QuotaPayload } from "./supabase-quota-schema";

/** Merge priority / partial project rows into a full quota payload. */
export function mergeQuotaProjectPatches(prev: QuotaPayload, patches: ProjectRow[]): QuotaPayload {
  if (!patches.length) return prev;
  const byRef = new Map(patches.map((p) => [p.projectRef, p]));
  const projects = (prev.projects ?? []).map((p) => {
    const patch = byRef.get(p.projectRef);
    if (!patch) return p;
    return { ...p, ...patch };
  });
  return { ...prev, projects };
}
