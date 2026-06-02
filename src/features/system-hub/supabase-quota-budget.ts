import type { OrgRow, ProjectRow } from "./supabase-quota-schema";
import {
  formatApiUsageInline,
  formatBytes,
  orgEntitlementSummary,
  parseProjectInfra,
  parseProjectRestriction,
  parseProjectUsage,
  type ProjectRestrictionInfo,
} from "./supabase-quota-metrics";

export type QuotaBudgetStatus = "ok" | "warn" | "critical" | "restricted" | "unknown";

export type QuotaBudgetLine = {
  key: string;
  label: string;
  used: number | null;
  limit: number | null;
  percent: number | null;
  usedLabel: string;
  limitLabel: string;
  status: QuotaBudgetStatus;
  hint?: string;
};

export type QuotaHeadlineStatus = {
  status: QuotaBudgetStatus;
  label: string;
  title: string;
};

const WARN_PCT = 80;
const CRITICAL_PCT = 95;

export function percentUsed(used: number, limit: number): number {
  if (limit <= 0) return 100;
  return Math.min(100, Math.round((used / limit) * 1000) / 10);
}

export function statusFromPercent(percent: number | null, restricted: boolean): QuotaBudgetStatus {
  if (restricted) return "restricted";
  if (percent == null) return "unknown";
  if (percent >= CRITICAL_PCT) return "critical";
  if (percent >= WARN_PCT) return "warn";
  return "ok";
}

export function computeQuotaBudget(
  project: Pick<ProjectRow, "usage" | "error">,
  org: Pick<OrgRow, "entitlements"> | null | undefined,
  restrictionOverride?: ProjectRestrictionInfo,
): QuotaBudgetLine[] {
  const restriction = restrictionOverride ?? parseProjectRestriction(project);
  const usage = parseProjectUsage(project);
  const infra = parseProjectInfra(project);
  const quota = org ? orgEntitlementSummary(org.entitlements) : null;
  const lines: QuotaBudgetLine[] = [];

  let dbLimit: number | null = quota?.dbSizeBytes ?? null;
  if (dbLimit == null && infra.diskUsedBytes != null && infra.diskAvailBytes != null) {
    dbLimit = infra.diskUsedBytes + infra.diskAvailBytes;
  }

  if (infra.diskUsedBytes != null || dbLimit != null) {
    const used = infra.diskUsedBytes;
    const limit = dbLimit;
    const pct = used != null && limit != null ? percentUsed(used, limit) : null;
    lines.push({
      key: "db_disk",
      label: "DB disk",
      used,
      limit,
      percent: pct,
      usedLabel: used == null ? "—" : formatBytes(used),
      limitLabel: limit == null ? "—" : formatBytes(limit),
      status: statusFromPercent(pct, restriction.restricted),
    });
  }

  if (quota?.bandwidthBytes != null) {
    lines.push({
      key: "egress",
      label: "Egress (org limit)",
      used: null,
      limit: quota.bandwidthBytes,
      percent: null,
      usedLabel: "—",
      limitLabel: formatBytes(quota.bandwidthBytes),
      status: restriction.restricted ? "restricted" : "unknown",
      hint: "Monthly egress used (GB) is on Supabase Dashboard → Usage",
    });
  }

  const apiInline = formatApiUsageInline(usage);
  if (apiInline) {
    lines.push({
      key: "api_total",
      label: "API",
      used: usage.apiRequestsTotal,
      limit: null,
      percent: null,
      usedLabel: apiInline,
      limitLabel: "—",
      status: restriction.restricted ? "restricted" : "ok",
      hint: "No monthly cap exposed via Management API",
    });
  }

  if (quota?.maxFileBytes != null) {
    lines.push({
      key: "max_file",
      label: "Max upload file",
      used: null,
      limit: quota.maxFileBytes,
      percent: null,
      usedLabel: "—",
      limitLabel: formatBytes(quota.maxFileBytes),
      status: "ok",
    });
  }

  return lines;
}

export function resolveQuotaHeadlineStatus(
  project: Pick<ProjectRow, "usage" | "error">,
  org: Pick<OrgRow, "entitlements"> | null | undefined,
): QuotaHeadlineStatus {
  const restriction = parseProjectRestriction(project);
  if (restriction.restricted) {
    return {
      status: "restricted",
      label: "Restricted",
      title: restriction.summary ?? "Supabase restricted this project (quota exceeded)",
    };
  }

  const lines = computeQuotaBudget(project, org);
  const db = lines.find((l) => l.key === "db_disk");
  if (db?.percent != null) {
    if (db.status === "critical") {
      return {
        status: "critical",
        label: `DB ${db.percent}%`,
        title: `Database disk ${db.usedLabel} of ${db.limitLabel} (${db.percent}%)`,
      };
    }
    if (db.status === "warn") {
      return {
        status: "warn",
        label: `DB ${db.percent}%`,
        title: `Database disk nearing limit — ${db.usedLabel} / ${db.limitLabel}`,
      };
    }
  }

  const hasLive = lines.some((l) => l.used != null);
  if (hasLive) {
    return { status: "ok", label: "Quota OK", title: "Live usage within known limits" };
  }

  return { status: "unknown", label: "Quota", title: "Refresh Supabase Quota for limits" };
}

/** Compact "274 MB / 500 MB (55%)" — no progress bar. */
export function formatQuotaLineInline(line: QuotaBudgetLine): string {
  if (line.used != null && line.limit != null) {
    const pct = line.percent != null ? ` (${line.percent}%)` : "";
    return `${line.usedLabel} / ${line.limitLabel}${pct}`;
  }
  if (line.used != null) return line.usedLabel;
  if (line.limit != null) return `limit ${line.limitLabel}`;
  return "—";
}

export function barToneClass(status: QuotaBudgetStatus): string {
  switch (status) {
    case "restricted":
    case "critical":
      return "bg-rose-500";
    case "warn":
      return "bg-amber-400";
    case "ok":
      return "bg-emerald-500";
    default:
      return "bg-white/20";
  }
}
