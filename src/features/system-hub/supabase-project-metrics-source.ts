import type { ProjectRow } from "./SystemSupabaseQuotaPanel.types";
import { parseProjectInfra, parseProjectUsage } from "./supabase-quota-metrics";

export type ProjectMetricsSource = "catalog" | "live";

/** Whether usage numbers on this row come from the Management API or catalog-only metadata. */
export function resolveProjectMetricsSource(project: ProjectRow): ProjectMetricsSource {
  if (project.quotaSource === "catalog") return "catalog";

  const usage = parseProjectUsage(project);
  const infra = parseProjectInfra(project);
  const hasLiveMetrics =
    usage.apiRequestsTotal != null ||
    usage.restLatest != null ||
    usage.authLatest != null ||
    usage.realtimeLatest != null ||
    usage.storageLatest != null ||
    infra.diskUsedBytes != null;

  return hasLiveMetrics ? "live" : "catalog";
}

export function metricsSourceTitle(source: ProjectMetricsSource): string {
  if (source === "live") {
    return "Live metrics from Supabase Management API";
  }
  return "Catalog metadata only — API, disk, and health metrics load in background";
}
