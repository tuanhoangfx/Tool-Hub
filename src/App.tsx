import { useEffect, useMemo, useState } from "react";
import { MaterialIcon, Metric, ThemeToggle, ToolFilterBar } from "./components";
import { StoreTab } from "./features";
import { SystemHubScreen } from "./features/system-hub/SystemHubScreen";
import { useRepositories, useSessionState, useTheme, useUrlState } from "./hooks";
import { readAppScreen, setAppScreen, type AppScreen } from "./lib/app-screen";
import { formatDate } from "./lib/tooling";

const PAGE = {
  title: "Tool Hub",
  desc: "Catalog of every running project — GitHub, usage, local path, version",
  icon: "hub",
} as const;

const AUTO_REFRESH_MS = 12 * 60 * 60 * 1000;

function App() {
  const { isDark, toggleTheme } = useTheme();
  const { state: urlState, update: updateUrl } = useUrlState();
  const [screen, setScreen] = useState<AppScreen>(() => readAppScreen());
  const [viewMode, setViewMode] = useSessionState<"grid" | "table">("lib:viewMode", "grid");
  const [query, setQuery] = useSessionState<string>("lib:query", "");
  const [statusFilter, setStatusFilter] = useSessionState<string>("lib:statusFilter", "All");
  const {
    selectedId,
    setSelectedId,
    resolvedTools,
    loadingAll,
    localRegistry,
    registryError,
    refreshAll,
    loadLocalRegistry,
  } = useRepositories();

  useEffect(() => {
    const onPop = () => setScreen(readAppScreen());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!urlState.tool || resolvedTools.length === 0) return;
    if (resolvedTools.some((t) => t.id === urlState.tool) && urlState.tool !== selectedId) {
      setSelectedId(urlState.tool);
    }
  }, [urlState.tool, resolvedTools, selectedId, setSelectedId]);

  const handleSelectTool = (id: string) => {
    setSelectedId(id);
    updateUrl({ tool: id, detail: true });
  };

  const handleCloseDetail = () => {
    updateUrl({ detail: false });
  };

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resolvedTools.filter((tool) => {
      const matchesStatus = statusFilter === "All" || tool.healthLabel === statusFilter || tool.status === statusFilter;
      const matchesQuery =
        !q ||
        [tool.name, tool.code, tool.repo, tool.summary, tool.category, tool.audience, ...tool.tags]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [query, resolvedTools, statusFilter]);

  const stats = useMemo(() => {
    const ready = resolvedTools.filter((tool) => tool.healthLabel === "Ready").length;
    const releases = resolvedTools.filter((tool) => Boolean(tool.remote?.latestRelease)).length;
    const drift = resolvedTools.filter((tool) => tool.driftAlerts.length > 0).length;
    return { total: resolvedTools.length, ready, releases, drift };
  }, [resolvedTools]);

  const registryLive = Boolean(localRegistry?.generatedAt) && !registryError;

  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!loadingAll && resolvedTools.some((t) => t.remote?.checkedAt)) {
      setLastRefreshedAt(Date.now());
    }
  }, [loadingAll, resolvedTools]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshAll();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refreshAll]);

  const refreshStatus = useMemo(() => {
    if (loadingAll) return "Refreshing...";
    if (!lastRefreshedAt) return "Auto-refresh on";
    const seconds = Math.max(0, Math.floor((nowTick - lastRefreshedAt) / 1000));
    if (seconds < 60) return `Updated ${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Updated ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `Updated ${hours}h ago`;
  }, [loadingAll, lastRefreshedAt, nowTick]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="traffic-lights" aria-hidden="true">
          <span className="traffic-light red" />
          <span className="traffic-light yellow" />
          <span className="traffic-light green" />
        </div>

        <div className="brand">
          <div className="brand-icon-wrap">
            <MaterialIcon name="hub" size={20} />
          </div>
          <div>
            <strong>Tool Hub</strong>
            <small>{resolvedTools.length} tools</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Screens">
          <button
            type="button"
            className={screen === "library" ? "sidebar-nav-btn active" : "sidebar-nav-btn"}
            onClick={() => {
              setAppScreen("library");
              setScreen("library");
            }}
          >
            <MaterialIcon name="inventory_2" size={18} />
            Library
          </button>
          <button
            type="button"
            className={screen === "system" ? "sidebar-nav-btn active" : "sidebar-nav-btn"}
            onClick={() => {
              setAppScreen("system");
              setScreen("system");
            }}
          >
            <MaterialIcon name="settings" size={18} />
            System
          </button>
        </nav>

        <div className="sidebar-actions">
          <button className="btn icon-only" type="button" onClick={() => void loadLocalRegistry()} title="Load local registry">
            <MaterialIcon name="upload" size={18} />
          </button>
          <button
            className="btn primary icon-only"
            type="button"
            onClick={() => void refreshAll()}
            disabled={loadingAll}
            title="Refresh from GitHub"
          >
            <MaterialIcon name="refresh" size={18} className={loadingAll ? "spin" : ""} />
          </button>
        </div>

        <div className="sidebar-foot">
          <span className={registryLive ? "dot live" : "dot"} />
          <span>{registryLive ? formatDate(localRegistry!.generatedAt) : "No registry"}</span>
        </div>
      </aside>

      <div className="main-area">
        <div className="dot-grid-bg" aria-hidden="true" />
        <div className="landing-grid" aria-hidden="true" />

        <header className="page-header">
          <div className="page-title-wrap">
            <span className="page-header-icon">
              <MaterialIcon name={screen === "system" ? "settings" : PAGE.icon} size={28} />
            </span>
            <div>
              <h1>{screen === "system" ? "System" : PAGE.title}</h1>
              <p className="page-desc">
                {screen === "system" ? "Overview · Design Template · registry tools" : PAGE.desc}
              </p>
            </div>
          </div>
          <div className="header-actions">
            {screen === "library" ? (
              <>
                <span className={loadingAll ? "auto-status active" : "auto-status"} title="Auto-refresh every 12 hours">
                  <span className="auto-dot" />
                  {refreshStatus}
                </span>
                <span className="filter-meta">{filteredTools.length} tools</span>
              </>
            ) : null}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </header>

        <div className="page-content custom-scrollbar">
          {screen === "system" ? (
            <div className="content-inner system-content">
              <SystemHubScreen />
            </div>
          ) : (
          <div className="content-inner">
            <section className="compact-cards" aria-label="Metrics">
              <Metric icon="inventory_2" label="Tools" value={stats.total} badge="ALL" badgeClass="run" accent="brand" />
              <Metric icon="check_circle" label="Ready" value={stats.ready} badge="OK" badgeClass="ok" accent="green" />
              <Metric icon="new_releases" label="Release" value={stats.releases} badge="PUB" badgeClass="ok" accent="blue" />
              <Metric
                icon="warning"
                label="Drift"
                value={stats.drift}
                badge={stats.drift > 0 ? "!" : "OK"}
                badgeClass={stats.drift > 0 ? "bad" : "ok"}
                accent="amber"
              />
            </section>

            {registryError ? (
              <div className="inline-banner bad">
                <MaterialIcon name="warning" size={16} />
                {registryError}
              </div>
            ) : null}

            <ToolFilterBar
              query={query}
              shown={filteredTools.length}
              total={resolvedTools.length}
              onQueryChange={setQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            <section className="panel">
              <StoreTab
                tools={filteredTools}
                selectedId={selectedId}
                onSelect={handleSelectTool}
                viewMode={viewMode}
                modalOpen={urlState.detail}
                onCloseModal={handleCloseDetail}
              />
            </section>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
