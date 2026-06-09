import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, LayoutGrid, RefreshCcw } from "lucide-react";
import { HubPaginatedCardGrid, HubPaginatedTableShell, semanticKpiIcon } from "@tool-workspace/hub-ui";
import { SUPABASE_QUOTA_REFRESH_EVENT } from "./supabase-quota-events";
import {
  HubResultCount,
  MiniBarChart,
  ViewToggle,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
} from "../../components/sales-shell";
import { EmptyState } from "../../components/EmptyState";
import { RegionInline } from "../../components/RegionFlagBadge";
import { compactIconSize } from "../../lib/ui-scale";
import { regionChartLabel, resolveRegionMeta } from "../../lib/supabase-region";
import { useSessionState } from "../../hooks";
import { SystemHubShell } from "./SystemHubShell";
import { SupabaseProjectCard } from "./SupabaseProjectCard";
import { SupabaseProjectDetailModal } from "./SupabaseProjectDetailModal";
import type { OrgRow, ProjectRow, QuotaPayload } from "./SystemSupabaseQuotaPanel.types";
import { QuotaPayloadSchema } from "./supabase-quota-schema";
import { SupabaseWorkspaceMapSchema } from "./supabase-workspace-schema";
import { quotaFiltersWithCounts } from "./supabase-quota-filters";
import {
  formatBytes,
  formatCompact,
  parseProjectInfra,
  parseProjectRestriction,
  parseProjectUsage,
  effectivePlanLabel,
  resolvePlanDisplay,
  resolveProjectHealthLabel,
  sumFilteredUsage,
} from "./supabase-quota-metrics";
import { readSupabaseQuotaStaleCache, writeSupabaseQuotaClientCache } from "./supabase-quota-client-cache";
import { mergeQuotaPayloadPatches } from "./supabase-quota-merge";
import { resolveProjectMetricsSource } from "./supabase-project-metrics-source";

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

