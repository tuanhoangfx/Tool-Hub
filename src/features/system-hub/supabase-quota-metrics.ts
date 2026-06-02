import type { ProjectRow } from "./SystemSupabaseQuotaPanel.types";

export type EntitlementItem = {
  feature?: { key?: string };
  hasAccess?: boolean;
  config?: unknown;
};

export type ProjectUsageMetrics = {
  apiRequestsTotal: number | null;
  restLatest: number | null;
  authLatest: number | null;
  realtimeLatest: number | null;
  storageLatest: number | null;
  usageWindow: string | null;
};

export type ProjectInfraMetrics = {
  diskUsedBytes: number | null;
  diskAvailBytes: number | null;
  diskSizeGb: number | null;
};

export type HealthServiceRow = {
  name: string;
  healthy: boolean;
  status: string;
  error?: string | null;
};

export type ProjectRestrictionInfo = {
  restricted: boolean;
  violations: string[];
  summary: string | null;
  overallStatus: "healthy" | "restricted" | "unhealthy" | "unknown";
};

export type OrgQuotaRow = {
  slug: string;
  plan: string | null;
  maxFileBytes: number | null;
  logDays: number | null;
  fnMax: number | null;
  rtUsers: number | null;
};

export type QuotaMinMax = {
  maxFileBytes: { min: number | null; max: number | null };
  logDays: { min: number | null; max: number | null };
  fnMax: { min: number | null; max: number | null };
  rtUsers: { min: number | null; max: number | null };
};

export function entitlementsList(entitlements: unknown): EntitlementItem[] {
  if (Array.isArray(entitlements)) return entitlements as EntitlementItem[];
  if (!entitlements || typeof entitlements !== "object") return [];
  const e = entitlements as Record<string, unknown>;
  const list = e.entitlements;
  return Array.isArray(list) ? (list as EntitlementItem[]) : [];
}

export function entitlementNumeric(entitlements: unknown, featureKey: string): number | null {
  const items = entitlementsList(entitlements);
  const found = items.find((it) => it?.feature?.key === featureKey);
  if (!found) return null;
  const top = found as EntitlementItem & { value?: number };
  if (typeof top.value === "number") return top.value;
  if (!found.config || typeof found.config !== "object") return null;
  const cfg = found.config as Record<string, unknown>;
  if (typeof cfg.value === "number") return cfg.value;
  return null;
}

export function toMb(bytes: number) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

