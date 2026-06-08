import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Boxes, Radio, RotateCcw } from "lucide-react";
import { buildHubKpiItems } from "./hub-kpi-items";
import {
  HubResultCount,
  HubRowLimitSelect,
  HubTimeRangeSelect,
  MiniBarChart,
  ViewToggle,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
  type KpiTileData,
} from "../../components/sales-shell";
import { HubDirectoryScreen, HubPaginatedCardGrid, useHubPageShortcuts } from "@tool-workspace/hub-ui";
import { useLocalHealth, useSupabaseQuotaVersion } from "../../hooks";
import { catalogReachabilityUrls } from "./catalog-reachability";
import { compactIconSize } from "../../lib/ui-scale";
import { readHubListPrefs } from "../../lib/url-prefs";
import type { ResolvedTool } from "../../types";
import { ToolDetailModal } from "../overview/ToolDetailModal";
import {
  HubToolsDirectoryTable,
  sortHubTools,
  type HubTableSortKey,
} from "./HubToolsDirectoryTable";
import { HubToolBulkActionBar } from "./HubToolBulkActionBar";
import { filterHubTools, filterOptions, hubCharts, hubFiltersWithCounts, hubKpis } from "./hub-aggregates";
import {
  DEFAULT_HUB_CHART_KEYS,
  DEFAULT_HUB_FILTER_KEYS,
  DEFAULT_HUB_HEADER_STAT_KEYS,
  DEFAULT_HUB_KPI_KEYS,
  HUB_KPI_DEFS,
} from "./hub-prefs";
import { HubListChromeHeader } from "./HubListChromeHeader";
import { HubToolCard } from "./HubToolCard";
import { resolveVisibleKpiKeys } from "@tool-workspace/hub-ui";

function visibleSet(set: Set<string> | null, defaults: Set<string>) {
  return set ?? defaults;
}

type HubListPageProps = {
  allTools: ResolvedTool[];
  selectedId: string;
  onSelect: (id: string) => void;
  modalOpen: boolean;
  onCloseModal: () => void;
  loadingAll: boolean;
  scanningWorkspace?: boolean;
  registryError: string | null;
  onRefresh: () => void;
  onRefreshTool?: (toolId: string) => void;
  viewMode: HubViewMode;
  onViewModeChange: (mode: HubViewMode) => void;
  registryLive: boolean;
  registryLabel: string;
  versionReleaseDate: string;
  versionReleaseLive: boolean;
  headerActions?: ReactNode;
};

