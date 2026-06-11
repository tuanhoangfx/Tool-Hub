/**
 * Hub tool directory — HubDirectoryScreen parity (read-only-directory, useDirectoryTableSort,
 * HubFormFieldLabel, hub-users-empty).
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Boxes } from "lucide-react";
import { buildHubKpiItems } from "./hub-kpi-items";
import {
  type FilterDef,
  type FilterValues,
  type HubViewMode,
  type KpiTileData,
} from "../../components/sales-shell";
import {
  DirectorySearchToolbar,
  HUB_LINK_HEALTH_POLL_MS,
  HubDirectoryScreen,
  HubDirectoryBulkActionBar,
  HubPaginatedCardGrid,
  directoryChartBandNode,
  hubDirectoryListResetKey,
  useHubDirectorySelection,
  readHubDirectoryPinnedIds,
  resolveVisibleChartKeys,
  sortHubDirectoryPinnedFirst,
  toggleHubDirectoryPinnedId,
  compactIconSize,
  resolveVisibleKpiKeys,
} from "@tool-workspace/hub-ui";
import { useLocalHealth, useSupabaseQuotaVersion } from "../../hooks";
import { catalogReachabilityUrls } from "./catalog-reachability";

import { readHubListPrefs } from "../../lib/url-prefs";
import type { ResolvedTool } from "../../types";
import { ToolDetailModal } from "../overview/ToolDetailModal";
import {
  HubToolsDirectoryTable,
  sortHubTools,
  type HubTableSortKey,
} from "./HubToolsDirectoryTable";
import { filterHubTools, filterOptions, hubCharts, hubFiltersWithCounts, hubKpis } from "./hub-aggregates";
import {
  DEFAULT_HUB_CHART_KEYS,
  HUB_CHART_DEFS,
  DEFAULT_HUB_FILTER_KEYS,
  DEFAULT_HUB_HEADER_STAT_KEYS,
  DEFAULT_HUB_KPI_KEYS,
  HUB_KPI_DEFS,
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
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => readHubDirectoryPinnedIds("hub-tools"));
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

  const sortedFiltered = useMemo(() => {
    const sorted = sortHubTools(filtered, sortKey, sortDir);
    return sortHubDirectoryPinnedFirst(sorted, pinnedIds, (tool) => tool.id);
  }, [filtered, sortKey, sortDir, pinnedIds]);

  const handleTogglePin = (toolId: string) => {
    setPinnedIds(toggleHubDirectoryPinnedId("hub-tools", toolId));
  };

  const listResetKey = useMemo(
    () => hubDirectoryListResetKey(query, filterValues, sortKey, sortDir, prefs.range),
    [query, filterValues, sortKey, sortDir, prefs.range],
  );

  const {
    selectedIds,
    allVisibleSelected,
    toggleSelect: handleToggleSelect,
    toggleSelectAll: handleToggleSelectAll,
  } = useHubDirectorySelection(sortedFiltered, (tool) => tool.id);

  const handleSort = (key: HubTableSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const opts = useMemo(() => filterOptions(allTools), [allTools]);
  const charts = useMemo(() => hubCharts(filtered), [filtered]);
  const kpis = useMemo(() => hubKpis(filtered), [filtered]);

  const visKpi = resolveVisibleKpiKeys(prefs.kpi, DEFAULT_HUB_KPI_KEYS, HUB_KPI_DEFS);
  const visCharts = resolveVisibleChartKeys(prefs.charts, DEFAULT_HUB_CHART_KEYS, HUB_CHART_DEFS);
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
  const { state: linkHealth } = useLocalHealth(reachabilityUrls, HUB_LINK_HEALTH_POLL_MS);

  const modalTool = modalOpen ? filtered.find((t) => t.id === selectedId) ?? allTools.find((t) => t.id === selectedId) ?? null : null;

  const chartsBand = directoryChartBandNode({
    visCharts,
    defs: HUB_CHART_DEFS,
    data: {
      health_bar: charts.health,
      category_bar: charts.category,
      deploy_bar: charts.deploy,
      status_bar: charts.status,
    },
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
          <DirectorySearchToolbar
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            countIcon={Boxes}
            shown={sortedFiltered.length}
            total={allTools.length}
            countLabel="tools"
            refreshing={loadingAll}
            onRefresh={onRefresh}
            showRefresh={false}
            showTimeRange
            timeRange={prefs.range}
            showTablePageSize
          />
        }
        filterRowActions={
          <HubDirectoryBulkActionBar
            selectAll={
              viewMode === "card"
                ? {
                    visibleCount: sortedFiltered.length,
                    selectedCount: selectedIds.size,
                    allVisibleSelected,
                    onToggleSelectAll: handleToggleSelectAll,
                    noun: "tools",
                  }
                : null
            }
          />
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
          sortedFiltered.length === 0 ? null : (
            <HubPaginatedCardGrid
              items={sortedFiltered}
              resetKey={listResetKey}
              ariaLabel="Tools card pages"
            >
              {(pageTools) =>
                pageTools.map((tool) => (
                  <HubToolCard
                    key={tool.id}
                    tool={tool}
                    quotaVersion={quotaVersion}
                    pinned={pinnedIds.has(tool.id)}
                    selected={selectedIds.has(tool.id)}
                    onToggleSelect={handleToggleSelect}
                    onTogglePin={handleTogglePin}
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
            resetKey={listResetKey}
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
    </>
  );
}
