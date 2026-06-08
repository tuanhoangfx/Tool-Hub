import type { DashboardRuntimeStats } from "./useDashboardRuntimeStats";
import type { DashboardTabEntry } from "./dashboard-tab-registry";

function fmtCount(n: number | null, label: string): string | null {
  if (n == null) return null;
  return `${n} ${label}`;
}

/** Merge lazy runtime counts into registry meta lines. */
export function enrichDashboardRegistryMeta(
  entries: DashboardTabEntry[],
  stats: DashboardRuntimeStats,
  opts?: { driftCount?: number },
): DashboardTabEntry[] {
  return entries.map((entry) => {
    if (entry.id === "hub-catalog" && opts?.driftCount != null && opts.driftCount > 0) {
      const base = entry.meta ?? "";
      return { ...entry, meta: base ? `${base} · ${opts.driftCount} drift` : `${opts.driftCount} drift` };
    }
    if (entry.id === "users-directory" && stats.userCount != null) {
      return { ...entry, meta: `${stats.userCount} users · Identity · Supabase` };
    }
    if (entry.id === "system-agent" && stats.agentManifestCount != null) {
      return { ...entry, meta: `${stats.agentManifestCount} manifest items` };
    }
    if (entry.id === "dashboard-home") {
      return { ...entry, meta: "Screen console · P0004 golden" };
    }
    if (entry.id === "system-overview") {
      return { ...entry, meta: entry.goldenRef ? `Golden ${entry.goldenRef}` : "Release roadmap" };
    }
    if (entry.id === "system-schema") {
      return { ...entry, meta: "Catalog · manifest · runtime schema" };
    }
    if (entry.id === "system-server") {
      const local = stats.localToolCount;
      return local != null && local > 0
        ? { ...entry, meta: `${local} tools with local URL` }
        : entry;
    }
    if (entry.id === "system-template") {
      return { ...entry, meta: "Design V1–V5 compare gate" };
    }
    if (entry.id === "system-supabase-quota") {
      const parts = [
        fmtCount(stats.supabaseProjectCount, "projects"),
        stats.supabaseErrorCount != null && stats.supabaseErrorCount > 0
          ? `${stats.supabaseErrorCount} errors`
          : stats.supabaseProjectCount != null
            ? "quota live"
            : null,
      ].filter(Boolean);
      if (parts.length > 0) return { ...entry, meta: parts.join(" · ") };
    }
    return entry;
  });
}