/** Server `X-Cache` status — dot + tooltip instead of raw HIT/MISS text. */
function CacheStatusDot({ status }: { status: string | null }) {
  if (!status) return null;

  const meta: Record<string, { dotClass: string; title: string }> = {
    HIT: {
      dotClass: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]",
      title: "Cached (HIT) — served from server memory (~2 min), no new Supabase API calls",
    },
    MISS: {
      dotClass: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.65)]",
      title: "Fresh (MISS) — just fetched from Supabase Management API",
    },
    COALESCED: {
      dotClass: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.65)]",
      title: "Shared (COALESCED) — joined an in-flight fetch already running",
    },
    FAST: {
      dotClass: "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.65)]",
      title: "Catalog snapshot — metadata only",
    },
    PRIORITY: {
      dotClass: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.65)]",
      title: "Priority — live metrics for selected project(s)",
    },
  };

  const m = meta[status] ?? {
    dotClass: "bg-white/45",
    title: `Cache: ${status}`,
  };

  return (
    <span
      className="inline-flex shrink-0 items-center"
      title={m.title}
      aria-label={m.title}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dotClass}`} />
    </span>
  );
}

function normLabel(v: string | null | undefined) {
  const t = (v ?? "").trim();
  return t ? t : "—";
}

import { resolveProjectToolCodes } from "./supabase-project-tools";
import { SupabaseProjectToolBadges } from "./SupabaseProjectToolBadges";
import { SupabaseMetricsSourceBadge } from "./SupabaseMetricsSourceBadge";

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

function orgForProject(orgs: OrgRow[], p: ProjectRow) {
  return orgs.find((o) => o.slug === p.orgSlug) ?? null;
}

const PROJECT_TABLE_COLUMNS = [
  "Org",
  "Owner",
  "Project",
  "Tools",
  "Region",
  "Org plan",
  "Project plan",
  "Metrics",
  "Health",
  "API total",
  "REST/min",
  "Stor/min",
  "DB disk",
  "Notes",
] as const;

function ProjectTable({ rows, orgs, onOpen }: { rows: ProjectRow[]; orgs: OrgRow[]; onOpen: (ref: string) => void }) {
  return (
    <HubPaginatedTableShell items={rows} ariaLabel="Supabase projects table pages">
      {(pageRows) => (
    <div className="hub-users-table-wrap overflow-x-auto">
      <table className="hub-users-table hub-users-table--wide min-w-[1100px]">
          <thead>
            <tr>
              {PROJECT_TABLE_COLUMNS.map((label) => (
                <th key={label} scope="col">
                  <span className="hub-users-th-text">{label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => {
              const org = orgForProject(orgs, p);
              const plans = resolvePlanDisplay(p, org);
              const orgPlanLabel = normLabel(plans.orgPlan);
              const projectPlanLabel = normLabel(plans.projectPlan);
              const tone = toneForPlan(plans.orgPlan ?? plans.projectPlan);
              const usage = parseProjectUsage(p);
              const infra = parseProjectInfra(p);
              const restriction = parseProjectRestriction(p);
              const metricsSource = resolveProjectMetricsSource(p);
              const statusLabel = resolveProjectHealthLabel(p);
              const statusTone = restriction.restricted ? "rose" : statusLabel === "Live" || statusLabel === "Healthy" ? "emerald" : "amber";
              const tools = resolveProjectToolCodes(p);
              return (
                <tr
                  key={`${p.orgSlug}-${p.projectRef}-${p.projectName}`}
                  className={`hub-users-row ${restriction.restricted ? "bg-rose-500/[.03]" : ""}`}
                  onClick={() => p.projectRef && onOpen(p.projectRef)}
                >
                  <td className="align-top font-mono text-[11px] text-indigo-200/90">{p.orgSlug}</td>
                  <td className="align-top text-[11px] text-[var(--muted)]">{normLabel(p.ownerEmail)}</td>
                  <td className="align-top font-medium text-[var(--text)]">{p.projectName}</td>
                  <td className="align-top" onClick={(e) => e.stopPropagation()}>
                    <SupabaseProjectToolBadges tools={tools} bindings={p.toolBindings} maxVisible={3} />
                  </td>
                  <td className="align-top text-[11px] text-[var(--muted)]">
                    <RegionInline region={p.region} />
                  </td>
                  <td className="align-top">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        tone === "indigo"
                          ? "border-indigo-500/25 bg-indigo-500/10 text-indigo-200"
                          : tone === "amber"
                            ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
                            : "border-white/10 bg-white/5 text-[var(--muted)]"
                      }`}
                    >
                      {orgPlanLabel}
                    </span>
                  </td>
                  <td className="align-top">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                      {projectPlanLabel}
                    </span>
                  </td>
                  <td className="align-top">
                    <SupabaseMetricsSourceBadge source={metricsSource} variant="pill" />
                  </td>
                  <td className="align-top">
                    {metricsSource === "live" ? (
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
                    ) : (
                      <span className="text-[11px] text-[var(--muted)]">—</span>
                    )}
                  </td>
                  <td className="align-top font-mono text-[11px] text-[var(--text)]">
                    {usage.apiRequestsTotal == null ? "—" : formatCompact(usage.apiRequestsTotal)}
                  </td>
                  <td className="align-top font-mono text-[11px] text-[var(--muted)]">
                    {usage.restLatest ?? "—"}
                  </td>
                  <td className="align-top font-mono text-[11px] text-[var(--muted)]">
                    {usage.storageLatest ?? "—"}
                  </td>
                  <td className="align-top font-mono text-[11px] text-[var(--muted)]">
                    {infra.diskUsedBytes == null ? "—" : formatBytes(infra.diskUsedBytes)}
                  </td>
                  <td className="align-top text-[11px] text-[var(--muted)]">
                    {p.error ? <span className="text-rose-200">{p.error}</span> : <span className="text-[var(--muted)]/60">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
    </div>
      )}
    </HubPaginatedTableShell>
  );
}

