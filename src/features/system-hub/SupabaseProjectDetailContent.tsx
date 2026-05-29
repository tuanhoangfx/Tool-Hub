import { CheckCircle2, ExternalLink, Layers } from "lucide-react";
import type { ReactNode } from "react";
import { MetricBadge } from "../../components/sales-shell";
import { ToolAvatar } from "../../components/ToolAvatar";
import { resolveHealthStatusIcon } from "../../lib/badge-registry";
import { compactIconSize } from "../../lib/ui-scale";
import { QuietChip } from "../hub/hub-tool-ui";
import type { OrgRow, ProjectRow } from "./SystemSupabaseQuotaPanel.types";
import { SupabaseDetailTocNav } from "./SupabaseDetailTocNav";
import {
  formatBytes,
  formatCompact,
  orgEntitlementSummary,
  formatEgressQuotaShort,
  parseEgressQuota,
  parseHealthServices,
  parseProjectInfra,
  parseProjectRestriction,
  parseProjectUsage,
  parseViolationsFromHealthError,
  resolveProjectHealthLabel,
  toMb,
} from "./supabase-quota-metrics";
import { regionDisplay } from "../../lib/supabase-region";

export type SupabaseProjectDetailContentProps = {
  project: ProjectRow;
  org: OrgRow | null;
  idPrefix?: string;
};

function refBadgeClass() {
  return "border-emerald-400/35 bg-emerald-500/12 text-emerald-200";
}

function DetailSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-3 space-y-3">
      <h2 className="border-b border-white/5 pb-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function MetricRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/5 bg-white/[.02] px-2.5 py-1.5 text-[12px]">
      <span className="font-mono text-[var(--muted)]">{label}</span>
      <MetricBadge label={value} tone={good ? "ok" : "neutral"} />
    </div>
  );
}

