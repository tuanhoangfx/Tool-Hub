import type { OrgRow, ProjectRow, QuotaPayload } from "./supabase-quota-schema";

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

/** Merge org entitlement patches (priority fetch). */
export function mergeQuotaOrgPatches(prev: QuotaPayload, patches: OrgRow[]): QuotaPayload {
  if (!patches.length) return prev;
  const bySlug = new Map(patches.map((o) => [o.slug, o]));
  const organizations = (prev.organizations ?? []).map((o) => {
    const patch = bySlug.get(o.slug);
    if (!patch) return o;
    return { ...o, ...patch, entitlements: patch.entitlements ?? o.entitlements };
  });
  for (const patch of patches) {
    if (!organizations.some((o) => o.slug === patch.slug)) organizations.push(patch);
  }
  return { ...prev, organizations };
}

export function mergeQuotaPayloadPatches(
  prev: QuotaPayload,
  partial: Pick<QuotaPayload, "projects" | "organizations">,
): QuotaPayload {
  let next = prev;
  if (partial.projects?.length) next = mergeQuotaProjectPatches(next, partial.projects);
  if (partial.organizations?.length) next = mergeQuotaOrgPatches(next, partial.organizations);
  return next;
}