export function SystemSupabaseQuotaPanel() {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:supabase-quota:viewMode", "card");

  const [payload, setPayload] = useState<QuotaPayload | null>(() => readSupabaseQuotaStaleCache());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheHint, setCacheHint] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [toolCodesByRef, setToolCodesByRef] = useState<Record<string, string[]>>({});

  const FETCH_TIMEOUT_MS = 90_000;
  const fetchInFlightRef = useRef(false);
  const priorityInFlightRef = useRef<string | null>(null);

  const loadWorkspaceMap = useCallback(async (forceRefresh = false) => {
    try {
      const r = await fetch(`/api/supabase/workspace-map${forceRefresh ? "?refresh=1" : ""}`);
      const map = SupabaseWorkspaceMapSchema.parse(await r.json());
      const next: Record<string, string[]> = {};
      for (const p of map.projects) {
        next[p.ref] = [...new Set(p.bindings.map((b) => b.toolCode))];
      }
      setToolCodesByRef(next);
    } catch {
      /* optional */
    }
  }, []);

  const fetchData = useCallback(
    async (forceRefresh: boolean) => {
      if (fetchInFlightRef.current && !forceRefresh) return;
      fetchInFlightRef.current = true;
      setRefreshing(true);
      setError(null);

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const { signal } = controller;

      const runFast = async () => {
        try {
          const fastR = await fetch("/api/supabase/quota?fast=1", { signal });
          setCacheHint(fastR.headers.get("X-Cache"));
          const fastData = QuotaPayloadSchema.parse(await fastR.json());
          if (fastData.ok) {
            setPayload((prev) => prev ?? fastData);
            writeSupabaseQuotaClientCache(fastData);
          }
        } catch {
          /* catalog optional if full fetch succeeds */
        }
      };

      void runFast();

      try {
        const [r] = await Promise.all([
          fetch(`/api/supabase/quota${forceRefresh ? "?refresh=1" : ""}`, { method: "GET", signal }),
          loadWorkspaceMap(forceRefresh),
        ]);
        window.clearTimeout(timer);
        setCacheHint(r.headers.get("X-Cache"));
        const data = QuotaPayloadSchema.parse(await r.json());
        if (!data.ok) throw new Error(data.error || "Supabase quota fetch failed");
        setPayload({ ...data, metricsPhase: data.metricsPhase ?? "live" });
        writeSupabaseQuotaClientCache(data);
      } catch (e) {
        const stale = readSupabaseQuotaStaleCache();
        const showError = forceRefresh || stale == null;
        if (e instanceof Error && e.name === "AbortError") {
          if (showError) {
            setError(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s. Dev server running? Click Refresh to retry.`);
          }
        } else if (showError) {
          if (!stale) setPayload(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        window.clearTimeout(timer);
        fetchInFlightRef.current = false;
        setRefreshing(false);
      }
    },
    [loadWorkspaceMap],
  );

  const fetchPriorityMetrics = useCallback(async (refs: string[]) => {
    const unique = [...new Set(refs.map((r) => r.trim()).filter(Boolean))];
    if (!unique.length) return;

    const refKey = unique.join(",");
    if (priorityInFlightRef.current === refKey) return;
    priorityInFlightRef.current = refKey;

    try {
      const r = await fetch(`/api/supabase/quota?refs=${unique.map(encodeURIComponent).join(",")}`);
      const data = QuotaPayloadSchema.parse(await r.json());
      const patches = data.projects ?? [];
      if (!data.ok || !patches.length) return;

      setPayload((prev) => {
        if (!prev) return prev;
        const merged = mergeQuotaPayloadPatches(prev, {
          projects: patches,
          organizations: data.organizations ?? [],
        });
        writeSupabaseQuotaClientCache(merged);
        return merged;
      });
    } catch {
      /* optional */
    } finally {
      if (priorityInFlightRef.current === refKey) priorityInFlightRef.current = null;
    }
  }, []);

  useEffect(() => {
    void fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / panel visit
  }, []);

  useEffect(() => {
    const onSidebarRefresh = () => void fetchData(true);
    window.addEventListener(SUPABASE_QUOTA_REFRESH_EVENT, onSidebarRefresh);
    return () => window.removeEventListener(SUPABASE_QUOTA_REFRESH_EVENT, onSidebarRefresh);
  }, [fetchData]);

  useEffect(() => {
    void loadWorkspaceMap(false);
  }, [loadWorkspaceMap]);

  const organizations: OrgRow[] = payload?.organizations ?? [];
  const projectsRaw: ProjectRow[] = payload?.projects ?? [];

  useEffect(() => {
    if (!selectedRef) return;
    const row = projectsRaw.find((p) => p.projectRef === selectedRef);
    if (row && resolveProjectMetricsSource(row) === "live") return;
    void fetchPriorityMetrics([selectedRef]);
  }, [selectedRef, projectsRaw, fetchPriorityMetrics]);

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
    return values.map((v) => {
      const meta = resolveRegionMeta(v === "—" ? null : v);
      return { value: v, label: meta.region === "—" ? v : `${meta.label} (${meta.region})` };
    });
  }, [projectsRaw]);

  const planOptions = useMemo(() => {
    const values = uniq(
      projectsRaw.map((p) => normLabel(effectivePlanLabel(p, organizations.find((o) => o.slug === p.orgSlug)))),
    ).sort((a, b) => a.localeCompare(b));
    return values.map((v) => ({ value: v, label: v }));
  }, [projectsRaw, organizations]);

  const ownerOptions = useMemo(() => {
    const values = uniq(projectsRaw.map((p) => normLabel(p.ownerEmail))).sort((a, b) => a.localeCompare(b));
    return values.map((v) => ({ value: v, label: v }));
  }, [projectsRaw]);

  const toolOptions = useMemo(() => {
    const values = uniq(projectsRaw.flatMap((p) => resolveProjectToolCodes(p, toolCodesByRef))).sort((a, b) =>
      a.localeCompare(b),
    );
    return values.map((v) => ({ value: v, label: v }));
  }, [projectsRaw, toolCodesByRef]);

  const filtersBase = useMemo((): FilterDef[] => {
    return [
      { key: "org", label: "Org", options: orgOptions, showAllLabel: true },
      { key: "owner", label: "Owner", options: ownerOptions, showAllLabel: true },
      { key: "tool", label: "Tool", options: toolOptions, showAllLabel: true },
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
  }, [orgOptions, ownerOptions, toolOptions, planOptions, regionOptions]);

  const filters = useMemo(
    () =>
      quotaFiltersWithCounts(projectsRaw, organizations, filtersBase, query, filterValues, (p) =>
        resolveProjectToolCodes(p, toolCodesByRef),
      ),
    [projectsRaw, organizations, filtersBase, query, filterValues, toolCodesByRef],
  );

  const projectsFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const orgPick = filterValues.org;
    const ownerPick = filterValues.owner;
    const toolPick = filterValues.tool;
    const regionPick = filterValues.region;
    const planPick = filterValues.plan;
    const healthPick = filterValues.health?.[0] as "ok" | "restricted" | "unhealthy" | "error" | undefined;

    return projectsRaw.filter((p) => {
      if (orgPick?.length && !orgPick.includes(p.orgSlug)) return false;
      if (ownerPick?.length && !ownerPick.includes(normLabel(p.ownerEmail))) return false;
      if (toolPick?.length) {
        const tools = resolveProjectToolCodes(p, toolCodesByRef);
        if (!toolPick.some((t) => tools.includes(t))) return false;
      }
      if (regionPick?.length && !regionPick.includes(normLabel(p.region))) return false;
      if (planPick?.length && !planPick.includes(normLabel(effectivePlanLabel(p, organizations.find((o) => o.slug === p.orgSlug)))))
        return false;
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
        p.ownerEmail,
        p.accountId,
        p.region,
        resolveProjectToolCodes(p, toolCodesByRef).join(" "),
        p.plan,
        p.orgPlan,
        effectivePlanLabel(p, organizations.find((o) => o.slug === p.orgSlug)),
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
  }, [
    projectsRaw,
    organizations,
    query,
    toolCodesByRef,
    filterValues.org,
    filterValues.owner,
    filterValues.tool,
    filterValues.plan,
    filterValues.region,
    filterValues.health,
  ]);

  const kpis = useMemo(() => {
    const orgsShown = new Set(projectsFiltered.map((p) => p.orgSlug)).size;
    const errors = projectsFiltered.filter((p) => Boolean(p.error)).length;
    const restricted = projectsFiltered.filter((p) => parseProjectRestriction(p).restricted).length;
    const catalogOnly = projectsFiltered.filter((p) => resolveProjectMetricsSource(p) === "catalog").length;
    const withMetrics = projectsFiltered.filter((p) => resolveProjectMetricsSource(p) === "live").length;
    return { total: projectsFiltered.length, orgs: orgsShown, errors, restricted, catalogOnly, withMetrics };
  }, [projectsFiltered]);

  const usageSum = useMemo(() => sumFilteredUsage(projectsFiltered), [projectsFiltered]);

  const charts = useMemo(() => {
    return {
      byRegion: breakdown(projectsFiltered.map((p) => regionChartLabel(p.region))),
      byPlan: breakdown(projectsFiltered.map((p) => effectivePlanLabel(p, organizations.find((o) => o.slug === p.orgSlug)))),
    };
  }, [projectsFiltered, organizations]);

  const kpiItems = useMemo(
    () => [
      { prefKey: "total", label: "Projects (shown)", value: kpis.total, ...semanticKpiIcon("kpi.total") },
      { prefKey: "metrics", label: "Live metrics", value: kpis.withMetrics, ...semanticKpiIcon("kpi.live") },
      { prefKey: "catalog", label: "Catalog only", value: kpis.catalogOnly, ...semanticKpiIcon("kpi.catalog") },
      { prefKey: "orgs", label: "Organizations", value: kpis.orgs, ...semanticKpiIcon("kpi.orgs") },
      { prefKey: "errors", label: "Errors", value: kpis.errors, ...semanticKpiIcon("kpi.errors") },
      {
        prefKey: "restricted",
        label: "Restricted",
        value: kpis.restricted,
        ...semanticKpiIcon("kpi.restricted"),
      },
      {
        prefKey: "api_total",
        label: "API requests (sum)",
        value: usageSum.apiRequestsTotal > 0 ? formatCompact(usageSum.apiRequestsTotal) : "—",
        ...semanticKpiIcon("kpi.apiTotal"),
      },
      {
        prefKey: "api_rest",
        label: "REST / min (sum)",
        value: usageSum.restLatest > 0 ? formatCompact(usageSum.restLatest) : "—",
        ...semanticKpiIcon("kpi.apiRest"),
      },
    ],
    [kpis, usageSum],
  );

  const toolbar = useMemo(() => {
    return (
      <>
        <ViewToggle value={viewMode} onChange={setViewMode} />
        <button
          type="button"
          onClick={() => void fetchData(true)}
          disabled={refreshing}
          className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-[var(--panel-2)] px-3 text-xs text-[var(--text)] hover:bg-white/5 disabled:opacity-50"
          title="Force refresh (bypass server cache)"
        >
          <RefreshCcw size={compactIconSize(12)} className={refreshing ? "anim-spin" : ""} />
          {refreshing && payload ? "Updating…" : "Refresh"}
          <CacheStatusDot status={cacheHint} />
        </button>
        <HubResultCount icon={LayoutGrid} shown={projectsFiltered.length} total={projectsRaw.length} label="projects" />
      </>
    );
  }, [viewMode, setViewMode, fetchData, refreshing, payload, projectsFiltered.length, projectsRaw.length, cacheHint]);

  const chartSlots = useMemo(() => {
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
    return {
      category_bar: <MiniBarChart title="By region" items={regionItems} />,
      health_bar: <MiniBarChart title="By plan" items={planItems} />,
    };
  }, [charts.byPlan, charts.byRegion]);

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
                  Add to <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[11px]">E:\Dev\.env.shared</code>{" "}
                  (copy from <code className="font-mono text-[11px]">.env.shared.example</code>):
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

    if (!payload) {
      return (
        <div className="rounded-2xl border border-white/5 bg-white/[.02] p-10 text-center text-sm text-[var(--muted)]">
          {refreshing ? "Loading projects in background…" : "No data yet. Click Refresh or wait for background load."}
        </div>
      );
    }

    return (
      <div className={`relative space-y-3 transition-opacity ${refreshing ? "opacity-85" : ""}`}>
        {viewMode === "card" ? (
          projectsFiltered.length === 0 ? (
            <EmptyState />
          ) : (
            <HubPaginatedCardGrid
              items={projectsFiltered}
              resetKey={`${query}|${JSON.stringify(filterValues)}`}
              ariaLabel="Supabase projects card pages"
            >
              {(pageProjects) =>
                pageProjects.map((p) => (
                  <SupabaseProjectCard
                    key={`${p.orgSlug}-${p.projectRef}`}
                    project={p}
                    org={organizations.find((o) => o.slug === p.orgSlug) ?? null}
                    tools={resolveProjectToolCodes(p, toolCodesByRef)}
                    onOpen={openProject}
                  />
                ))
              }
            </HubPaginatedCardGrid>
          )
        ) : (
          <ProjectTable rows={projectsFiltered} orgs={organizations} onOpen={openProject} />
        )}
      </div>
    );
  }, [error, refreshing, payload, organizations, projectsFiltered, viewMode, openProject, toolCodesByRef]);

  return (
    <>
      <SystemHubShell
        tabId="supabase-quota"
        sectionRuleLabel="Projects"
        placeholder="Search Supabase by org, owner, tool, project, ref, plan, region..."
        filters={filters}
        query={query}
        onQueryChange={setQuery}
        values={filterValues}
        onValuesChange={setFilterValues}
        toolbar={toolbar}
        kpiItems={kpiItems}
        chartSlots={chartSlots}
      >
        {body}
      </SystemHubShell>
      <SupabaseProjectDetailModal
        project={modalProject}
        org={modalOrg}
        tools={modalProject ? resolveProjectToolCodes(modalProject, toolCodesByRef) : []}
        onClose={closeModal}
      />
    </>
  );
}
