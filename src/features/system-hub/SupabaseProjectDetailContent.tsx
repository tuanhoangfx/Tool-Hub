import { CheckCircle2, ExternalLink, Layers } from "lucide-react";
import {
  HubToolDetailSection,
  compactIconSize,
} from "@tool-workspace/hub-ui";
import { MetricBadge } from "../../components/sales-shell";
import { resolveHealthStatusIcon } from "../../lib/badge-registry";

import { QuietChip } from "../hub/hub-tool-ui";
import { SupabaseMetricsSourceBadge } from "./SupabaseMetricsSourceBadge";
import { resolveProjectMetricsSource } from "./supabase-project-metrics-source";
import type { OrgRow, ProjectRow } from "./SystemSupabaseQuotaPanel.types";
import { QuotaBudgetBlock } from "./QuotaUsageBar";
import { supabaseSectionTitle } from "./supabase-detail-toc";
import { computeQuotaBudget, formatQuotaLineInline } from "./supabase-quota-budget";
import {
  formatApiUsageInline,
  formatBytes,
  orgEntitlementSummary,
  parseHealthServices,
  parseProjectInfra,
  parseProjectRestriction,
  parseProjectUsage,
  parseViolationsFromHealthError,
  resolvePlanDisplay,
  resolveProjectHealthLabel,
  restrictionPrimaryViolation,
  toMb,
} from "./supabase-quota-metrics";
import { RegionInline } from "../../components/RegionFlagBadge";

export type SupabaseProjectDetailContentProps = {
  project: ProjectRow;
  org: OrgRow | null;
  tools?: string[];
  idPrefix?: string;
};

function MetricRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/5 bg-white/[.02] px-2.5 py-1.5 text-[12px]">
      <span className="font-mono text-[var(--muted)]">{label}</span>
      <MetricBadge label={value} tone={good ? "ok" : "neutral"} />
    </div>
  );
}

