import {
  Activity,
  AtSign,
  Building2,
  CheckCircle2,
  Globe2,
  HardDrive,
  Layers,
  Pencil,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { MetricBadge } from "../../components/sales-shell/MetricBadge";
import { ToolAvatar } from "../../components/ToolAvatar";
import { compactIconSize } from "../../lib/ui-scale";
import { resolveHealthStatusIcon } from "../../lib/badge-registry";
import type { ProjectRow } from "./SystemSupabaseQuotaPanel.types";
import {
  formatBytes,
  formatCompact,
  parseProjectInfra,
  parseProjectRestriction,
  parseProjectUsage,
  resolvePlanDisplay,
  resolveProjectHealthLabel,
  restrictionPrimaryViolation,
} from "./supabase-quota-metrics";
import { RegionInline } from "../../components/RegionFlagBadge";
import { QuietChip } from "../hub/hub-tool-ui";
import { resolveProjectToolCodes } from "./supabase-project-tools";
import { SupabaseProjectToolBadges } from "./SupabaseProjectToolBadges";
import { SupabaseMetricsSourceBadge } from "./SupabaseMetricsSourceBadge";
import { resolveProjectMetricsSource } from "./supabase-project-metrics-source";

const META: Record<string, { Icon: LucideIcon; tint: string }> = {
  org: { Icon: Building2, tint: "#38bdf8" },
  region: { Icon: Globe2, tint: "#a78bfa" },
  plan: { Icon: Layers, tint: "#34d399" },
  apiTotal: { Icon: Activity, tint: "#fbbf24" },
  apiWindow: { Icon: Zap, tint: "#f472b6" },
  disk: { Icon: HardDrive, tint: "#60a5fa" },
};

function refBadgeClass() {
  return "border-emerald-400/35 bg-emerald-500/12 text-emerald-200";
}

function statusDotColor(hasError: boolean, restriction: ReturnType<typeof parseProjectRestriction>, hasUsage: boolean) {
  if (hasError || restriction.restricted) return "#f43f5e";
  if (restriction.overallStatus === "unhealthy") return "#f59e0b";
  if (!hasUsage) return "#f59e0b";
  return "#22c55e";
}

function MetaRow({ kind, children }: { kind: keyof typeof META; children: ReactNode }) {
  const { Icon, tint } = META[kind];
  return (
    <div className="flex items-center gap-2">
      <Icon size={compactIconSize(12)} className="shrink-0" strokeWidth={2} style={{ color: tint, opacity: 0.72 }} />
      <div className="min-w-0 flex-1 truncate">{children}</div>
    </div>
  );
}

function UsageFooter({ project }: { project: ProjectRow }) {
  const usage = parseProjectUsage(project);
  const restriction = parseProjectRestriction(project);

  if (restriction.restricted) return null;

  const hasUsage =
    usage.apiRequestsTotal != null ||
    usage.restLatest != null ||
    usage.authLatest != null ||
    usage.realtimeLatest != null;

  return (
    <div className="mt-2 h-8 shrink-0 overflow-hidden">
      {project.error ? (
        <p className="line-clamp-2 text-[10px] leading-snug text-rose-200/90">{project.error}</p>
      ) : hasUsage ? (
        <p className="flex items-center gap-1 text-[10px] leading-snug text-emerald-200/65">
          <CheckCircle2 size={compactIconSize(10)} className="shrink-0 text-emerald-400" aria-hidden />
          <span className="truncate">
            Usage loaded
            {usage.usageWindow ? ` · ${usage.usageWindow}` : ""}
          </span>
        </p>
      ) : (
        <p className="text-[10px] leading-snug text-[var(--muted)]">No usage metrics from API</p>
      )}
    </div>
  );
}

type SupabaseProjectCardProps = {
  project: ProjectRow;
  org?: { plan?: string | null } | null;
  tools?: string[];
  onOpen: (ref: string) => void;
};

export function SupabaseProjectCard({ project, org, tools: toolsProp, onOpen }: SupabaseProjectCardProps) {
  const usage = parseProjectUsage(project);
  const infra = parseProjectInfra(project);
  const restriction = parseProjectRestriction(project);
  const metricsSource = resolveProjectMetricsSource(project);
  const isCatalogOnly = metricsSource === "catalog";
  const refShort = project.projectRef ? project.projectRef.slice(0, 8) : "—";
  const planDisplay = resolvePlanDisplay(project, org);
  const hasError = Boolean(project.error);
  const healthLabel = resolveProjectHealthLabel(project);
  const statusDot = isCatalogOnly ? "#94a3b8" : statusDotColor(hasError, restriction, usage.apiRequestsTotal != null);
  const healthTone = restriction.restricted || hasError ? "bad" : healthLabel === "Live" || healthLabel === "Healthy" ? "ok" : "warn";

  const tools = toolsProp ?? resolveProjectToolCodes(project);

  const open = () => {
    if (!project.projectRef) return;
    onOpen(project.projectRef);
  };

  return (
    <button
      type="button"
      onClick={open}
      className={`group flex h-full min-h-[var(--hub-card-min-h)] w-full flex-col rounded-xl border bg-[var(--panel)] p-4 text-left transition-[border-color,box-shadow,background-color] duration-200 hover:bg-white/[0.02] hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] ${
        restriction.restricted
          ? "border-rose-500/45 hover:border-rose-400/55"
          : "border-white/5 hover:border-indigo-500/40"
      }`}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative shrink-0">
            <ToolAvatar code="SB" iconName="cloud" size="sm" />
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-[var(--panel)]"
              style={{ background: statusDot }}
              title={healthLabel}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <MetricBadge label={refShort} mono variantClass={refBadgeClass()} />
              <SupabaseMetricsSourceBadge source={metricsSource} />
              <span className="min-w-0 line-clamp-2 text-sm font-medium leading-snug text-[var(--text)]">
                {project.projectName}
              </span>
            </div>
          </div>
        </div>
        <Pencil size={compactIconSize(14)} className="shrink-0 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="min-h-[var(--hub-card-meta-min-h)] shrink-0 space-y-1.5 text-xs text-[var(--muted)]">
        <MetaRow kind="org">
          <span className="flex min-w-0 items-center gap-2 truncate">
            <span className="shrink-0 font-mono text-[11px] text-indigo-200/90">{project.orgSlug}</span>
            <span className="shrink-0 text-[var(--muted)]/45" aria-hidden>
              ·
            </span>
            <span className="flex min-w-0 items-center gap-1 truncate text-[11px] text-[var(--text)]/85">
              <AtSign
                size={compactIconSize(10)}
                className="shrink-0 text-pink-300/75"
                strokeWidth={2}
                aria-hidden
              />
              <span className="min-w-0 truncate" title={project.ownerEmail ?? undefined}>
                {project.ownerEmail?.trim() || "—"}
              </span>
            </span>
          </span>
        </MetaRow>
        <MetaRow kind="region">
          <RegionInline region={project.region} />
        </MetaRow>
        <MetaRow kind="plan">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shrink-0 font-medium text-[var(--text)]">
              {planDisplay.showRow ? planDisplay.metaLine : "—"}
            </span>
            {tools.length > 0 ? (
              <SupabaseProjectToolBadges tools={tools} bindings={project.toolBindings} />
            ) : null}
          </span>
        </MetaRow>
        <MetaRow kind="apiTotal">
          <span className="font-medium text-[var(--text)]">
            {usage.apiRequestsTotal == null ? "—" : formatCompact(usage.apiRequestsTotal)}
            <span className="ml-1 text-[10px] text-[var(--muted)]">API requests (total)</span>
          </span>
        </MetaRow>
        <MetaRow kind="apiWindow">
          {usage.restLatest != null || usage.authLatest != null ? (
            <span>
              REST {usage.restLatest ?? "—"} · Auth {usage.authLatest ?? "—"} · RT {usage.realtimeLatest ?? "—"}
              <span className="ml-1 text-[10px] text-[var(--muted)]">/ min (latest)</span>
            </span>
          ) : (
            <span>—</span>
          )}
        </MetaRow>
        <MetaRow kind="disk">
          <span className="font-medium text-[var(--text)]">
            {infra.diskUsedBytes == null ? "—" : formatBytes(infra.diskUsedBytes)}
            <span className="ml-1 text-[10px] text-[var(--muted)]">DB disk used</span>
          </span>
        </MetaRow>
      </div>

      <div className="mt-auto shrink-0 pt-3">
        <div className="flex min-h-[var(--hub-card-chip-row-min-h)] flex-wrap items-center gap-1.5">
          {metricsSource === "live" && restriction.restricted ? (
            <QuietChip
              label="Restricted"
              tone="bad"
              title={
                restriction.summary ??
                `Cause: ${restrictionPrimaryViolation(project) ?? "quota violation"} (from project health API)`
              }
              iconMeta={resolveHealthStatusIcon("Restricted")}
            />
          ) : metricsSource === "live" ? (
            <QuietChip label={healthLabel} tone={healthTone} iconMeta={resolveHealthStatusIcon(healthLabel)} />
          ) : project.error ? (
            <QuietChip label="No PAT" tone="neutral" title={project.error} />
          ) : null}
        </div>
        <UsageFooter project={project} />
      </div>
    </button>
  );
}
