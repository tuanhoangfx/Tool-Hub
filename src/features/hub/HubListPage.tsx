import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Boxes, Radio } from "lucide-react";
import { resolveHubKpiIcon } from "../../lib/badge-registry";
import {
  HubResultCount,
  HubRowLimitSelect,
  HubTimeRangeSelect,
  MiniBarChart,
  MiniDonut,
  ViewToggle,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
  type KpiTileData,
} from "../../components/sales-shell";
import { HubDirectoryScreen, useHubPageShortcuts } from "@tool-workspace/hub-ui";
import { useLocalHealth, useSupabaseQuotaVersion } from "../../hooks";
import { compactIconSize } from "../../lib/ui-scale";
import { formatLocalHealthPollInterval, resolveLocalHealthPollMs } from "../../lib/local-health-prefs";
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
import { HubListChromeHeader } from "./HubListChromeHeader";
import { HubToolCard } from "./HubToolCard";

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

  const chartsBand = hasCharts ? (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {visCharts.has("health_bar") ? <MiniBarChart title="By Health" items={charts.health.slice(0, 8)} /> : null}
      {visCharts.has("category_bar") ? <MiniBarChart title="By Category" items={charts.category.slice(0, 6)} /> : null}
      {visCharts.has("deploy_donut") ? <MiniDonut title="Deploy distribution" items={charts.deploy} /> : null}
      {visCharts.has("status_donut") ? <MiniDonut title="Status distribution" items={charts.status} /> : null}
    </div>
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
            <button
              type="button"
              disabled={checkingLocal || localUrls.length === 0}
              onClick={() => {
                setLocalHealthBusy(true);
                void recheckLocal().finally(() => setLocalHealthBusy(false));
              }}
              title={
                localHealthPollMs === null
                  ? "Check local dev servers now (background poll off — Settings)"
                  : `Check now · background poll ${formatLocalHealthPollInterval(prefs.localHealthPoll)}`
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
      </HubDirectoryScreen>

      <ToolDetailModal tool={modalTool} onClose={onCloseModal} onRefreshTool={onRefreshTool} />
    </>
  );
}
