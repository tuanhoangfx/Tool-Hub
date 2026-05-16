import { useEffect, useMemo, useState } from "react";
import { MaterialIcon, Metric, SideNavButton, ThemeToggle, ToolFilterBar } from "./components";
import { AdminTab, PublishTab, RulesTab, StoreTab } from "./features";
import { ruleSources } from "./data/repositories";
import { useGitHubActions, useRepositories, useTheme } from "./hooks";
import { fetchLatestDeployStatus, GITHUB_ACTIONS_URL, GITHUB_PAGES_URL, SITE_URL, type DeployRunStatus } from "./lib/github-deploy";
import { formatDate } from "./lib/tooling";

type ActiveTab = "store" | "admin" | "publish" | "rules";

const TAB_META: Record<ActiveTab, { title: string; desc: string; icon: string }> = {
  store: { title: "Tool Store", desc: "Catalog & download", icon: "store" },
  admin: { title: "Repo Admin", desc: "Repos & drift", icon: "table_chart" },
  publish: { title: "Publish", desc: "Checks · Issue · Release", icon: "rocket_launch" },
  rules: { title: "Rules", desc: "Workspace standards", icon: "rule" },
};

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>("store");
  const [deployStatus, setDeployStatus] = useState<DeployRunStatus | null>(null);
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

  const filteredRules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ruleSources;
    return ruleSources.filter((rule) => [rule.label, rule.summary, rule.path].join(" ").toLowerCase().includes(q));
  }, [query]);

  const publishPickerTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byStatus = resolvedTools.filter((tool) => {
      if (statusFilter === "All") return true;
      return tool.healthLabel === statusFilter || tool.status === statusFilter;
    });
    if (!q) return byStatus;
    return byStatus.filter((tool) => [tool.name, tool.code, tool.repo].join(" ").toLowerCase().includes(q));
  }, [query, resolvedTools, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const status = await fetchLatestDeployStatus();
      if (!cancelled) setDeployStatus(status);
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 60000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const stats = useMemo(() => {
    const ready = resolvedTools.filter((tool) => tool.healthLabel === "Ready").length;
    const releases = resolvedTools.filter((tool) => Boolean(tool.remote?.latestRelease)).length;
    const drift = resolvedTools.filter((tool) => tool.driftAlerts.length > 0).length;
    return { total: resolvedTools.length, ready, releases, drift };
  }, [resolvedTools]);

  const tab = TAB_META[activeTab];
  const registryLive = Boolean(localRegistry?.generatedAt) && !registryError;
  const isRulesTab = activeTab === "rules";
  const filterShown = isRulesTab ? filteredRules.length : filteredTools.length;
  const filterTotal = isRulesTab ? ruleSources.length : resolvedTools.length;
  const headerMeta = isRulesTab ? `${filteredRules.length} rules` : `${filteredTools.length} tools`;

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
          <SideNavButton active={activeTab === "publish"} icon="rocket_launch" label="Publish" onClick={() => setActiveTab("publish")} />
          <SideNavButton active={activeTab === "rules"} icon="rule" label="Rules" onClick={() => setActiveTab("rules")} />
        </nav>

        <div className="sidebar-actions">
          <button className="btn icon-only" type="button" onClick={() => void loadLocalRegistry()} title="Registry">
            <MaterialIcon name="upload" size={18} />
          </button>
          <button className="btn primary icon-only" type="button" onClick={() => void refreshAll()} disabled={loadingAll} title="Refresh catalog">
            <MaterialIcon name="refresh" size={18} className={loadingAll ? "spin" : ""} />
          </button>
        </div>

        <div className="sidebar-deploy">
          <a
            className="sidebar-deploy-link"
            href={deployStatus?.url ?? GITHUB_ACTIONS_URL}
            target="_blank"
            rel="noreferrer"
            title="GitHub Actions — Deploy GitHub Pages"
          >
            <MaterialIcon name="rocket_launch" size={16} />
            <span>Deploy</span>
            {deployStatus ? (
              <span className={`deploy-badge ${deployStatus.tone}`}>{deployStatus.label}</span>
            ) : null}
          </a>
          <a className="sidebar-deploy-link subtle" href={GITHUB_PAGES_URL} target="_blank" rel="noreferrer" title="GitHub Pages settings">
            <MaterialIcon name="language" size={16} />
            <span>Pages</span>
          </a>
          <a className="sidebar-deploy-link subtle" href={SITE_URL} target="_blank" rel="noreferrer" title="Production site">
            <MaterialIcon name="public" size={16} />
            <span>Live</span>
          </a>
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
            <span className="filter-meta">{headerMeta}</span>
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

            <ToolFilterBar
              variant={isRulesTab ? "rules" : "tools"}
              query={query}
              shown={filterShown}
              total={filterTotal}
              onQueryChange={setQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={isRulesTab ? undefined : setStatusFilter}
              pickerTools={activeTab === "publish" ? publishPickerTools : undefined}
              selectedId={selectedId}
              onSelectTool={activeTab === "publish" ? setSelectedId : undefined}
            />

            <section className="panel">
              {activeTab === "store" && <StoreTab tools={filteredTools} selectedId={selectedId} onSelect={setSelectedId} />}
              {activeTab === "admin" && (
                <AdminTab
                  tools={filteredTools}
                  allTools={repositories}
                  selectedTool={selectedTool}
                  onRefresh={refreshOne}
                  onSelect={setSelectedId}
                  onRemoveCustom={removeCustomRepo}
                />
              )}
              {activeTab === "publish" && (
                <PublishTab
                  selectedTool={selectedTool}
                  token={githubToken}
                  actionStatus={actionStatus}
                  onTokenChange={saveToken}
                  onCreateIssue={createIssueForSelected}
                  onCreateRelease={createDraftReleaseForSelected}
                  onCreateVersionSyncPr={createVersionSyncPrForSelected}
                />
              )}
              {activeTab === "rules" && <RulesTab rules={filteredRules} />}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
