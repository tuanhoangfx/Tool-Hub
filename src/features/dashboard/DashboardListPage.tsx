/** Dashboard screen registry — DirectorySearchToolbar + ViewToggle card/table toggle. */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LayoutGrid } from "lucide-react";
import {
  DirectorySearchToolbar,
  HubDirectoryScreen,
  HubPaginatedCardGrid,
  directoryChartBandNode,
  hubDirectoryListResetKey,
  resolveVisibleChartKeys,
  HubDirectoryBulkActionBar,
  resolveVisibleKpiKeys,
  useDirectoryTableSort,
  useHubPageShortcuts,
} from "@tool-workspace/hub-ui";
import {
  type FilterDef,
  type FilterValues,
  type HubViewMode,
} from "../../components/sales-shell";
import { useSessionState } from "../../hooks/useSessionState";
import { readHubListPrefs } from "../../lib/url-prefs";
import type { ResolvedTool } from "../../types";
import { buildDashboardKpiItems } from "./dashboard-kpi-items";
import { enrichDashboardRegistryMeta } from "./dashboard-runtime-meta";
import { DashboardChromeHeader } from "./DashboardChromeHeader";
import { DashboardScreenPreviewModal } from "./DashboardScreenPreviewModal";
import { DashboardDirectoryBulkActions } from "./DashboardDirectoryBulkActions";
import { DashboardTabCard } from "./DashboardTabCard";
import {
  DashboardScreensTable,
  sortableDashboardValue,
  type DashboardTableSortKey,
} from "./DashboardScreensTable";
import {
  dashboardCharts,
  dashboardFiltersWithCounts,
  dashboardKpis,
  filterDashboardTabs,
} from "./dashboard-aggregates";
import { navigateToDashboardTab } from "./dashboard-nav";
import { readPinnedScreenIds, togglePinnedScreenId } from "./dashboard-pinned";
import { dashboardStatusContext, enrichDashboardStatuses } from "./dashboard-screen-status";
import {
  buildDashboardTabRegistry,
  DASHBOARD_GROUP_OPTIONS,
  DASHBOARD_TEMPLATE_OPTIONS,
  type DashboardTabEntry,
} from "./dashboard-tab-registry";
import {
  DEFAULT_DASHBOARD_CHART_KEYS,
  DEFAULT_DASHBOARD_FILTER_KEYS,
  DEFAULT_DASHBOARD_HEADER_STAT_KEYS,
  DEFAULT_DASHBOARD_KPI_KEYS,
  DASHBOARD_CHART_DEFS,
  DASHBOARD_KPI_DEFS,
  DASHBOARD_PINNED_FILTER_OPTIONS,
} from "./dashboard-prefs";
import { useDashboardRuntimeStats } from "./useDashboardRuntimeStats";

function visibleSet(set: Set<string> | null, defaults: Set<string>) {
  return set ?? defaults;
}

function sortPinnedFirst(entries: DashboardTabEntry[], pinnedIds: Set<string>) {
  return [...entries].sort((a, b) => {
    const ap = pinnedIds.has(a.id) ? 0 : 1;
    const bp = pinnedIds.has(b.id) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.label.localeCompare(b.label);
  });
}

function DashboardEmptyState() {
  return (
    <div className="hub-users-empty rounded-2xl border border-white/5 py-12 text-center text-sm text-[var(--muted)]">
      No screens match the current filters.
    </div>
  );
}

type DashboardListPageProps = {
  allTools: ResolvedTool[];
  registryLive: boolean;
  registryLabel: string;
  versionReleaseDate: string;
  headerActions?: ReactNode;
};

