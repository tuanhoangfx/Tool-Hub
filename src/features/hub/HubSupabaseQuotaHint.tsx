import { useEffect, useState } from "react";
import { ExternalLink, Gauge } from "lucide-react";
import {
  SUPABASE_QUOTA_REFRESH_EVENT,
  SUPABASE_QUOTA_UPDATED_EVENT,
} from "../system-hub/supabase-quota-events";
import { compactIconSize } from "../../lib/ui-scale";
import { formatApiUsageInline, parseProjectUsage } from "../system-hub/supabase-quota-metrics";
import { computeQuotaBudget, formatQuotaLineInline, resolveQuotaHeadlineStatus } from "../system-hub/supabase-quota-budget";
import { resolveProjectMetricsSource } from "../system-hub/supabase-project-metrics-source";
import { findQuotaContextForTool } from "./hub-quota-lookup";

type HubSupabaseQuotaHintProps = {
  toolCode: string;
};

/** Live Supabase used vs limit on Hub cards (P0020 → bklxcjrk…). */
export function HubSupabaseQuotaHint({ toolCode }: HubSupabaseQuotaHintProps) {
  const [, bump] = useState(0);
  useEffect(() => {
    const onUpdate = () => bump((n) => n + 1);
    window.addEventListener(SUPABASE_QUOTA_UPDATED_EVENT, onUpdate);
    window.addEventListener(SUPABASE_QUOTA_REFRESH_EVENT, onUpdate);
    return () => {
      window.removeEventListener(SUPABASE_QUOTA_UPDATED_EVENT, onUpdate);
      window.removeEventListener(SUPABASE_QUOTA_REFRESH_EVENT, onUpdate);
    };
  }, []);

  const ctx = findQuotaContextForTool(toolCode);
  if (!ctx?.project.projectRef) return null;

  const { project, org } = ctx;
  const refShort = project.projectRef.slice(0, 8);
  const dashboardUrl = `https://supabase.com/dashboard/project/${encodeURIComponent(project.projectRef)}/settings/billing/usage`;
  const source = resolveProjectMetricsSource(project);

  if (source !== "live") {
    return (
      <p className="mt-2 text-[10px] leading-snug text-amber-200/80" title={project.error ?? undefined}>
        Supabase {refShort}… — open System → Supabase Quota and Refresh for live limits
      </p>
    );
  }

  const headline = resolveQuotaHeadlineStatus(project, org);
  const budget = computeQuotaBudget(project, org);
  const dbLine = budget.find((l) => l.key === "db_disk");
  const apiInline = formatApiUsageInline(parseProjectUsage(project));
  const toneClass =
    headline.status === "restricted" || headline.status === "critical"
      ? "text-rose-200/90"
      : headline.status === "warn"
        ? "text-amber-200/85"
        : "text-emerald-200/75";

  return (
    <div className={`mt-2 space-y-1 ${toneClass}`}>
      <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[10px] leading-snug" title={headline.title}>
        <Gauge size={compactIconSize(10)} className="shrink-0" aria-hidden />
        <span className="font-medium">{headline.label}</span>
        {dbLine ? (
          <>
            <span className="text-[var(--muted)]">·</span>
            <span className="tabular-nums">DB {formatQuotaLineInline(dbLine)}</span>
          </>
        ) : null}
        {apiInline ? (
          <>
            <span className="text-[var(--muted)]">·</span>
            <span className="tabular-nums">API {apiInline}</span>
          </>
        ) : null}
        <span className="text-[var(--muted)]">· {refShort}</span>
      </p>
      <a
        href={dashboardUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[9px] text-indigo-300/90 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink size={compactIconSize(9)} aria-hidden />
        Dashboard usage (egress GB)
      </a>
    </div>
  );
}
