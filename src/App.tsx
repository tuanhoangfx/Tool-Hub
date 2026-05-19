import { useEffect, useMemo, useState } from "react";
import { MaterialIcon, Metric, SideNavButton, ThemeToggle, ToolFilterBar } from "./components";
import { StoreTab, SystemTab, appendSessionLog } from "./features";
import { useRepositories, useTheme } from "./hooks";
import { formatDate } from "./lib/tooling";

type ActiveTab = "library" | "system";

const TAB_META: Record<ActiveTab, { title: string; desc: string; icon: string }> = {
  library: { title: "Tool Library", desc: "Catalog of every running project — GitHub, usage, local path, version", icon: "library_books" },
  system: { title: "System", desc: "Workspace health, deployment matrix, drift & session log", icon: "monitoring" },
};

const AUTO_REFRESH_MS = 12 * 60 * 60 * 1000; // 12 hours

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>("library");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
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

  const copyPath = async (path: string) => {
    if (!path) return;
    try {
      await navigator.clipboard.writeText(path);
      appendSessionLog("Copied folder path", path);
    } catch {
      // ignore
    }
  };

  const handleRefresh = () => {
    appendSessionLog("Manual refresh", `${resolvedTools.length} tools`);
    void refreshAll();
  };

  const handleLoadRegistry = () => {
    appendSessionLog("Loaded local registry");
    void loadLocalRegistry();
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
            <strong>Workspace</strong>
            <small>{resolvedTools.length} tools</small>
          </div>
        </div>

        <nav className="nav" aria-label="Navigation">
          <SideNavButton
            active={activeTab === "library"}
            icon="library_books"
            label="Library"
            onClick={() => {
              appendSessionLog("Switched tab", "library");
              setActiveTab("library");
            }}
          />
          <SideNavButton
            active={activeTab === "system"}
            icon="monitoring"
            label="System"
            onClick={() => {
              appendSessionLog("Switched tab", "system");
              setActiveTab("system");
            }}
          />
        </nav>

        <div className="sidebar-actions">
          <button className="btn icon-only" type="button" onClick={handleLoadRegistry} title="Load local registry">
            <MaterialIcon name="upload" size={18} />
          </button>
          <button
            className="btn primary icon-only"
            type="button"
            onClick={handleRefresh}
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
              <MaterialIcon name={TAB_META[activeTab].icon} size={28} />
            </span>
            <div>
              <h1>{TAB_META[activeTab].title}</h1>
              <p className="page-desc">{TAB_META[activeTab].desc}</p>
            </div>
          </div>
          <div className="header-actions">
            <span className={loadingAll ? "auto-status active" : "auto-status"} title="Auto-refresh every 5 minutes">
              <span className="auto-dot" />
              {refreshStatus}
            </span>
            <span className="filter-meta">{filteredTools.length} tools</span>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </header>

        <div className="page-content custom-scrollbar">
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

            {activeTab === "library" ? (
              <ToolFilterBar
                variant="tools"
                query={query}
                shown={filteredTools.length}
                total={resolvedTools.length}
                onQueryChange={setQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            ) : null}

            <section className="panel">
              {activeTab === "library" ? (
                <StoreTab
                  tools={filteredTools}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  viewMode={viewMode}
                />
              ) : (
                <SystemTab
                  tools={resolvedTools}
                  loadingAll={loadingAll}
                  lastRefreshedAt={lastRefreshedAt}
                  onCopyPath={copyPath}
                />
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