export function DashboardListPage({
  allTools,
  registryLive,
  registryLabel,
  versionReleaseDate,
  headerActions,
}: DashboardListPageProps) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("dash:viewMode", "card");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => readPinnedScreenIds());
  const [preview, setPreview] = useState<DashboardTabEntry | null>(null);
  const localToolCount = useMemo(() => allTools.filter((t) => t.localUrl).length, [allTools]);
  const driftCount = useMemo(
    () => allTools.filter((t) => t.driftAlerts.length > 0).length,
    [allTools],
  );
  const runtimeStats = useDashboardRuntimeStats(localToolCount);

  useEffect(() => {
    const sync = () => setPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const registry = useMemo(() => {
    const base = buildDashboardTabRegistry({
      tools: allTools,
      registryLive,
      registryLabel,
    });
    const withMeta = enrichDashboardRegistryMeta(base, runtimeStats, { driftCount });
    const withStatus = enrichDashboardStatuses(
      withMeta,
      dashboardStatusContext(allTools, runtimeStats, registryLive),
    );
    return sortPinnedFirst(withStatus, pinnedIds);
  }, [allTools, registryLive, registryLabel, runtimeStats, driftCount, pinnedIds]);

  const filtered = useMemo(
    () => filterDashboardTabs(registry, query, filterValues, { pinnedIds, range: prefs.range }),
    [registry, query, filterValues, pinnedIds, prefs.range],
  );

  const { sortKey, sortDir, onSort } = useDirectoryTableSort(
    filtered,
    "label" as DashboardTableSortKey,
    sortableDashboardValue,
  );

  const listResetKey = useMemo(
    () => hubDirectoryListResetKey(query, filterValues, sortKey, sortDir, prefs.range),
    [query, filterValues, sortKey, sortDir, prefs.range],
  );

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((entry) => selectedIds.has(entry.id));

  const kpis = useMemo(() => dashboardKpis(filtered), [filtered]);
  const charts = useMemo(() => dashboardCharts(filtered), [filtered]);

  const visKpi = resolveVisibleKpiKeys(prefs.kpi, DEFAULT_DASHBOARD_KPI_KEYS, DASHBOARD_KPI_DEFS);
  const visCharts = resolveVisibleChartKeys(prefs.charts, DEFAULT_DASHBOARD_CHART_KEYS, DASHBOARD_CHART_DEFS);
  const visFilterKeys = visibleSet(prefs.dashFilters, DEFAULT_DASHBOARD_FILTER_KEYS);
  const visHeaderStats = visibleSet(prefs.headerStats, DEFAULT_DASHBOARD_HEADER_STAT_KEYS);

  const kpiItems = useMemo(
    () => buildDashboardKpiItems(kpis).filter((item) => !item.prefKey || visKpi.has(item.prefKey)),
    [kpis, visKpi],
  );

  const dashboardFiltersBase = useMemo(() => {
    const defs: FilterDef[] = [];
    if (visFilterKeys.has("group")) {
      defs.push({
        key: "group",
        label: "Group",
        options: DASHBOARD_GROUP_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        showAllLabel: true,
      });
    }
    if (visFilterKeys.has("template")) {
      defs.push({
        key: "template",
        label: "Template",
        options: DASHBOARD_TEMPLATE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        showAllLabel: true,
      });
    }
    if (visFilterKeys.has("pinned")) {
      defs.push({
        key: "pinned",
        label: "Pinned",
        options: DASHBOARD_PINNED_FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
        showAllLabel: true,
      });
    }
    return defs;
  }, [visFilterKeys]);

  const dashboardFilters = useMemo(
    () => dashboardFiltersWithCounts(registry, dashboardFiltersBase, query, filterValues, { pinnedIds }),
    [registry, dashboardFiltersBase, query, filterValues, pinnedIds],
  );

  const chartsBand = directoryChartBandNode({
    visCharts,
    defs: DASHBOARD_CHART_DEFS,
    data: {
      group_bar: charts.group,
      template_bar: charts.template,
    },
  });

  const handleOpen = (entry: DashboardTabEntry) => {
    navigateToDashboardTab(entry);
  };

  const handleTogglePin = (id: string) => {
    setPinnedIds(togglePinnedScreenId(id));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const entry of filtered) next.delete(entry.id);
        return next;
      }
      const next = new Set(prev);
      for (const entry of filtered) next.add(entry.id);
      return next;
    });
  };

  const selectedEntries = useMemo(
    () => filtered.filter((entry) => selectedIds.has(entry.id)),
    [filtered, selectedIds],
  );

  const handleCopyPaths = () => {
    const text = selectedEntries.map((e) => e.path).join("\n");
    void navigator.clipboard?.writeText(text);
  };

  useHubPageShortcuts("dashboard", {
    onEdit: () => setQuery(""),
    canEdit: () => query.length > 0,
  });

  return (
    <>
      <HubDirectoryScreen
        header={
          <DashboardChromeHeader
            versionReleaseDate={versionReleaseDate}
            visibleHeaderStats={visHeaderStats}
            kpi={kpis}
            actions={headerActions}
          />
        }
        filters={dashboardFilters}
        query={query}
        onQueryChange={setQuery}
        filterValues={filterValues}
        onFilterValuesChange={setFilterValues}
        filterPlaceholder="Search screens by name, group, path, template..."
        filterShortcutScope="dashboard"
        filterToolbar={
          <DirectorySearchToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            countIcon={LayoutGrid}
            shown={filtered.length}
            total={registry.length}
            countLabel="screens"
            refreshing={false}
            onRefresh={() => {}}
            showRefresh={false}
            showTablePageSize
          />
        }
        filterRowActions={
          <HubDirectoryBulkActionBar
            selectAll={
              viewMode === "card"
                ? {
                    visibleCount: filtered.length,
                    selectedCount: selectedIds.size,
                    allVisibleSelected,
                    onToggleSelectAll: handleToggleSelectAll,
                    noun: "screens",
                  }
                : null
            }
          >
            <DashboardDirectoryBulkActions
              hasSelection={selectedIds.size > 0}
              selectedCount={selectedIds.size}
              onCopyPaths={handleCopyPaths}
            />
          </HubDirectoryBulkActionBar>
        }
        kpis={kpiItems.length > 0 ? kpiItems : undefined}
        charts={chartsBand}
        sectionRuleLabel="Screens"
      >
        {filtered.length === 0 ? (
          <DashboardEmptyState />
        ) : viewMode === "card" ? (
          <HubPaginatedCardGrid
            items={filtered}
            resetKey={listResetKey}
            ariaLabel="Dashboard screens card pages"
          >
            {(pageEntries) =>
              pageEntries.map((entry) => (
                <DashboardTabCard
                  key={entry.id}
                  entry={entry}
                  pinned={pinnedIds.has(entry.id)}
                  selected={selectedIds.has(entry.id)}
                  onToggleSelect={handleToggleSelect}
                  onOpen={handleOpen}
                  onPreview={setPreview}
                  onTogglePin={handleTogglePin}
                />
              ))
            }
          </HubPaginatedCardGrid>
        ) : (
          <DashboardScreensTable
            entries={filtered}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            allVisibleSelected={allVisibleSelected}
            onPreview={setPreview}
            pinnedIds={pinnedIds}
            resetKey={listResetKey}
          />
        )}
      </HubDirectoryScreen>
      <DashboardScreenPreviewModal
        entry={preview}
        pinned={preview ? pinnedIds.has(preview.id) : false}
        onClose={() => setPreview(null)}
        onTogglePin={handleTogglePin}
      />
    </>
  );
}
