import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Boxes, Radio } from "lucide-react";
import { resolveHubKpiIcon } from "../../lib/badge-registry";
import {
  FilterBar,
  HubResultCount,
  HubRowLimitSelect,
  HubTimeRangeSelect,
  KpiStrip,
  MiniBarChart,
  MiniDonut,
  ViewToggle,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
  type KpiTileData,
} from "../../components/sales-shell";
import { useLocalHealth, useSupabaseQuotaVersion } from "../../hooks";
import { compactIconSize } from "../../lib/ui-scale";
import { resolveLocalHealthPollMs } from "../../lib/local-health-prefs";
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
} from "./hub-prefs";
import { HubStickyHeader } from "./HubStickyHeader";
import { HubToolCard } from "./HubToolCard";

function visibleSet(set: Set<string> | null, defaults: Set<string>) {
  return set ?? defaults;
}

/** Accent divider before card/table registry — easier to scan than a flat border. */
function HubDataSectionRule() {
  return (
    <div role="separator" className="relative py-5" aria-label="Tools list">
      <div
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-indigo-400/45 to-transparent shadow-[0_0_10px_rgba(99,102,241,0.2)]"
        aria-hidden
      />
      <div className="relative flex justify-center" aria-hidden>
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-[var(--bg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-300/90 shadow-[0_0_16px_rgba(99,102,241,0.12)]">
          <span className="h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
          Tools
          <span className="h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
        </span>
      </div>
    </div>
  );
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

  const visKpi = visibleSet(prefs.kpi, DEFAULT_HUB_KPI_KEYS);
  const visCharts = visibleSet(prefs.charts, DEFAULT_HUB_CHART_KEYS);
  const visFilterKeys = visibleSet(prefs.hubFilters, DEFAULT_HUB_FILTER_KEYS);
  const visHeaderStats = visibleSet(prefs.headerStats, DEFAULT_HUB_HEADER_STAT_KEYS);

  const kpiItems = useMemo(() => {
    const items: KpiTileData[] = [];
    if (visKpi.has("total")) {
      const m = resolveHubKpiIcon("total")!;
      items.push({ label: "Tools (shown)", value: kpis.total, icon: m.icon, tone: "indigo" });
    }
    if (visKpi.has("ready")) {
      const m = resolveHubKpiIcon("ready")!;
      items.push({ label: "Ready", value: kpis.ready, icon: m.icon, tone: "emerald" });
    }
    if (visKpi.has("releases")) {
      const m = resolveHubKpiIcon("releases")!;
      items.push({ label: "With release", value: kpis.releases, icon: m.icon, tone: "amber" });
    }
    if (visKpi.has("drift")) {
      const m = resolveHubKpiIcon("drift")!;
      items.push({ label: "Drift alerts", value: kpis.drift, icon: m.icon, tone: "rose" });
    }
    return items;
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

  const localUrls = useMemo(() => filtered.map((t) => t.localUrl).filter((u): u is string => Boolean(u)), [filtered]);
  const localHealthPollMs = useMemo(
    () => resolveLocalHealthPollMs(prefs.localHealthPoll),
    [prefs.localHealthPoll],
  );
  const { state: healthState, check: recheckLocal } = useLocalHealth(localUrls, localHealthPollMs);
  const quotaVersion = useSupabaseQuotaVersion();
  const [localHealthBusy, setLocalHealthBusy] = useState(false);
  const checkingLocal = localHealthBusy;

  const modalTool = modalOpen ? filtered.find((t) => t.id === selectedId) ?? allTools.find((t) => t.id === selectedId) ?? null : null;

  const hasCharts =
    visCharts.has("health_bar") ||
    visCharts.has("category_bar") ||
    visCharts.has("deploy_donut") ||
    visCharts.has("status_donut");
  const hasAnalytics = kpiItems.length > 0 || hasCharts;

  const searchPin = prefs.searchPin;
  const stackChrome = searchPin && prefs.headerPin;

  const hubBusy = loadingAll || scanningWorkspace;

  const handleRefreshSelected = () => {
    if (!onRefreshTool) return;
    for (const id of selectedIds) onRefreshTool(id);
  };

  const filterBar = (
    <FilterBar
      layout="hub"
      pinSticky={searchPin && !stackChrome}
      headerPinned={prefs.headerPin}
      embedded={stackChrome}
      placeholder="Search Hub by name, code, repo, tag..."
      filters={hubFilters}
      query={query}
      onQueryChange={setQuery}
      values={filterValues}
      onValuesChange={setFilterValues}
      toolbar={
        <>
          <HubTimeRangeSelect value={prefs.range} />
          <HubRowLimitSelect value={prefs.limit} />
          <ViewToggle value={viewMode} onChange={(v) => onViewModeChange(v)} />
          <HubResultCount icon={Boxes} shown={filtered.length} total={allTools.length} />
        </>
      }
      row2Actions={
        <>
          <button
            type="button"
            disabled={checkingLocal || localUrls.length === 0}
            onClick={() => {
              setLocalHealthBusy(true);
              void recheckLocal().finally(() => setLocalHealthBusy(false));
            }}
            title={
              localHealthPollMs === null
                ? "Recheck local dev servers (polling off — Settings → Local health poll)"
                : `Recheck local dev servers (auto every ${localHealthPollMs / 1000}s)`
            }
            className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Radio size={14} className={checkingLocal ? "animate-pulse" : ""} aria-hidden />
            Local health
          </button>
          <HubToolBulkActionBar
            hasSelection={selectedIds.size > 0}
            selectedCount={selectedIds.size}
            busy={hubBusy}
            onRefreshSelected={handleRefreshSelected}
            onSyncWorkspace={onRefresh}
          />
        </>
      }
    />
  );

  return (
    <div
      className="anim-fade relative"
      {...(searchPin ? { "data-search-pin": true } : {})}
      {...(prefs.headerPin ? { "data-header-pin": true } : {})}
    >
      {stackChrome ? (
        <div className="hub-chrome-sticky sticky top-0 z-40 -mx-6 border-b border-white/5 bg-[var(--bg)]">
          <HubStickyHeader
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
            pinSticky={false}
            dividerBelow={false}
            embedded
            actions={headerActions}
          />
          {filterBar}
        </div>
      ) : (
        <>
          <HubStickyHeader
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
            pinSticky={prefs.headerPin}
            dividerBelow={!searchPin}
            actions={headerActions}
          />
          {filterBar}
        </>
      )}

      {registryError ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          <AlertTriangle size={compactIconSize(16)} />
          {registryError}
        </div>
      ) : null}

      <div className="relative z-0">
      {hasAnalytics ? (
        <div className="mt-5 space-y-5">
          {kpiItems.length > 0 ? <KpiStrip items={kpiItems} /> : null}
          {hasCharts ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {visCharts.has("health_bar") ? <MiniBarChart title="By Health" items={charts.health.slice(0, 8)} /> : null}
              {visCharts.has("category_bar") ? <MiniBarChart title="By Category" items={charts.category.slice(0, 6)} /> : null}
              {visCharts.has("deploy_donut") ? <MiniDonut title="Deploy distribution" items={charts.deploy} /> : null}
              {visCharts.has("status_donut") ? <MiniDonut title="Status distribution" items={charts.status} /> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <HubDataSectionRule />

      <div className="space-y-3">
        {viewMode === "card" ? (
          filtered.length === 0 ? null : (
            <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((tool) => (
                <HubToolCard
                  key={tool.id}
                  tool={tool}
                  healthState={tool.localUrl ? healthState[tool.localUrl] : undefined}
                  quotaVersion={quotaVersion}
                  onOpen={onSelect}
                />
              ))}
            </div>
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
            onCopyPath={async (path) => {
              if (!path) return;
              try {
                await navigator.clipboard.writeText(path);
              } catch {
                /* ignore */
              }
            }}
            healthState={healthState}
          />
        )}
      </div>
      </div>

      <ToolDetailModal tool={modalTool} onClose={onCloseModal} onRefreshTool={onRefreshTool} />
    </div>
  );
}