export function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** One line: total + latest REST/Auth/RT per minute. */
export function formatApiUsageInline(usage: ProjectUsageMetrics): string | null {
  const total =
    usage.apiRequestsTotal != null ? `${formatCompact(usage.apiRequestsTotal)} total` : null;
  const rates: string[] = [];
  if (usage.restLatest != null) rates.push(`REST ${formatCompact(usage.restLatest)}`);
  if (usage.authLatest != null) rates.push(`Auth ${formatCompact(usage.authLatest)}`);
  if (usage.realtimeLatest != null) rates.push(`RT ${formatCompact(usage.realtimeLatest)}`);
  const ratePart = rates.length > 0 ? `${rates.join(" · ")} /min` : null;
  if (total && ratePart) return `${total} · ${ratePart}`;
  if (total) return total;
  if (ratePart) return ratePart;
  return null;
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${bytes} B`;
}

function minMax(vals: number[]): { min: number | null; max: number | null } {
  if (vals.length === 0) return { min: null, max: null };
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

export function formatMinMax(
  range: { min: number | null; max: number | null },
  fmt: (n: number) => string,
): string {
  const { min, max } = range;
  if (min == null) return "—";
  if (max == null || min === max) return fmt(min);
  return `${fmt(min)} – ${fmt(max)}`;
}

export function orgQuotaRows(
  organizations: Array<{ slug: string; plan?: string | null; entitlements?: unknown }>,
): OrgQuotaRow[] {
  return organizations.map((o) => ({
    slug: o.slug,
    plan: o.plan ?? null,
    maxFileBytes: entitlementNumeric(o.entitlements, "storage.max_file_size"),
    logDays: entitlementNumeric(o.entitlements, "log.retention_days"),
    fnMax: entitlementNumeric(o.entitlements, "function.max_count"),
    rtUsers: entitlementNumeric(o.entitlements, "realtime.max_concurrent_users"),
  }));
}

export function quotaMinMaxAcrossOrgs(
  organizations: Array<{ slug: string; plan?: string | null; entitlements?: unknown }>,
): QuotaMinMax {
  const rows = orgQuotaRows(organizations);
  return {
    maxFileBytes: minMax(rows.map((r) => r.maxFileBytes).filter((v): v is number => v != null)),
    logDays: minMax(rows.map((r) => r.logDays).filter((v): v is number => v != null)),
    fnMax: minMax(rows.map((r) => r.fnMax).filter((v): v is number => v != null)),
    rtUsers: minMax(rows.map((r) => r.rtUsers).filter((v): v is number => v != null)),
  };
}

type ApiCountBucket = {
  timestamp?: string;
  total_auth_requests?: number;
  total_realtime_requests?: number;
  total_rest_requests?: number;
  total_storage_requests?: number;
};

function seriesFrom(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.error) return null;
  if (Array.isArray(o.result)) return o.result;
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.items)) return o.items;
  return null;
}

function latestApiCountBucket(raw: unknown): ApiCountBucket | null {
  const series = seriesFrom(raw);
  if (!series?.length) return null;
  return series[series.length - 1] as ApiCountBucket;
}

function apiRequestsTotal(raw: unknown): number | null {
  const series = seriesFrom(raw);
  if (!series?.length) return null;
  const row = series[0] as { count?: number; total?: number; value?: number };
  if (typeof row.count === "number") return row.count;
  if (typeof row.total === "number") return row.total;
  if (typeof row.value === "number") return row.value;
  return null;
}

export function parseProjectUsage(project: Pick<ProjectRow, "usage">): ProjectUsageMetrics {
  const apiCounts = latestApiCountBucket(project.usage?.apiCounts);
  const total = apiRequestsTotal(project.usage?.apiRequestsCount);
  return {
    apiRequestsTotal: total,
    restLatest: apiCounts?.total_rest_requests ?? null,
    authLatest: apiCounts?.total_auth_requests ?? null,
    realtimeLatest: apiCounts?.total_realtime_requests ?? null,
    storageLatest: apiCounts?.total_storage_requests ?? null,
    usageWindow: apiCounts?.timestamp ?? null,
  };
}

export function parseProjectInfra(project: Pick<ProjectRow, "usage">): ProjectInfraMetrics {
  const diskUtil = project.usage?.diskUtil;
  let diskUsedBytes: number | null = null;
  let diskAvailBytes: number | null = null;
  const diskSizeGb: number | null = null;

  if (diskUtil && typeof diskUtil === "object" && !("error" in diskUtil)) {
    const metrics = (diskUtil as { metrics?: Record<string, unknown> }).metrics;
    if (metrics && typeof metrics === "object") {
      if (typeof metrics.fs_used_bytes === "number") diskUsedBytes = metrics.fs_used_bytes;
      if (typeof metrics.fs_avail_bytes === "number") diskAvailBytes = metrics.fs_avail_bytes;
    }
  }

  return { diskUsedBytes, diskAvailBytes, diskSizeGb };
}

export function parseViolationsFromHealthError(error: string | undefined | null): string[] {
  if (!error) return [];
  let message = error;
  try {
    const parsed = JSON.parse(error) as { message?: string };
    if (parsed.message) message = parsed.message;
  } catch {
    /* raw string */
  }
  const match = message.match(/violations:\s*([^.]+)/i);
  if (match) {
    return match[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (/restricted|exceed.*quota|usage limit/i.test(message)) return ["restricted"];
  return [];
}

export function parseHealthServices(project: Pick<ProjectRow, "usage">): HealthServiceRow[] {
  const raw = project.usage?.health;
  if (!raw || typeof raw !== "object" || "error" in raw) return [];
  const list = Array.isArray(raw) ? raw : seriesFrom(raw);
  if (!list?.length) return [];
  const out: HealthServiceRow[] = [];
  for (const row of list) {
    const r = row as { name?: string; healthy?: boolean; status?: string; error?: string };
    if (!r.name) continue;
    out.push({
      name: r.name,
      healthy: Boolean(r.healthy),
      status: r.status ?? (r.healthy ? "HEALTHY" : "UNHEALTHY"),
      error: r.error ?? null,
    });
  }
  return out;
}

export function parseProjectRestriction(project: Pick<ProjectRow, "usage" | "error">): ProjectRestrictionInfo {
  const services = parseHealthServices(project);
  const violations = new Set<string>();

  for (const svc of services) {
    for (const v of parseViolationsFromHealthError(svc.error)) violations.add(v);
    if (svc.error && /restricted|exceed.*quota|usage limit/i.test(svc.error)) {
      violations.add("restricted");
    }
  }

  const violationList = [...violations];
  const restricted = violationList.some((v) => v.includes("exceed") || v.includes("quota") || v === "restricted");

  let overallStatus: ProjectRestrictionInfo["overallStatus"] = "unknown";
  if (restricted) overallStatus = "restricted";
  else if (services.length === 0) overallStatus = project.error ? "unhealthy" : "unknown";
  else if (services.every((s) => s.healthy)) overallStatus = "healthy";
  else overallStatus = "unhealthy";

  const summary = restricted
    ? `Services restricted · ${violationList.join(", ")}`
    : services.some((s) => !s.healthy)
      ? "One or more services unhealthy"
      : null;

  return { restricted, violations: violationList, summary, overallStatus };
}

/** Primary violation code for tooltips (e.g. exceed_egress_quota). */
export function restrictionPrimaryViolation(project: Pick<ProjectRow, "usage" | "error">): string | null {
  const { restricted, violations } = parseProjectRestriction(project);
  if (!restricted) return null;
  return violations.find((v) => v.includes("egress")) ?? violations[0] ?? "restricted";
}

export function resolveProjectHealthLabel(project: Pick<ProjectRow, "usage" | "error">): string {
  if (project.error) return "Error";
  const restriction = parseProjectRestriction(project);
  if (restriction.restricted) return "Restricted";
  if (restriction.overallStatus === "unhealthy") return "Unhealthy";
  const usage = parseProjectUsage(project);
  if (usage.apiRequestsTotal != null) return "Live";
  if (restriction.overallStatus === "healthy") return "Healthy";
  return "Unknown";
}

export function orgEntitlementSummary(entitlements: unknown) {
  return {
    maxFileBytes: entitlementNumeric(entitlements, "storage.max_file_size"),
    logDays: entitlementNumeric(entitlements, "log.retention_days"),
    fnMax: entitlementNumeric(entitlements, "function.max_count"),
    rtUsers: entitlementNumeric(entitlements, "realtime.max_concurrent_users"),
    dbSizeBytes: entitlementNumeric(entitlements, "database.size"),
    bandwidthBytes: entitlementNumeric(entitlements, "bandwidth.egress"),
  };
}

export type PlanDisplay = {
  orgPlan: string | null;
  projectPlan: string | null;
  metaLine: string;
  showRow: boolean;
};

export function resolvePlanDisplay(
  project: Pick<ProjectRow, "plan" | "orgPlan">,
  org?: { plan?: string | null } | null,
): PlanDisplay {
  const orgPlan = (project.orgPlan ?? org?.plan ?? "").trim() || null;
  const projectPlan = (project.plan ?? "").trim() || null;

  if (!orgPlan && !projectPlan) {
    return { orgPlan: null, projectPlan: null, metaLine: "", showRow: false };
  }

  if (orgPlan && projectPlan && orgPlan.toLowerCase() === projectPlan.toLowerCase()) {
    return { orgPlan, projectPlan, metaLine: `${projectPlan} (org & project)`, showRow: true };
  }
  if (orgPlan && !projectPlan) {
    return { orgPlan, projectPlan: null, metaLine: `${orgPlan} (org)`, showRow: true };
  }
  if (!orgPlan && projectPlan) {
    return { orgPlan: null, projectPlan, metaLine: `${projectPlan} (project)`, showRow: true };
  }
  return {
    orgPlan,
    projectPlan,
    metaLine: `${projectPlan} (project) · ${orgPlan} (org)`,
    showRow: true,
  };
}

/** Plan label for filters/charts — prefers org billing plan, then project tier. */
export function effectivePlanLabel(
  project: Pick<ProjectRow, "plan" | "orgPlan">,
  org?: { plan?: string | null } | null,
): string {
  const { orgPlan, projectPlan } = resolvePlanDisplay(project, org);
  return projectPlan ?? orgPlan ?? "—";
}

export function sumFilteredUsage(projects: ProjectRow[]): {
  apiRequestsTotal: number;
  restLatest: number;
  authLatest: number;
  realtimeLatest: number;
} {
  let apiRequestsTotal = 0;
  let restLatest = 0;
  let authLatest = 0;
  let realtimeLatest = 0;
  for (const p of projects) {
    const m = parseProjectUsage(p);
    if (m.apiRequestsTotal != null) apiRequestsTotal += m.apiRequestsTotal;
    if (m.restLatest != null) restLatest += m.restLatest;
    if (m.authLatest != null) authLatest += m.authLatest;
    if (m.realtimeLatest != null) realtimeLatest += m.realtimeLatest;
  }
  return { apiRequestsTotal, restLatest, authLatest, realtimeLatest };
}