export function SupabaseProjectDetailContent({
  project,
  org,
  tools = [],
  idPrefix = "",
}: SupabaseProjectDetailContentProps) {
  const sid = (id: string) => `${idPrefix}${id}`;
  const usage = parseProjectUsage(project);
  const infra = parseProjectInfra(project);
  const health = parseHealthServices(project);
  const restriction = parseProjectRestriction(project);
  const metricsSource = resolveProjectMetricsSource(project);
  const quota = org ? orgEntitlementSummary(org.entitlements) : null;
  const budgetLines = metricsSource === "live" ? computeQuotaBudget(project, org) : [];
  const dbBudget = budgetLines.find((l) => l.key === "db_disk");
  const plans = resolvePlanDisplay(project, org);
  const dashboardUrl = `https://supabase.com/dashboard/project/${encodeURIComponent(project.projectRef)}`;
  const hasError = Boolean(project.error);
  const healthLabel = resolveProjectHealthLabel(project);
  const healthTone = restriction.restricted || hasError ? "bad" : healthLabel === "Live" || healthLabel === "Healthy" ? "ok" : "warn";

  const aboutIntro =
    metricsSource === "live"
      ? `${project.projectName} on Supabase (${project.region ?? "unknown region"}). Organization ${project.orgSlug}. Metrics below are from the Management API.`
      : `${project.projectName} on Supabase (${project.region ?? "unknown region"}). Organization ${project.orgSlug}. Showing catalog metadata — live metrics load in background.`;

  return (
    <>
      <HubToolDetailSection id={sid("about")} title={supabaseSectionTitle("about")}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-semibold">{project.projectName}</span>
            <SupabaseMetricsSourceBadge source={metricsSource} />
            {metricsSource === "live" && restriction.restricted ? (
              <QuietChip
                label="Restricted"
                tone="bad"
                title={restriction.summary ?? restrictionPrimaryViolation(project) ?? undefined}
                iconMeta={resolveHealthStatusIcon("Restricted")}
              />
            ) : metricsSource === "live" ? (
              <QuietChip label={healthLabel} tone={healthTone} iconMeta={resolveHealthStatusIcon(healthLabel)} />
            ) : null}
            {plans.showRow ? <QuietChip label={plans.metaLine} tone="neutral" iconMeta={null} /> : null}
          </div>
          {restriction.restricted ? (
            <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-[13px] leading-relaxed text-rose-100">
              <span className="font-semibold">Services restricted.</span> Cause from{" "}
              <code className="font-mono text-[12px]">GET /v1/projects/&#123;ref&#125;/health</code>:{" "}
              <span className="font-mono">{restriction.violations.join(", ") || restrictionPrimaryViolation(project)}</span>.
              This is billing/quota enforcement — not derived from API request count or DB disk on this card. Upgrade the org
              plan or remove spend caps on Supabase Dashboard. See <strong>Health</strong> below for per-service errors.
            </p>
          ) : null}
          <p className="max-w-5xl rounded-xl border border-indigo-300/10 bg-indigo-500/[.045] px-4 py-3 text-[14px] leading-relaxed text-[var(--text)]/90">
            {aboutIntro}
          </p>
          {project.error ? (
            <p className="rounded-md border border-rose-400/20 bg-rose-500/5 px-2.5 py-1.5 text-[11px] text-rose-200">{project.error}</p>
          ) : null}
        </HubToolDetailSection>

        <HubToolDetailSection id={sid("usage")} title={supabaseSectionTitle("usage")}>
          {budgetLines.length > 0 ? (
            <div className="rounded-xl border border-white/8 bg-white/[.02] px-3 py-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Used vs allowed
              </p>
              <QuotaBudgetBlock lines={budgetLines} maxLines={4} excludeKeys={["db_disk", "api_total"]} />
            </div>
          ) : null}
          <div className="grid gap-1.5 md:grid-cols-2">
            <MetricRow
              label="api"
              value={formatApiUsageInline(usage) ?? "—"}
              good={usage.apiRequestsTotal != null || usage.restLatest != null}
            />
            <MetricRow
              label="storage_req_per_min"
              value={usage.storageLatest == null ? "—" : String(usage.storageLatest)}
              good
            />
            <MetricRow label="usage_window" value={usage.usageWindow ?? "—"} good={Boolean(usage.usageWindow)} />
          </div>
          {restriction.restricted ? (
            <p className="rounded-md border border-white/5 bg-white/[.02] px-3 py-2 text-[12px] text-[var(--muted)]">
              Billing-cycle egress % is not exposed via Management API (PAT). Use{" "}
              <a href={dashboardUrl} target="_blank" rel="noreferrer" className="text-indigo-300 hover:underline">
                Supabase Dashboard → Usage
              </a>{" "}
              for exact GB. Restricted status above comes from the health API.
            </p>
          ) : null}
        </HubToolDetailSection>

        <HubToolDetailSection id={sid("infra")} title={supabaseSectionTitle("infra")}>
          <div className="grid gap-1.5 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border border-white/5 bg-white/[.02] px-2.5 py-1.5 text-[12px]">
              <span className="font-mono text-[var(--muted)]">region</span>
              <RegionInline region={project.region} variant="full" />
            </div>
            <MetricRow label="org_plan" value={plans.orgPlan ?? "—"} good={Boolean(plans.orgPlan)} />
            <MetricRow label="project_plan" value={plans.projectPlan ?? "—"} good={Boolean(plans.projectPlan)} />
            <MetricRow
              label="db_disk"
              value={
                dbBudget
                  ? formatQuotaLineInline(dbBudget)
                  : infra.diskUsedBytes == null
                    ? "—"
                    : formatBytes(infra.diskUsedBytes)
              }
              good={infra.diskUsedBytes != null}
            />
            <MetricRow
              label="disk_size_gb"
              value={infra.diskSizeGb == null ? "—" : `${infra.diskSizeGb} GB`}
              good={infra.diskSizeGb != null}
            />
            <MetricRow label="org" value={project.orgSlug} good />
            <MetricRow label="owner" value={project.ownerEmail ?? "—"} good={Boolean(project.ownerEmail)} />
            <MetricRow
              label="tools"
              value={tools.length ? tools.join(", ") : "—"}
              good={tools.length > 0}
            />
          </div>
        </HubToolDetailSection>

        <HubToolDetailSection id={sid("quota")} title={supabaseSectionTitle("quota")}>
          {quota ? (
            <div className="grid gap-1.5 md:grid-cols-2">
              <MetricRow
                label="max_file_size"
                value={quota.maxFileBytes == null ? "—" : `${toMb(quota.maxFileBytes)} MB`}
                good
              />
              <MetricRow
                label="log_retention"
                value={quota.logDays == null ? "—" : `${quota.logDays} days`}
                good
              />
              <MetricRow label="functions_max" value={quota.fnMax == null ? "—" : String(quota.fnMax)} good />
              <MetricRow label="realtime_users" value={quota.rtUsers == null ? "—" : String(quota.rtUsers)} good />
              <MetricRow
                label="db_size_limit"
                value={quota.dbSizeBytes == null ? "—" : formatBytes(quota.dbSizeBytes)}
                good
              />
              <MetricRow
                label="egress_limit"
                value={quota.bandwidthBytes == null ? "—" : formatBytes(quota.bandwidthBytes)}
                good
              />
            </div>
          ) : (
            <p className="text-[12px] text-[var(--muted)]">No org entitlements loaded.</p>
          )}
          {org?.error ? <p className="text-[11px] text-rose-200">{org.error}</p> : null}
        </HubToolDetailSection>

        <HubToolDetailSection id={sid("health")} title={supabaseSectionTitle("health")}>
          {health.length > 0 ? (
            <div className="space-y-2">
              <div className="grid gap-1.5 md:grid-cols-2">
                {health.map((svc) => (
                  <MetricRow key={svc.name} label={svc.name} value={svc.status} good={svc.healthy} />
                ))}
              </div>
              {health
                .filter((svc) => svc.error)
                .map((svc) => (
                  <p
                    key={`${svc.name}-err`}
                    className="rounded-md border border-rose-400/20 bg-rose-500/5 px-2.5 py-1.5 text-[11px] text-rose-200"
                  >
                    <span className="font-mono uppercase text-rose-300/80">{svc.name}: </span>
                    {parseViolationsFromHealthError(svc.error).join(", ") || svc.error}
                  </p>
                ))}
            </div>
          ) : (
            <p className="text-[12px] text-[var(--muted)]">Service health not available (token scope or API error).</p>
          )}
        </HubToolDetailSection>

        <HubToolDetailSection id={sid("links")} title={supabaseSectionTitle("links")}>
          <ul className="space-y-1.5">
            <li>
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[.02] px-2.5 py-2 text-[12px] text-cyan-300/90 hover:border-indigo-400/30 hover:bg-indigo-500/5"
              >
                <ExternalLink size={compactIconSize(12)} />
                Supabase Dashboard
                <span className="ml-auto font-mono text-[10px] text-[var(--muted)]">{project.projectRef}</span>
              </a>
            </li>
            <li className="flex items-start gap-2 rounded-md border border-white/5 bg-white/[.02] px-2.5 py-1.5 text-[12px]">
              <CheckCircle2 size={compactIconSize(11)} className="mt-0.5 shrink-0 text-emerald-300" />
              <span>
                Management API ref: <code className="font-mono text-emerald-300">{project.projectRef}</code>
              </span>
            </li>
          </ul>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.region ? (
              <MetricBadge
                label={project.region}
                iconMeta={{ icon: Layers, className: "text-indigo-300" }}
                variantClass="border-indigo-400/20 bg-indigo-500/5 text-indigo-200"
                mono
              />
            ) : null}
          </div>
        </HubToolDetailSection>
    </>
  );
}
