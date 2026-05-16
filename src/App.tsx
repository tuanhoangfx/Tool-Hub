import { useMemo, useState } from "react";
import { MaterialIcon, Metric, SideNavButton, ThemeToggle, ToolFilterBar, ToolPickerBar } from "./components";
import { AdminTab, GitHubActionsTab, ReleaseChecklistTab, RulesTab, StoreTab } from "./features";
import { useGitHubActions, useRepositories, useTheme } from "./hooks";
import { formatDate } from "./lib/tooling";

type ActiveTab = "store" | "admin" | "github" | "release" | "rules";

const TAB_META: Record<ActiveTab, { title: string; desc: string; icon: string }> = {
  store: { title: "Tool Store", desc: "Catalog & download", icon: "store" },
  admin: { title: "Repo Admin", desc: "Repos & drift", icon: "table_chart" },
  github: { title: "GitHub Actions", desc: "Issue · PR · Release", icon: "merge" },
  release: { title: "Release", desc: "Pre-publish checks", icon: "rocket_launch" },
  rules: { title: "Rules", desc: "Workspace standards", icon: "rule" },
};

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>("store");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const {
    selectedId,
    setSelectedId,
    repositories,
    resolvedTools,
    selectedTool,
    loadingAll,
    localRegistry,
    repoDraft,
    setRepoDraft,
    registryError,
    refreshOne,
    refreshAll,
    loadLocalRegistry,
    addRepo,
    removeCustomRepo,
  } = useRepositories();
  const {
    githubToken,
    actionStatus,
    saveToken,
    createIssueForSelected,
    createDraftReleaseForSelected,
    createVersionSyncPrForSelected,
  } = useGitHubActions(selectedTool);

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

  const pickerTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resolvedTools;
    return resolvedTools.filter((tool) => [tool.name, tool.code, tool.repo].join(" ").toLowerCase().includes(q));
  }, [query, resolvedTools]);

  const stats = useMemo(() => {
    const ready = resolvedTools.filter((tool) => tool.healthLabel === "Ready").length;
    const releases = resolvedTools.filter((tool) => Boolean(tool.remote?.latestRelease)).length;
    const drift = resolvedTools.filter((tool) => tool.driftAlerts.length > 0).length;
    return { total: resolvedTools.length, ready, releases, drift };
  }, [resolvedTools]);

  const tab = TAB_META[activeTab];
  const registryLive = Boolean(localRegistry?.generatedAt) && !registryError;

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
            <strong>Tool Manager</strong>
            <small>Workspace</small>
          </div>
        </div>

        <nav className="nav" aria-label="Navigation">
          <SideNavButton active={activeTab === "store"} icon="store" label="Store" onClick={() => setActiveTab("store")} />
          <SideNavButton active={activeTab === "admin"} icon="table_chart" label="Admin" onClick={() => setActiveTab("admin")} />
          <SideNavButton active={activeTab === "github"} icon="merge" label="Actions" onClick={() => setActiveTab("github")} />
          <SideNavButton active={activeTab === "release"} icon="rocket_launch" label="Release" onClick={() => setActiveTab("release")} />
          <SideNavButton active={activeTab === "rules"} icon="rule" label="Rules" onClick={() => setActiveTab("rules")} />
        </nav>

        <div className="sidebar-actions">
          <button className="btn icon-only" type="button" onClick={() => void loadLocalRegistry()} title="Registry">
            <MaterialIcon name="upload" size={18} />
          </button>
          <button className="btn primary icon-only" type="button" onClick={refreshAll} disabled={loadingAll} title="Refresh">
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
              <MaterialIcon name={tab.icon} size={28} />
            </span>
            <div>
              <h1>{tab.title}</h1>
              <p className="page-desc">{tab.desc}</p>
            </div>
          </div>
          <div className="header-actions">
            <span className="filter-meta">{filteredTools.length} tools</span>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </header>

        <div className="page-content custom-scrollbar">
          <div className="content-inner">
            <section className="compact-cards" aria-label="Metrics">
              <Metric icon="inventory_2" label="Tools" value={stats.total} badge="ALL" badgeClass="run" accent="brand" />
              <Metric icon="check_circle" label="Ready" value={stats.ready} badge="OK" badgeClass="ok" accent="green" />
              <Metric icon="new_releases" label="Release" value={stats.releases} badge="LIVE" badgeClass="ok" accent="blue" />
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

            {(activeTab === "store" || activeTab === "admin") && (
              <ToolFilterBar
                query={query}
                statusFilter={statusFilter}
                shown={filteredTools.length}
                total={resolvedTools.length}
                onQueryChange={setQuery}
                onStatusFilterChange={setStatusFilter}
              />
            )}

            {(activeTab === "github" || activeTab === "release") && (
              <ToolPickerBar tools={pickerTools} selectedId={selectedId} query={query} onQueryChange={setQuery} onSelect={setSelectedId} />
            )}

            {activeTab === "rules" && (
              <div className="filter-toolbar">
                <label className="search-box grow">
                  <MaterialIcon name="search" size={16} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tim rule, path..."
                    type="search"
                    aria-label="Tim rule"
                  />
                </label>
              </div>
            )}

            <section className="panel">
              {activeTab === "store" && <StoreTab tools={filteredTools} selectedId={selectedId} onSelect={setSelectedId} />}
              {activeTab === "admin" && (
                <AdminTab
                  tools={filteredTools}
                  allTools={repositories}
                  selectedTool={selectedTool}
                  repoDraft={repoDraft}
                  onRepoDraftChange={setRepoDraft}
                  onAddRepo={addRepo}
                  onRefresh={refreshOne}
                  onSelect={setSelectedId}
                  onRemoveCustom={removeCustomRepo}
                />
              )}
              {activeTab === "github" && (
                <GitHubActionsTab
                  selectedTool={selectedTool}
                  token={githubToken}
                  actionStatus={actionStatus}
                  onTokenChange={saveToken}
                  onCreateIssue={createIssueForSelected}
                  onCreateRelease={createDraftReleaseForSelected}
                  onCreateVersionSyncPr={createVersionSyncPrForSelected}
                />
              )}
              {activeTab === "release" && <ReleaseChecklistTab selectedTool={selectedTool} />}
              {activeTab === "rules" && <RulesTab query={query} />}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
