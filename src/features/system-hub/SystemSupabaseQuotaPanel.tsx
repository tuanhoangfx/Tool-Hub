import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Gauge, RefreshCcw } from "lucide-react";
import { z } from "zod";
import {
  HubResultCount,
  MiniBarChart,
  ViewToggle,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
} from "../../components/sales-shell";
import { EmptyState } from "../../components/EmptyState";
import { compactIconSize } from "../../lib/ui-scale";
import { useSessionState } from "../../hooks";
import { SystemHubShell } from "./SystemHubShell";
import { SupabaseProjectCard } from "./SupabaseProjectCard";
import { SupabaseProjectDetailModal } from "./SupabaseProjectDetailModal";
import { OrgQuotaTable } from "./OrgQuotaTable";
import type { OrgRow, ProjectRow, QuotaPayload } from "./SystemSupabaseQuotaPanel.types";
import {
  formatBytes,
  formatCompact,
  formatEgressQuotaShort,
  formatMinMax,
  parseEgressQuota,
  parseProjectInfra,
  parseProjectRestriction,
  parseProjectUsage,
  quotaMinMaxAcrossOrgs,
  resolveProjectHealthLabel,
  sumFilteredUsage,
  toMb,
} from "./supabase-quota-metrics";
import { regionDisplay } from "../../lib/supabase-region";

const OrgSchema = z.object({
  slug: z.string(),
  plan: z.string().optional().nullable(),
  entitlements: z.unknown().optional(),
  error: z.string().optional(),
});

const ProjectSchema = z.object({
  orgSlug: z.string(),
  projectRef: z.string(),
  projectName: z.string(),
  region: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  addons: z.unknown().optional(),
  usage: z
    .object({
      apiCounts: z.unknown().optional(),
      apiRequestsCount: z.unknown().optional(),
      diskUtil: z.unknown().optional(),
      diskConfig: z.unknown().optional(),
      health: z.unknown().optional(),
      orgUsage: z.unknown().optional(),
    })
    .optional(),
  error: z.string().optional(),
});