export function HubListPage({
  allTools,
  selectedId,
  onSelect,
  modalOpen,
  onCloseModal,
  loadingAll,
  scanningWorkspace = false,
  registryError,
  onRefresh,
  onRefreshTool,
  viewMode,
  onViewModeChange,
  registryLive,
  registryLabel,
  versionReleaseDate,
  versionReleaseLive,
  headerActions,
}: HubListPageProps) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [sortKey, setSortKey] = useState<HubTableSortKey>("code");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const sync = () => setPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const filtered = useMemo(
    () => filterHubTools(allTools, query, filterValues, prefs.range),
    [allTools, query, filterValues, prefs.range],
  );

  const sortedFiltered = useMemo(
    () => sortHubTools(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );

  const allVisibleSelected =
    sortedFiltered.length > 0 && sortedFiltered.every((tool) => selectedIds.has(tool.id));

  const handleSort = (key: HubTableSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleToggleSelect = (toolId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const tool of sortedFiltered) next.delete(tool.id);
        return next;
      }
      const next = new Set(prev);
      for (const tool of sortedFiltered) next.add(tool.id);
      return next;
    });
  };

  const opts = useMemo(() => filterOptions(allTools), [allTools]);
  const charts = useMemo(() => hubCharts(filtered), [filtered]);
  const kpis = useMemo(() => hubKpis(filtered), [filtered]);

  const visKpi = resolveVisibleKpiKeys(prefs.kpi, DEFAULT_HUB_KPI_KEYS, HUB_KPI_DEFS);
  const visCharts = visibleSet(prefs.charts, DEFAULT_HUB_CHART_KEYS);
  const visFilterKeys = visibleSet(prefs.hubFilters, DEFAULT_HUB_FILTER_KEYS);
  const visHeaderStats = visibleSet(prefs.headerStats, DEFAULT_HUB_HEADER_STAT_KEYS);

  const kpiItems = useMemo(() => {
    return buildHubKpiItems(kpis).filter((item) => !item.prefKey || visKpi.has(item.prefKey));
  }, [kpis, visKpi]);

  const hubFiltersBase = useMemo(() => {
    const defs: FilterDef[] = [];
    if (visFilterKeys.has("health")) {
      defs.push({ key: "health", label: "Health", options: opts.health, showAllLabel: true });
    }
    if (visFilterKeys.has("category")) {
      defs.push({ key: "category", label: "Category", options: opts.category, showAllLabel: true });
    }
    if (visFilterKeys.has("deploy")) {
      defs.push({ key: "deploy", label: "Deploy", options: opts.deploy, showAllLabel: true });
    }
    if (visFilterKeys.has("status")) {
      defs.push({ key: "status", label: "Status", options: opts.status, showAllLabel: true });
    }
    if (visFilterKeys.has("drift")) {
      defs.push({ key: "drift", label: "Drift", options: opts.drift, showAllLabel: true });
    }
    if (visFilterKeys.has("links")) {
      defs.push({ key: "links", label: "Manifest links", options: opts.links, showAllLabel: true });
    }
    return defs;
  }, [opts, visFilterKeys]);

  const hubFilters = useMemo(
    () => hubFiltersWithCounts(allTools, hubFiltersBase, query, filterValues, prefs.range),
    [allTools, hubFiltersBase, query, filterValues, prefs.range],
  );

  const quotaVersion = useSupabaseQuotaVersion();
  const reachabilityUrls = useMemo(() => catalogReachabilityUrls(allTools), [allTools]);
  const { state: linkHealth, check: checkReachability } = useLocalHealth(reachabilityUrls, null);
  const reachabilityChecking = reachabilityUrls.some((u) => linkHealth[u] === "checking");
  const reachabilityOnline = reachabilityUrls.filter((u) => linkHealth[u] === "online").length;
  const [hubRecoverBusy, setHubRecoverBusy] = useState(false);
  const [devToast, setDevToast] = useState<{ message: string; tone: "ok" | "err" } | null>(null);

  function showDevToast(message: string, tone: "ok" | "err" = "ok") {
    setDevToast({ message, tone });
    window.setTimeout(() => setDevToast(null), 8_000);
  }

  async function recoverHubDev() {
    setHubRecoverBusy(true);
    try {
      const res = await fetch("/api/hub-dev/recover", { method: "POST" });
      const body = (await res.json()) as { ok?: boolean; message?: string };
      showDevToast(body.message ?? (body.ok ? "Restarting Hub dev server…" : "Recover failed"), body.ok ? "ok" : "err");
      window.setTimeout(() => window.location.reload(), 12_000);
    } catch {
      showDevToast("Recover failed. Run: corepack pnpm dev:recover in P0004-Tool-Hub", "err");
    } finally {
      setHubRecoverBusy(false);
    }
  }

  const modalTool = modalOpen ? filtered.find((t) => t.id === selectedId) ?? allTools.find((t) => t.id === selectedId) ?? null : null;

  const hasCharts =
    visCharts.has("health_bar") ||
    visCharts.has("category_bar") ||
    visCharts.has("deploy_bar") ||
    visCharts.has("status_bar");

  const chartsBand = hasCharts ? (
    <>
      {visCharts.has("health_bar") ? <MiniBarChart title="By Health" items={charts.health} /> : null}
      {visCharts.has("category_bar") ? <MiniBarChart title="By Category" items={charts.category} /> : null}
      {visCharts.has("deploy_bar") ? <MiniBarChart title="Deploy distribution" items={charts.deploy} /> : null}
      {visCharts.has("status_bar") ? <MiniBarChart title="Status distribution" items={charts.status} /> : null}
    </>
  ) : undefined;

  const hubBusy = loadingAll || scanningWorkspace;

  const handleRefreshSelected = () => {
    if (!onRefreshTool) return;
    for (const id of selectedIds) onRefreshTool(id);
  };

  const hasSelection = selectedIds.size > 0;

  useHubPageShortcuts("library", {
    onEdit: handleRefreshSelected,
    canEdit: () => hasSelection && Boolean(onRefreshTool),
  });

  return (
    <>
      <HubDirectoryScreen
        header={
          <HubListChromeHeader
            registryLive={registryLive}
            registryLabel={registryLabel}
            versionReleaseDate={versionReleaseDate}
            versionReleaseLive={versionReleaseLive}
            visibleHeaderStats={visHeaderStats}
            kpi={{
              ready: kpis.ready,
              drift: kpis.drift,
              releases: kpis.releases,
              linkGaps: kpis.linkGaps,
            }}
            actions={headerActions}
          />
        }
        filters={hubFilters}
        query={query}
        onQueryChange={setQuery}
        filterValues={filterValues}
        onFilterValuesChange={setFilterValues}
        filterPlaceholder="Search Hub by name, code, repo, tag..."
        filterShortcutScope="library"
        filterToolbar={
          <>
            <HubTimeRangeSelect value={prefs.range} />
            <HubRowLimitSelect value={prefs.limit} />
            <ViewToggle value={viewMode} onChange={(v) => onViewModeChange(v)} />
            <HubResultCount icon={Boxes} shown={filtered.length} total={allTools.length} />
          </>
        }
        filterRowActions={
          <>
            {reachabilityUrls.length > 0 ? (
              <button
                type="button"
                disabled={reachabilityChecking}
                onClick={() => void checkReachability()}
                title={`Probe local dev + production URLs (${reachabilityUrls.length} targets). No auto poll.`}
                className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-[var(--muted)] transition-colors hover:bg-white/10 hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Radio size={14} className={reachabilityChecking ? "animate-pulse text-cyan-300" : ""} aria-hidden />
                {reachabilityChecking
                  ? "Checking links…"
                  : Object.keys(linkHealth).length > 0
                    ? `Links ${reachabilityOnline}/${reachabilityUrls.length}`
                    : "Check links"}
              </button>
            ) : null}
            {import.meta.env.DEV ? (
              <button
                type="button"
                disabled={hubRecoverBusy}
                onClick={() => void recoverHubDev()}
                title="Kill port 5176, clear Vite cache, restart Hub dev (fixes esbuild crash overlay)"
                className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-[var(--muted)] transition-colors hover:bg-white/10 hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw size={14} className={hubRecoverBusy ? "animate-spin" : ""} aria-hidden />
                Restart Hub dev
              </button>
            ) : null}
            <HubToolBulkActionBar
              hasSelection={selectedIds.size > 0}
              selectedCount={selectedIds.size}
              busy={hubBusy}
              onRefreshSelected={handleRefreshSelected}
              onSyncWorkspace={onRefresh}
            />
          </>
        }
        kpis={kpiItems.length > 0 ? kpiItems : undefined}
        charts={chartsBand}
        sectionRuleLabel="Tools"
      >
        {registryError ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            <AlertTriangle size={compactIconSize(16)} />
            {registryError}
          </div>
        ) : null}

        {viewMode === "card" ? (
          filtered.length === 0 ? null : (
            <HubPaginatedCardGrid
              items={filtered}
              resetKey={`${query}|${JSON.stringify(filterValues)}|${sortKey}|${sortDir}`}
              ariaLabel="Tools card pages"
            >
              {(pageTools) =>
                pageTools.map((tool) => (
                  <HubToolCard
                    key={tool.id}
                    tool={tool}
                    quotaVersion={quotaVersion}
                    onOpen={onSelect}
                    linkHealth={linkHealth}
                  />
                ))
              }
            </HubPaginatedCardGrid>
          )
        ) : sortedFiltered.length === 0 ? null : (
          <HubToolsDirectoryTable
            tools={sortedFiltered}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            allVisibleSelected={allVisibleSelected}
            detailToolId={modalOpen ? selectedId : null}
            onSelect={onSelect}
            linkHealth={linkHealth}
            onCopyPath={async (path) => {
              if (!path) return;
              try {
                await navigator.clipboard.writeText(path);
              } catch {
                /* ignore */
              }
            }}
          />
        )}
      </HubDirectoryScreen>

      <ToolDetailModal tool={modalTool} onClose={onCloseModal} onRefreshTool={onRefreshTool} />

      {devToast ? (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 z-[3000] max-w-md -translate-x-1/2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg shadow-black/40 ${
            devToast.tone === "ok"
              ? "border-emerald-400/40 bg-emerald-950/95 text-emerald-100"
              : "border-amber-400/40 bg-amber-950/95 text-amber-100"
          }`}
        >
          {devToast.message}
        </div>
      ) : null}
    </>
  );
}
