import { readSupabaseQuotaStaleCache } from "../system-hub/supabase-quota-client-cache";
import type { OrgRow, ProjectRow, QuotaPayload } from "../system-hub/supabase-quota-schema";
import { resolveProjectMetricsSource } from "../system-hub/supabase-project-metrics-source";

export type HubQuotaContext = {
  payload: QuotaPayload;
  project: ProjectRow;
  org: OrgRow | null;
};

function toolCodesOnProject(project: ProjectRow): string[] {
  return [...new Set([...(project.tools ?? []), ...(project.catalogTools ?? []), ...(project.workspaceTools ?? [])])];
}

/** Best matching Supabase quota row for a Hub tool code (P0020 → bklxcjrk…). */
export function findQuotaProjectForTool(toolCode: string): ProjectRow | null {
  const payload = readSupabaseQuotaStaleCache();
  if (!payload?.projects?.length) return null;
  const want = toolCode.trim().toUpperCase();
  if (!want) return null;

  const matches = payload.projects.filter((p) =>
    toolCodesOnProject(p).some((c) => c.toUpperCase() === want),
  );
  if (!matches.length) return null;

  const live = matches.find((p) => resolveProjectMetricsSource(p) === "live");
  return live ?? matches[0] ?? null;
}

export function findQuotaOrgForProject(
  project: Pick<ProjectRow, "orgSlug">,
  payload = readSupabaseQuotaStaleCache(),
): OrgRow | null {
  if (!payload?.organizations?.length) return null;
  return payload.organizations.find((o) => o.slug === project.orgSlug) ?? null;
}

export function findQuotaContextForTool(toolCode: string): HubQuotaContext | null {
  const payload = readSupabaseQuotaStaleCache();
  if (!payload) return null;
  const project = findQuotaProjectForTool(toolCode);
  if (!project) return null;
  return { payload, project, org: findQuotaOrgForProject(project, payload) };
}