const QuotaPayloadSchema = z.object({
  ok: z.boolean(),
  generatedAt: z.string().optional(),
  cacheTtlMs: z.number().optional(),
  organizations: z.array(OrgSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  error: z.string().optional(),
});

/** Accent divider before data section — mirror HubListPage. */
function HubLikeDataSectionRule({ label }: { label: string }) {
  return (
    <div role="separator" className="relative py-5" aria-label={label}>
      <div
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-indigo-400/45 to-transparent shadow-[0_0_10px_rgba(99,102,241,0.2)]"
        aria-hidden
      />
      <div className="relative flex justify-center" aria-hidden>
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-[var(--bg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-300/90 shadow-[0_0_16px_rgba(99,102,241,0.12)]">
          <span className="h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
          {label}
          <span className="h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
        </span>
      </div>
    </div>
  );
}

function toneForPlan(plan: string | null | undefined) {
  const p = (plan ?? "").toLowerCase();
  if (!p) return "neutral";
  if (p.includes("pro") || p.includes("paid")) return "indigo";
  if (p.includes("free")) return "neutral";
  if (p.includes("enterprise") || p.includes("team")) return "amber";
  return "neutral";
}

function uniq<T>(items: T[]) {
  return [...new Set(items)];
}

function normLabel(v: string | null | undefined) {
  const t = (v ?? "").trim();
  return t ? t : "—";
}

function breakdown(labels: Array<string | null | undefined>): Array<{ label: string; value: number }> {
  const map = new Map<string, number>();
  for (const label of labels) {
    const key = normLabel(label);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function ProjectTable({ rows, orgs, onOpen }: { rows: ProjectRow[]; orgs: OrgRow[]; onOpen: (ref: string) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[var(--panel)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/[.02] text-[10px] uppercase tracking-wider text-[var(--muted)]">
              <th className="w-36 px-3 py-2 font-medium">Org</th>
              <th className="w-40 px-3 py-2 font-medium">Project</th>
              <th className="w-24 px-3 py-2 font-medium">Region</th>
              <th className="w-20 px-3 py-2 font-medium">Plan</th>
              <th className="w-24 px-3 py-2 font-medium">Status</th>
              <th className="w-28 px-3 py-2 font-medium">API total</th>
              <th className="w-24 px-3 py-2 font-medium">REST/min</th>
              <th className="w-24 px-3 py-2 font-medium">Stor/min</th>
              <th className="w-28 px-3 py-2 font-medium">Egress</th>
              <th className="w-28 px-3 py-2 font-medium">DB disk</th>
              <th className="px-3 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((p) => {
              const plan = normLabel(p.plan);
              const tone = toneForPlan(p.plan);
              const usage = parseProjectUsage(p);
              const infra = parseProjectInfra(p);
              const egress = parseEgressQuota(p, orgs.find((o) => o.slug === p.orgSlug)?.plan);
              const restriction = parseProjectRestriction(p);
              const statusLabel = resolveProjectHealthLabel(p);
              const statusTone = restriction.restricted ? "rose" : statusLabel === "Live" || statusLabel === "Healthy" ? "emerald" : "amber";
              return (
                <tr
                  key={`${p.orgSlug}-${p.projectRef}-${p.projectName}`}
                  className={`cursor-pointer hover:bg-white/[.04] ${restriction.restricted ? "bg-rose-500/[.03]" : ""}`}
                  onClick={() => p.projectRef && onOpen(p.projectRef)}
                >
                  <td className="px-3 py-2 align-top font-mono text-[11px] text-indigo-200/90">{p.orgSlug}</td>
                  <td className="px-3 py-2 align-top font-medium text-[var(--text)]">{p.projectName}</td>
                  <td className="px-3 py-2 align-top text-[11px] text-[var(--muted)]">{regionDisplay(p.region)}</td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        tone === "indigo"
                          ? "border-indigo-500/25 bg-indigo-500/10 text-indigo-200"
                          : tone === "amber"
                            ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
                            : "border-white/10 bg-white/5 text-[var(--muted)]"
                      }`}
                    >
                      {plan}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        statusTone === "rose"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                          : statusTone === "emerald"
                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                            : "border-amber-500/25 bg-amber-500/10 text-amber-200"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top font-mono text-[11px] text-[var(--text)]">
                    {usage.apiRequestsTotal == null ? "—" : formatCompact(usage.apiRequestsTotal)}
                  </td>
                  <td className="px-3 py-2 align-top font-mono text-[11px] text-[var(--muted)]">
                    {usage.restLatest ?? "—"}
                  </td>
                  <td className="px-3 py-2 align-top font-mono text-[11px] text-[var(--muted)]">
                    {usage.storageLatest ?? "—"}
                  </td>
                  <td className={`px-3 py-2 align-top font-mono text-[11px] ${egress.exceeded ? "text-rose-200" : "text-[var(--text)]"}`}>
                    {formatEgressQuotaShort(egress)}
                  </td>
                  <td className="px-3 py-2 align-top font-mono text-[11px] text-[var(--muted)]">
                    {infra.diskUsedBytes == null ? "—" : formatBytes(infra.diskUsedBytes)}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-[var(--muted)]">
                    {p.error ? <span className="text-rose-200">{p.error}</span> : <span className="text-[var(--muted)]/60">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SystemSupabaseQuotaPanel() {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:supabase-quota:viewMode", "card");

  const [payload, setPayload] = useState<QuotaPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheHint, setCacheHint] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/supabase/quota${forceRefresh ? "?refresh=1" : ""}`, { method: "GET" });
      const xCache = r.headers.get("X-Cache");
      setCacheHint(xCache);
      const data = QuotaPayloadSchema.parse(await r.json());
      if (!data.ok) throw new Error(data.error || "Supabase quota fetch failed");
      setPayload(data);
    } catch (e) {
      setPayload(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(false);
  }, [fetchData]);

  const organizations: OrgRow[] = payload?.organizations ?? [];
  const projectsRaw: ProjectRow[] = payload?.projects ?? [];

  const modalProject = useMemo(() => {
    if (!selectedRef) return null;
    return projectsRaw.find((p) => p.projectRef === selectedRef) ?? null;
  }, [projectsRaw, selectedRef]);

  const modalOrg = useMemo(() => {
    if (!modalProject) return null;
    return organizations.find((o) => o.slug === modalProject.orgSlug) ?? null;
  }, [organizations, modalProject]);

  const openProject = useCallback((ref: string) => setSelectedRef(ref), []);
  const closeModal = useCallback(() => setSelectedRef(null), []);

  const orgOptions = useMemo(() => {
    const slugs = uniq(projectsRaw.map((p) => p.orgSlug)).sort((a, b) => a.localeCompare(b));
    return slugs.map((s) => ({ value: s, label: s }));
  }, [projectsRaw]);

  const regionOptions = useMemo(() => {
    const values = uniq(projectsRaw.map((p) => normLabel(p.region))).sort((a, b) => a.localeCompare(b));
    return values.map((v) => ({ value: v, label: v }));
  }, [projectsRaw]);

  const planOptions = useMemo(() => {
    const values = uniq(projectsRaw.map((p) => normLabel(p.plan))).sort((a, b) => a.localeCompare(b));
    return values.map((v) => ({ value: v, label: v }));
  }, [projectsRaw]);

  const filters = useMemo((): FilterDef[] => {
    return [
      { key: "org", label: "Org", options: orgOptions, showAllLabel: true },
      { key: "region", label: "Region", options: regionOptions, showAllLabel: true },
      { key: "plan", label: "Plan", options: planOptions, showAllLabel: true },
      {
        key: "health",
        label: "Health",
        options: [
          { value: "ok", label: "OK" },
          { value: "restricted", label: "Restricted" },
          { value: "unhealthy", label: "Unhealthy" },
          { value: "error", label: "Error" },
        ],
        showAllLabel: true,
      },
    ];
  }, [orgOptions, planOptions, regionOptions]);

  const projectsFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const orgPick = filterValues.org;
    const regionPick = filterValues.region;
    const planPick = filterValues.plan;
    const healthPick = filterValues.health?.[0] as "ok" | "restricted" | "unhealthy" | "error" | undefined;

    return projectsRaw.filter((p) => {
      if (orgPick?.length && !orgPick.includes(p.orgSlug)) return false;
      if (regionPick?.length && !regionPick.includes(normLabel(p.region))) return false;
      if (planPick?.length && !planPick.includes(normLabel(p.plan))) return false;
      const restriction = parseProjectRestriction(p);
      if (healthPick === "ok" && (p.error || restriction.restricted || restriction.overallStatus === "unhealthy"))
        return false;
      if (healthPick === "restricted" && !restriction.restricted) return false;
      if (healthPick === "unhealthy" && (restriction.restricted || p.error || restriction.overallStatus !== "unhealthy"))
        return false;
      if (healthPick === "error" && !p.error) return false;

      if (!q) return true;
      const usage = parseProjectUsage(p);
      const hay = [
        p.orgSlug,
        p.projectName,
        p.projectRef,
        p.region,
        p.plan,
        p.error,
        usage.apiRequestsTotal,
        usage.restLatest,
        usage.authLatest,
        usage.realtimeLatest,
      ]
        .filter((x) => x != null && x !== "")
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [projectsRaw, query, filterValues.org, filterValues.plan, filterValues.region, filterValues.health]);

  const kpis = useMemo(() => {
    const orgsShown = new Set(projectsFiltered.map((p) => p.orgSlug)).size;
    const errors = projectsFiltered.filter((p) => Boolean(p.error)).length;
    const restricted = projectsFiltered.filter((p) => parseProjectRestriction(p).restricted).length;
    const pro = projectsFiltered.filter((p) => (p.plan ?? "").toLowerCase().includes("pro")).length;
    return { total: projectsFiltered.length, orgs: orgsShown, errors, restricted, pro };
  }, [projectsFiltered]);

  const quotaRange = useMemo(() => quotaMinMaxAcrossOrgs(organizations), [organizations]);
  const usageSum = useMemo(() => sumFilteredUsage(projectsFiltered), [projectsFiltered]);

  const charts = useMemo(() => {
    return {
      byRegion: breakdown(projectsFiltered.map((p) => regionDisplay(p.region))),
      byPlan: breakdown(projectsFiltered.map((p) => p.plan)),
    };
  }, [projectsFiltered]);

  const kpiItems = useMemo(
    () => [
      { prefKey: "total", label: "Projects (shown)", value: kpis.total, icon: Gauge, tone: "indigo" as const },
      { prefKey: "orgs", label: "Organizations", value: kpis.orgs, icon: Gauge, tone: "emerald" as const },
      { prefKey: "errors", label: "Errors", value: kpis.errors, icon: Gauge, tone: "rose" as const },
      {
        prefKey: "restricted",
        label: "Restricted",
        value: kpis.restricted,
        icon: Gauge,
        tone: "rose" as const,
      },
      { prefKey: "pro", label: "Pro projects", value: kpis.pro, icon: Gauge, tone: "amber" as const },
      {
        prefKey: "api_total",
        label: "API requests (sum)",
        value: usageSum.apiRequestsTotal > 0 ? formatCompact(usageSum.apiRequestsTotal) : "—",
        icon: Gauge,
        tone: "blue" as const,
      },
      {
        prefKey: "api_rest",
        label: "REST / min (sum)",
        value: usageSum.restLatest > 0 ? formatCompact(usageSum.restLatest) : "—",
        icon: Gauge,
        tone: "purple" as const,
      },
      {
        prefKey: "quota_file",
        label: "Max file size (min–max)",
        value: formatMinMax(quotaRange.maxFileBytes, (n) => `${toMb(n)} MB`),
        icon: Gauge,
        tone: "blue" as const,
      },
      {
        prefKey: "quota_log",
        label: "Log retention (min–max)",
        value: formatMinMax(quotaRange.logDays, (n) => `${n} day${n === 1 ? "" : "s"}`),
        icon: Gauge,
        tone: "purple" as const,
      },
      {
        prefKey: "quota_fn",
        label: "Functions max (min–max)",
        value: formatMinMax(quotaRange.fnMax, (n) => String(n)),
        icon: Gauge,
        tone: "indigo" as const,
      },
      {
        prefKey: "quota_rt",
        label: "Realtime users (min–max)",
        value: formatMinMax(quotaRange.rtUsers, (n) => String(n)),
        icon: Gauge,
        tone: "emerald" as const,
      },
    ],
    [kpis, quotaRange, usageSum],
  );

  const toolbar = useMemo(() => {
    return (
      <>
        <ViewToggle value={viewMode} onChange={setViewMode} />
        <button
          type="button"
          onClick={() => void fetchData(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[var(--panel-2)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-white/5 disabled:opacity-50"
          title="Force refresh (bypass cache)"
        >
          <RefreshCcw size={compactIconSize(12)} className={loading ? "anim-spin" : ""} />
          Refresh
        </button>
        <HubResultCount icon={Gauge} shown={projectsFiltered.length} total={projectsRaw.length} label="projects" />
      </>
    );
  }, [viewMode, setViewMode, fetchData, loading, projectsFiltered.length, projectsRaw.length]);

  const chartsNode = useMemo(() => {
    const regionItems = charts.byRegion.slice(0, 8).map((i: { label: string; value: number }, idx: number) => ({
      label: i.label,
      value: i.value,
      color: ["#818cf8", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#f43f5e"][idx % 7],
    }));
    const planItems = charts.byPlan.slice(0, 8).map((i: { label: string; value: number }, idx: number) => ({
      label: i.label,
      value: i.value,
      color: ["#818cf8", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#f43f5e"][idx % 7],
    }));
    return (
      <>
        <MiniBarChart title="By region" items={regionItems} />
        <MiniBarChart title="By plan" items={planItems} />
      </>
    );
  }, [charts.byPlan, charts.byRegion]);

  const subtitle = useMemo(() => {
    const ts = payload?.generatedAt ? new Date(payload.generatedAt).toLocaleString() : "—";
    const hint = cacheHint ? ` · cache=${cacheHint}` : "";
    return `generatedAt: ${ts}${hint}`;
  }, [payload?.generatedAt, cacheHint]);

  const body = useMemo(() => {
    if (error) {
      const missingToken = /Missing SUPABASE_MANAGEMENT_TOKEN/i.test(error);
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            <AlertTriangle size={compactIconSize(16)} />
            {error}
          </div>
          {missingToken ? (
            <div className="rounded-2xl border border-white/8 bg-white/[.02] p-4 text-[12px] text-[var(--muted)]">
              <p className="font-medium text-[var(--text)]">Setup (dev only)</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                <li>
                  Create a token at{" "}
                  <a
                    href="https://supabase.com/dashboard/account/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-300 underline-offset-2 hover:underline"
                  >
                    Supabase → Account → Access Tokens
                  </a>
                </li>
                <li>
                  Add to <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[11px]">Tool/P0004-Tool-Hub/.env.local</code>:
                  <pre className="mt-1 overflow-x-auto rounded-md border border-white/5 bg-black/20 px-2 py-1.5 font-mono text-[11px] text-emerald-200/90">
                    SUPABASE_MANAGEMENT_TOKEN=sbp_…
                  </pre>
                </li>
                <li>Restart dev server (<code className="font-mono text-[11px]">pnpm dev</code>) and click Refresh.</li>
              </ol>
            </div>
          ) : null}
        </div>
      );
    }

    if (loading && !payload) {
      return (
        <div className="rounded-2xl border border-white/5 bg-white/[.02] p-10 text-center text-sm text-[var(--muted)]">
          Loading Supabase quota…
        </div>
      );
    }

    if (!payload) {
      return (
        <div className="rounded-2xl border border-white/5 bg-white/[.02] p-10 text-center text-sm text-[var(--muted)]">
          No data yet.
        </div>
      );
    }

    return (
      <div className="space-y-3 pb-8">
        <div className="rounded-xl border border-white/5 bg-white/[.02] px-3 py-2 text-[11px] text-[var(--muted)]">
          <span className="font-mono">{subtitle}</span>
        </div>

        {projectsFiltered.some((p) => parseProjectRestriction(p).restricted) ? (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100">
            <AlertTriangle size={compactIconSize(16)} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Services restricted.</span> One or more projects cannot serve requests due to
              quota violations (e.g. exceed egress quota). Open project details or Supabase Dashboard to upgrade billing.
            </div>
          </div>
        ) : null}

        <OrgQuotaTable organizations={organizations} />

        <HubLikeDataSectionRule label="Projects" />

        {viewMode === "card" ? (
          projectsFiltered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projectsFiltered.map((p) => (
                <SupabaseProjectCard
                  key={`${p.orgSlug}-${p.projectRef}`}
                  project={p}
                  org={organizations.find((o) => o.slug === p.orgSlug) ?? null}
                  onOpen={openProject}
                />
              ))}
            </div>
          )
        ) : (
          <ProjectTable rows={projectsFiltered} orgs={organizations} onOpen={openProject} />
        )}
      </div>
    );
  }, [error, loading, payload, organizations, projectsFiltered, viewMode, subtitle, openProject]);

  return (
    <>
      <SystemHubShell
      placeholder="Search Supabase by org, project, ref, plan, region..."
      filters={filters}
      query={query}
      onQueryChange={setQuery}
      values={filterValues}
      onValuesChange={setFilterValues}
      toolbar={toolbar}
      kpiItems={kpiItems}
      charts={chartsNode}
    >
      {body}
    </SystemHubShell>
      <SupabaseProjectDetailModal project={modalProject} org={modalOrg} onClose={closeModal} />
    </>
  );
}
