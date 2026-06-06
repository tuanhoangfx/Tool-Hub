import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Boxes, Play, Radio, RotateCcw } from "lucide-react";
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

  const localUrls = useMemo(() => filtered.map((t) => t.localUrl).filter((u): u is string => Boolean(u)), [filtered]);
  const localHealthPollMs = useMemo(
    () => resolveLocalHealthPollMs(prefs.localHealthPoll),
    [prefs.localHealthPoll],
  );
  const { state: healthState, check: recheckLocal } = useLocalHealth(localUrls, localHealthPollMs);
  const quotaVersion = useSupabaseQuotaVersion();
  const [localHealthBusy, setLocalHealthBusy] = useState(false);
  const [hubRecoverBusy, setHubRecoverBusy] = useState(false);
  const [startAllDownBusy, setStartAllDownBusy] = useState(false);
  const [startingDevCodes, setStartingDevCodes] = useState<Set<string>>(() => new Set());
  const [devToast, setDevToast] = useState<{ message: string; tone: "ok" | "err" } | null>(null);
  const checkingLocal = localHealthBusy;

  function showDevToast(message: string, tone: "ok" | "err" = "ok") {
    setDevToast({ message, tone });
    window.setTimeout(() => setDevToast(null), 8_000);
  }

  const localDownCount = useMemo(
    () => localUrls.filter((u) => healthState[u] === "offline").length,
    [localUrls, healthState],
  );

  const hubLocalUrl = useMemo(
    () => allTools.find((t) => t.code === "P0004")?.localUrl ?? "http://127.0.0.1:5176/",
    [allTools],
  );
  const hubDevDown = healthState[hubLocalUrl] === "offline";

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

  async function startProductDev(code: string) {
    const targetUrl = allTools.find((t) => t.code === code)?.localUrl;
    setStartingDevCodes((prev) => new Set(prev).add(code));
    try {
      const res = await fetch("/api/workspace-dev/start-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok && res.status !== 202) {
        showDevToast(body.message ?? `Start ${code} failed`, "err");
        return;
      }
      showDevToast(body.message ?? `Starting ${code}…`);
      if (!targetUrl) return;
      for (let i = 0; i < 8; i += 1) {
        await new Promise((r) => window.setTimeout(r, 4_000));
        setLocalHealthBusy(true);
        await recheckLocal();
        setLocalHealthBusy(false);
        const healthRes = await fetch(`/api/local-health?urls=${encodeURIComponent(targetUrl)}`, {
          cache: "no-store",
        });
        if (healthRes.ok) {
          const data = (await healthRes.json()) as { results?: Record<string, string> };
          if (data.results?.[targetUrl] === "online") {
            showDevToast(`${code} dev server is live.`);
            break;
          }
        }
      }
    } catch {
      showDevToast(`Start ${code} failed. Run: node Tool/scripts/ensure-dev-product.cjs ${code}`, "err");
    } finally {
      setStartingDevCodes((prev) => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
    }
  }

  async function startAllDownDevs() {
    setStartAllDownBusy(true);
    try {
      const res = await fetch("/api/workspace-dev/start-down", { method: "POST" });
      const body = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok && res.status !== 202) {
        showDevToast(body.message ?? "Start all down failed", "err");
        return;
      }
      showDevToast(body.message ?? "Starting workspace dev servers…");
      for (let i = 0; i < 18; i += 1) {
        await new Promise((r) => window.setTimeout(r, 8_000));
        setLocalHealthBusy(true);
        await recheckLocal();
        setLocalHealthBusy(false);
        const statusRes = await fetch("/api/workspace-dev/status");
        const status = (await statusRes.json()) as { running?: boolean; exitCode?: number | null };
        if (!status.running && i >= 2) {
          const doneMsg =
            status.exitCode === 0
              ? "All down workspace dev servers started. Check Local health for live badges."
              : "Workspace dev start finished (some tools may need manual start). See workspace-dev-start.log.";
          showDevToast(doneMsg, status.exitCode === 0 ? "ok" : "err");
          break;
        }
      }
    } catch {
      showDevToast("Request failed. Run: cd E:\\Dev\\Tool && corepack pnpm dev:stack:workspace", "err");
    } finally {
      setStartAllDownBusy(false);
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
            {import.meta.env.DEV ? (
              <>
                <button
                  type="button"
                  disabled={startAllDownBusy || checkingLocal || localUrls.length === 0}
                  onClick={() => void startAllDownDevs()}
                  title="Start every workspace tool that is down (ensure-dev --stack workspace --down-only). Does not open browser tabs."
                  className={`inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    localDownCount > 0
                      ? "border-sky-400/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25"
                      : "border-white/10 bg-white/5 text-[var(--muted)] hover:bg-white/10 hover:text-[var(--text)]"
                  }`}
                >
                  <Play size={14} className={startAllDownBusy ? "animate-pulse" : ""} aria-hidden />
                  {startAllDownBusy
                    ? "Starting…"
                    : localDownCount > 0
                      ? `Start all down (${localDownCount})`
                      : "Start all down"}
                </button>
                <button
                  type="button"
                  disabled={hubRecoverBusy}
                  onClick={() => void recoverHubDev()}
                  title="Kill port 5176, clear Vite cache, restart Hub dev (fixes esbuild crash overlay)"
                  className={`inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    hubDevDown
                      ? "border-amber-400/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
                      : "border-white/10 bg-white/5 text-[var(--muted)] hover:bg-white/10 hover:text-[var(--text)]"
                  }`}
                >
                  <RotateCcw size={14} className={hubRecoverBusy ? "animate-spin" : ""} aria-hidden />
                  Restart Hub dev
                </button>
              </>
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
            <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((tool) => (
                <HubToolCard
                  key={tool.id}
                  tool={tool}
                  healthState={tool.localUrl ? healthState[tool.localUrl] : undefined}
                  quotaVersion={quotaVersion}
                  onOpen={onSelect}
                  onStartDev={import.meta.env.DEV ? startProductDev : undefined}
                  startingDev={startingDevCodes.has(tool.code)}
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
            onStartDev={import.meta.env.DEV ? startProductDev : undefined}
            startingDevCodes={startingDevCodes}
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
