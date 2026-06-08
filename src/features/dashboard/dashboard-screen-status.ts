import type { MetricBadgeTone } from "../../components/sales-shell/MetricBadge";
import {
  resolveDriftChipIcon,
  resolveHealthStatusIcon,
  type FilterIconMeta,
} from "../../lib/badge-registry";
import type { ResolvedTool } from "../../types";
import type { DashboardRuntimeStats } from "./useDashboardRuntimeStats";
import type { DashboardTabEntry } from "./dashboard-tab-registry";

export type DashboardScreenStatus = {
  label: string;
  tone: MetricBadgeTone;
  iconMeta?: FilterIconMeta | null;
};

type StatusCtx = {
  stats: DashboardRuntimeStats;
  allTools: ResolvedTool[];
  registryLive: boolean;
  driftCount: number;
};

export function dashboardStatusContext(
  allTools: ResolvedTool[],
  stats: DashboardRuntimeStats,
  registryLive: boolean,
): StatusCtx {
  return {
    stats,
    allTools,
    registryLive,
    driftCount: allTools.filter((t) => t.driftAlerts.length > 0).length,
  };
}

export function resolveDashboardScreenStatus(
  entry: DashboardTabEntry,
  ctx: StatusCtx,
): DashboardScreenStatus {
  switch (entry.id) {
    case "dashboard-home":
      return { label: "Home", tone: "ok" };
    case "hub-catalog": {
      if (!ctx.registryLive) {
        return { label: "Registry pending", tone: "warn", iconMeta: resolveHealthStatusIcon("Draft") };
      }
      if (ctx.driftCount > 0) {
        return { label: `${ctx.driftCount} drift`, tone: "warn", iconMeta: resolveDriftChipIcon() };
      }
      return { label: "Registry live", tone: "ok", iconMeta: resolveHealthStatusIcon("Ready") };
    }
    case "users-directory":
      if (ctx.stats.userCount == null) return { label: "Identity", tone: "neutral" };
      return { label: `${ctx.stats.userCount} users`, tone: "ok" };
    case "system-supabase-quota":
      if (ctx.stats.supabaseErrorCount != null && ctx.stats.supabaseErrorCount > 0) {
        return { label: `${ctx.stats.supabaseErrorCount} errors`, tone: "bad" };
      }
      if (ctx.stats.supabaseProjectCount != null) return { label: "Quota live", tone: "ok" };
      return { label: "Quota pending", tone: "neutral" };
    case "system-agent":
      if (ctx.stats.agentManifestCount != null) {
        return { label: `${ctx.stats.agentManifestCount} items`, tone: "ok" };
      }
      return { label: "Manifest pending", tone: "neutral" };
    case "system-server": {
      const localCount = ctx.allTools.filter((t) => t.localUrl).length;
      if (localCount === 0) return { label: "No local", tone: "neutral" };
      return { label: `${localCount} local`, tone: "neutral" };
    }
    case "system-overview":
      return { label: "Release hub", tone: "ok" };
    case "system-schema":
      return { label: "Schema catalog", tone: "neutral" };
    case "system-template":
      return { label: "Design gate", tone: "neutral" };
    default:
      return { label: entry.groupLabel, tone: "neutral" };
  }
}

export function enrichDashboardStatuses(
  entries: DashboardTabEntry[],
  ctx: StatusCtx,
): DashboardTabEntry[] {
  return entries.map((entry) => ({
    ...entry,
    status: resolveDashboardScreenStatus(entry, ctx),
  }));
}