export function SupabaseProjectDetailContent({ project, org, idPrefix = "" }: SupabaseProjectDetailContentProps) {
  const sid = (id: string) => `${idPrefix}${id}`;
  const usage = parseProjectUsage(project);
  const infra = parseProjectInfra(project);
  const egress = parseEgressQuota(project, org?.plan);
  const health = parseHealthServices(project);
  const restriction = parseProjectRestriction(project);
  const quota = org ? orgEntitlementSummary(org.entitlements) : null;
  const plan = (project.plan ?? org?.plan ?? "").trim() || "—";
  const refShort = project.projectRef.slice(0, 8);
  const dashboardUrl = `https://supabase.com/dashboard/project/${encodeURIComponent(project.projectRef)}`;
  const hasError = Boolean(project.error);
  const healthLabel = resolveProjectHealthLabel(project);
  const healthTone = restriction.restricted || hasError ? "bad" : healthLabel === "Live" || healthLabel === "Healthy" ? "ok" : "warn";

  const aboutIntro = `${project.projectName} on Supabase (${project.region ?? "unknown region"}). Organization ${project.orgSlug}. Open the dashboard for settings, SQL editor, and billing. Metrics below are loaded via the Management API proxy.`;

  return (
    <div className="grid gap-4 lg:grid-cols-[var(--overview-detail-toc-col-w)_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-0 lg:self-start">
        <SupabaseDetailTocNav idPrefix={idPrefix} />
      </aside>

      <div className="min-w-0 space-y-5 p-1 sm:p-2">
        <div className="flex items-center gap-3 pb-1">
          <ToolAvatar code="SB" iconName="cloud" size="md" />
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <MetricBadge label={refShort} mono variantClass={refBadgeClass()} />
            <h2 className="min-w-0 truncate text-lg font-semibold leading-tight">{project.projectName}</h2>
          </div>
        </div>

        <DetailSection id={sid("about")} title="About">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-semibold">{project.projectName}</span>
            <MetricBadge label={refShort} mono variantClass={refBadgeClass()} />
            <QuietChip label={healthLabel} tone={healthTone} iconMeta={resolveHealthStatusIcon(healthLabel)} />
            <QuietChip label={plan} tone="neutral" iconMeta={null} />
          </div>
          {restriction.restricted ? (
            <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-[13px] leading-relaxed text-rose-100">
              <span className="font-semibold">Services restricted.</span>{" "}
              {restriction.summary ?? "This project cannot serve requests due to quota violations."} Upgrade the org plan or
              remove spend caps on Supabase Dashboard.
            </p>
          ) : null}
          <p className="max-w-5xl rounded-xl border border-indigo-300/10 bg-indigo-500/[.045] px-4 py-3 text-[14px] leading-relaxed text-[var(--text)]/90">
            {aboutIntro}
          </p>
          {project.error ? (
            <p className="rounded-md border border-rose-400/20 bg-rose-500/5 px-2.5 py-1.5 text-[11px] text-rose-200">{project.error}</p>
          ) : null}
        </DetailSection>

        <DetailSection id={sid("usage")} title="Usage">
          <div className="grid gap-1.5 md:grid-cols-2">
            <MetricRow
              label="api_requests_total"
              value={usage.apiRequestsTotal == null ? "—" : formatCompact(usage.apiRequestsTotal)}
              good={usage.apiRequestsTotal != null}
            />
            <MetricRow label="rest_per_min" value={usage.restLatest == null ? "—" : String(usage.restLatest)} good />
            <MetricRow label="auth_per_min" value={usage.authLatest == null ? "—" : String(usage.authLatest)} good />
            <MetricRow label="realtime_per_min" value={usage.realtimeLatest == null ? "—" : String(usage.realtimeLatest)} good />
            <MetricRow
              label="storage_req_per_min"
              value={usage.storageLatest == null ? "—" : String(usage.storageLatest)}
              good
            />
            <MetricRow
              label="egress_uncached"
              value={
                egress.egressUsedGb == null
                  ? "—"
                  : `${egress.egressUsedGb} / ${egress.egressLimitGb ?? "∞"} GB${egress.egressPercent != null ? ` (${egress.egressPercent}%)` : ""}`
              }
              good={!egress.exceeded}
            />
            <MetricRow
              label="egress_cached"
              value={
                egress.cachedEgressUsedGb == null
                  ? "—"
                  : `${egress.cachedEgressUsedGb} / ${egress.cachedEgressLimitGb ?? "∞"} GB${egress.cachedEgressPercent != null ? ` (${egress.cachedEgressPercent}%)` : ""}`
              }
              good={egress.cachedEgressPercent == null || egress.cachedEgressPercent < 100}
            />
            <MetricRow
              label="egress_unified"
              value={
                egress.unifiedUsedGb == null
                  ? "—"
                  : `${egress.unifiedUsedGb} / ${egress.unifiedLimitGb ?? "∞"} GB${egress.unifiedPercent != null ? ` (${egress.unifiedPercent}%)` : ""}`
              }
              good={!egress.exceeded}
            />
            <MetricRow label="usage_window" value={usage.usageWindow ?? "—"} good={Boolean(usage.usageWindow)} />
          </div>
        </DetailSection>

        <DetailSection id={sid("infra")} title="Infrastructure">
          <div className="grid gap-1.5 md:grid-cols-2">
            <MetricRow label="region" value={regionDisplay(project.region)} good />
            <MetricRow label="plan" value={plan} good />
            <MetricRow
              label="db_disk_used"
              value={infra.diskUsedBytes == null ? "—" : formatBytes(infra.diskUsedBytes)}
              good={infra.diskUsedBytes != null}
            />
            <MetricRow
              label="db_disk_avail"
              value={infra.diskAvailBytes == null ? "—" : formatBytes(infra.diskAvailBytes)}
              good
            />
            <MetricRow
              label="disk_size_gb"
              value={infra.diskSizeGb == null ? "—" : `${infra.diskSizeGb} GB`}
              good={infra.diskSizeGb != null}
            />
            <MetricRow label="org" value={project.orgSlug} good />
          </div>
        </DetailSection>

        <DetailSection id={sid("quota")} title="Org quota">
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
                value={
                  quota.bandwidthBytes == null
                    ? egress.egressLimitGb != null
                      ? `${egress.egressLimitGb} GB (plan)`
                      : "—"
                    : formatBytes(quota.bandwidthBytes)
                }
                good
              />
            </div>
          ) : (
            <p className="text-[12px] text-[var(--muted)]">No org entitlements loaded.</p>
          )}
          {org?.error ? <p className="text-[11px] text-rose-200">{org.error}</p> : null}
        </DetailSection>

        <DetailSection id={sid("health")} title="Health">
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
        </DetailSection>

        <DetailSection id={sid("links")} title="Links">
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
        </DetailSection>
      </div>
    </div>
  );
}
