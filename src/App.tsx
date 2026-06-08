import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  HubAppLogProvider,
  HubLogButton,
  resolveHubActiveScreenId,
  useHubActiveScreenSync,
  useHubAppLog,
} from "@tool-workspace/hub-ui";
import { DisplayPrefs, HubLoaderRoot, SalesSidebar } from "./components/sales-shell";
import type { HubViewMode } from "./components/sales-shell";
import { readSystemTab } from "./features/system-hub/components/SystemTabs";
import { dispatchAgentManifestRefresh } from "./features/system-hub/agent-manifest-events";
import { dispatchSupabaseQuotaRefresh } from "./features/system-hub/supabase-quota-events";
import { UserManagementScreen } from "./features/identity/UserManagementScreen";
import { SystemHubScreen } from "./features/system-hub/SystemHubScreen";
import { systemDisplayDefs } from "./features/system-hub/system-display-prefs";
import {
  DEFAULT_HUB_CHART_KEYS,
  DEFAULT_HUB_FILTER_KEYS,
  DEFAULT_HUB_HEADER_STAT_KEYS,
  DEFAULT_HUB_KPI_KEYS,
  HUB_CHART_DEFS,
  HUB_FILTER_DEFS,
  HUB_HEADER_STAT_DEFS,
  HUB_KPI_DEFS,
} from "./features/hub/hub-prefs";
import {
  DEFAULT_USER_HEADER_STAT_KEYS,
  USER_HEADER_STAT_DEFS,
} from "./features/identity/user-header-metrics";
import { DEFAULT_USER_KPI_KEYS, USER_KPI_DEFS } from "./features/identity/user-display-prefs";
import {
  defaultSystemHeaderStatKeys,
  systemHeaderStatDefs,
} from "./features/system-hub/system-header-metrics";
import { DashboardListPage } from "./features/dashboard";
import { HubListPage } from "./features/hub";
import {
  DEFAULT_DASHBOARD_CHART_KEYS,
  DEFAULT_DASHBOARD_FILTER_KEYS,
  DEFAULT_DASHBOARD_HEADER_STAT_KEYS,
  DEFAULT_DASHBOARD_KPI_KEYS,
  DASHBOARD_CHART_DEFS,
  DASHBOARD_FILTER_DEFS,
  DASHBOARD_HEADER_STAT_DEFS,
  DASHBOARD_KPI_DEFS,
} from "./features/dashboard/dashboard-prefs";

import { useRepositories, useSessionState, useUrlState } from "./hooks";
import { migrateAppUrl, readAppScreen, setAppScreen, type AppScreen } from "./lib/app-screen";
import { prefetchAllAppScreens } from "./lib/app-screen-prefetch";
import { prefetchHubBackgroundData } from "./lib/hub-background-prefetch";
import { resolveVersionReleaseMeta } from "./lib/app-release";
import { formatDate } from "./lib/tooling";
import { compactIconSize } from "./lib/ui-scale";
import { runWorkspaceRefresh } from "./services/workspace-scan";

const AUTO_REFRESH_MS = 12 * 60 * 60 * 1000;
const ALL_APP_SCREENS: AppScreen[] = ["dashboard", "library", "users", "system"];
type ScanStatus = "idle" | "scanning" | "success" | "error";

function AppDisplayPrefs({ sidebarRow = false, scope = "tab" }: { sidebarRow?: boolean; scope?: "tab" | "global" }) {
  const [screen, setScreen] = useState(() => readAppScreen());
  const [systemTab, setSystemTab] = useState(() => readSystemTab());

  useEffect(() => {
    const sync = () => {
      setScreen(readAppScreen());
      setSystemTab(readSystemTab());
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("system-display-change", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("system-display-change", sync);
    };
  }, []);

  const isGlobal = scope === "global";
  const defs =
    !isGlobal && screen === "dashboard"
      ? {
          kpis: DASHBOARD_KPI_DEFS,
          charts: DASHBOARD_CHART_DEFS,
          defaultKpiKeys: DEFAULT_DASHBOARD_KPI_KEYS,
          defaultChartKeys: DEFAULT_DASHBOARD_CHART_KEYS,
        }
      : !isGlobal && screen === "system"
        ? systemDisplayDefs(systemTab)
        : !isGlobal && screen === "users"
          ? { kpis: USER_KPI_DEFS, charts: undefined, defaultKpiKeys: DEFAULT_USER_KPI_KEYS, defaultChartKeys: undefined }
          : null;
  const headerStats =
    isGlobal || screen === "library"
      ? HUB_HEADER_STAT_DEFS
      : screen === "dashboard"
        ? DASHBOARD_HEADER_STAT_DEFS
        : screen === "users"
          ? USER_HEADER_STAT_DEFS
          : screen === "system"
            ? systemHeaderStatDefs(systemTab)
            : [];
  const defaultHeaderStatKeys =
    isGlobal || screen === "library"
      ? DEFAULT_HUB_HEADER_STAT_KEYS
      : screen === "dashboard"
        ? DEFAULT_DASHBOARD_HEADER_STAT_KEYS
        : screen === "users"
          ? DEFAULT_USER_HEADER_STAT_KEYS
          : screen === "system"
            ? defaultSystemHeaderStatKeys(systemTab)
            : undefined;

  const isDashboard = !isGlobal && screen === "dashboard";

  return (
    <DisplayPrefs
      kpis={isGlobal ? undefined : defs?.kpis ?? HUB_KPI_DEFS}
      charts={isGlobal ? undefined : defs?.charts ?? HUB_CHART_DEFS}
      filters={
        isGlobal || screen === "system"
          ? undefined
          : isDashboard
            ? DASHBOARD_FILTER_DEFS
            : HUB_FILTER_DEFS
      }
      filterParam={isDashboard ? "dfilt" : "hfilt"}
      filtersFromUrl={isDashboard}
      headerStats={isGlobal ? undefined : headerStats}
      defaultHeaderStatKeys={defaultHeaderStatKeys}
      defaultKpiKeys={defs?.defaultKpiKeys ?? DEFAULT_HUB_KPI_KEYS}
      defaultChartKeys={defs?.defaultChartKeys ?? DEFAULT_HUB_CHART_KEYS}
      defaultFilterKeys={screen === "dashboard" ? DEFAULT_DASHBOARD_FILTER_KEYS : DEFAULT_HUB_FILTER_KEYS}
      showRange={false}
      showLimit={false}
      showHeaderPin={isGlobal}
      showUsersTableColumns={!isGlobal && screen === "users"}
      displayExtras={undefined}
      sidebarRow={sidebarRow}
      scope={scope}
    />
  );
}

function AppHeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <HubLogButton variant="tab" />
      <AppDisplayPrefs scope="tab" />
    </div>
  );
}

type AppShellContentProps = {
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  systemTab: ReturnType<typeof readSystemTab>;
  setSystemTab: (tab: ReturnType<typeof readSystemTab>) => void;
};

function AppShellContent({ screen, setScreen, systemTab, setSystemTab }: AppShellContentProps) {
  const { state: urlState, update: updateUrl } = useUrlState();

  useHubActiveScreenSync(screen, systemTab);
  /** Eager keep-mounted — avoids blank main when URL is /system/* before visited effect runs. */
  const [visitedScreens, setVisitedScreens] = useState<Set<AppScreen>>(() => new Set(ALL_APP_SCREENS));
  const [viewMode, setViewMode] = useSessionState<"grid" | "table">("lib:viewMode", "grid");
  const [scanningWorkspace, setScanningWorkspace] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanMessage, setScanMessage] = useState("");
  const { pushLog } = useHubAppLog();
  const activeScreenId = resolveHubActiveScreenId(screen, systemTab);
  const {
    selectedId,
    setSelectedId,
    resolvedTools,
    loadingAll,
    localRegistry,
    registryError,
    refreshAll,
    refreshTool,
    prefetchRemote,
    loadLocalRegistry,
  } = useRepositories();

  const hubView: HubViewMode = viewMode === "grid" ? "card" : "table";

  const settleScanStatus = useCallback((status: ScanStatus, message: string) => {
    setScanStatus(status);
    setScanMessage(message);
    if (status === "scanning") return;
    window.setTimeout(() => {
      setScanStatus("idle");
      setScanMessage("");
    }, 10_000);
  }, []);

  useLayoutEffect(() => {
    const syncFromUrl = () => {
      const next = readAppScreen();
      setScreen(next);
      setVisitedScreens((prev) => {
        const merged = new Set(prev);
        merged.add(next);
        return merged;
      });
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => {
    const warm = () => {
      prefetchHubBackgroundData();
      prefetchAllAppScreens();
    };
    prefetchHubBackgroundData();
    const idle = window.requestIdleCallback?.(warm, { timeout: 1500 });
    if (idle == null) {
      const t = window.setTimeout(warm, 200);
      return () => window.clearTimeout(t);
    }
    return () => window.cancelIdleCallback(idle);
  }, []);

  useEffect(() => {
    if (!urlState.tool || resolvedTools.length === 0) return;
    if (resolvedTools.some((t) => t.id === urlState.tool) && urlState.tool !== selectedId) {
      setSelectedId(urlState.tool);
    }
  }, [urlState.tool, resolvedTools, selectedId, setSelectedId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshAll();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refreshAll]);

  const handleSelectTool = (id: string) => {
    pushLog("Hub", `Opened ${id} detail`, "library");
    setSelectedId(id);
    updateUrl({ tool: id, detail: true });
    void prefetchRemote(id);
  };

  const handleCloseDetail = () => {
    pushLog("Hub", "Closed tool detail", "library");
    updateUrl({ detail: false });
  };

  const navigate = (next: AppScreen) => {
    if (next !== screen) {
      const label =
        next === "system" ? "System" : next === "users" ? "Users" : next === "dashboard" ? "Dashboard" : "Hub";
      pushLog("Navigation", `Switched to ${label}`, resolveHubActiveScreenId(next, readSystemTab()));
    }
    setAppScreen(next);
    setScreen(next);
  };

  const handleRefreshAll = async () => {
    if (scanningWorkspace) return;
    const systemTab = readSystemTab();
    if (screen === "system" && systemTab === "supabase-quota") {
      dispatchSupabaseQuotaRefresh();
      pushLog("System", "Supabase Quota refresh requested", activeScreenId);
      return;
    }
    if (screen === "system" && systemTab === "agent") {
      dispatchAgentManifestRefresh();
      pushLog("System", "Agent manifest refresh requested", activeScreenId);
      return;
    }
    dispatchSupabaseQuotaRefresh();
    setScanningWorkspace(true);
    settleScanStatus("scanning", "Refreshing workspace + quota + agent manifest…");
    pushLog("Tool", "Workspace + quota + agent manifest refresh requested", activeScreenId);
    try {
      const result = await runWorkspaceRefresh();
      dispatchAgentManifestRefresh();
      if (!result.ok) {
        const message = `${result.message ?? "Workspace refresh failed"}; loaded existing registry if available`;
        settleScanStatus("error", message);
        pushLog("Tool", message, activeScreenId);
        await loadLocalRegistry();
        void refreshAll();
        return;
      }
      const message = "Workspace refresh completed; registry + agent manifest reloaded";
      settleScanStatus("success", message);
      pushLog("Tool", message, activeScreenId);
      await loadLocalRegistry();
      void refreshAll();
    } finally {
      setScanningWorkspace(false);
    }
  };

  const handleRefreshTool = (id: string) => {
    pushLog("Hub", `Refresh ${id} requested`, "library");
    void refreshTool(id);
  };

  const handleViewModeChange = (next: HubViewMode) => {
    pushLog("Hub", `Switched view to ${next === "card" ? "Cards" : "Table"}`, "library");
    setViewMode(next === "card" ? "grid" : "table");
  };

  const registryLive = Boolean(localRegistry?.generatedAt) && !registryError;
  const registryLabel = registryLive ? formatDate(localRegistry!.generatedAt) : "";

  const hubSelf = useMemo(() => resolvedTools.find((t) => t.code === "P0004"), [resolvedTools]);
  const versionRelease = useMemo(() => resolveVersionReleaseMeta(hubSelf), [hubSelf]);
  const headerActions = <AppHeaderActions />;

  return (
    <div className="hub-app theme-hub flex h-full min-h-0 w-full overflow-hidden">
      <SalesSidebar
        screen={screen}
        onNavigate={navigate}
        loadingAll={loadingAll}
        scanningWorkspace={scanningWorkspace}
        scanStatus={scanStatus}
        scanMessage={scanMessage}
        lastScanAt={localRegistry?.generatedAt}
        onRefreshAll={() => void handleRefreshAll()}
        displayPrefs={<AppDisplayPrefs sidebarRow scope="global" />}
      />

      <main className="hub-main flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
        <HubLoaderRoot />
        {visitedScreens.has("dashboard") ? (
          <div className={screen !== "dashboard" ? "hidden" : undefined} aria-hidden={screen !== "dashboard"}>
            <DashboardListPage
              allTools={resolvedTools}
              registryLive={registryLive}
              registryLabel={registryLabel}
              versionReleaseDate={versionRelease.shortLabel}
              headerActions={headerActions}
            />
          </div>
        ) : null}
        {visitedScreens.has("library") ? (
          <div className={screen !== "library" ? "hidden" : undefined} aria-hidden={screen !== "library"}>
            <HubListPage
              allTools={resolvedTools}
              selectedId={selectedId}
              onSelect={handleSelectTool}
              modalOpen={urlState.detail}
              onCloseModal={handleCloseDetail}
              loadingAll={loadingAll}
              scanningWorkspace={scanningWorkspace}
              registryError={registryError}
              onRefresh={handleRefreshAll}
              onRefreshTool={handleRefreshTool}
              viewMode={hubView}
              onViewModeChange={handleViewModeChange}
              registryLive={registryLive}
              registryLabel={registryLabel}
              versionReleaseDate={versionRelease.shortLabel}
              versionReleaseLive={versionRelease.live}
              headerActions={headerActions}
            />
          </div>
        ) : null}
        {visitedScreens.has("users") ? (
          <div className={screen !== "users" ? "hidden" : undefined} aria-hidden={screen !== "users"}>
            <UserManagementScreen
              versionReleaseDate={versionRelease.shortLabel}
              headerActions={headerActions}
            />
          </div>
        ) : null}
        {visitedScreens.has("system") ? (
          <div className={screen !== "system" ? "hidden" : undefined} aria-hidden={screen !== "system"}>
            <SystemHubScreen
              tools={resolvedTools}
              registryLive={registryLive}
              registryLabel={registryLabel}
              versionReleaseDate={versionRelease.shortLabel}
              versionReleaseLive={versionRelease.live}
              headerActions={headerActions}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState<AppScreen>(() => migrateAppUrl());
  const [systemTab, setSystemTab] = useState(() => readSystemTab());

  useLayoutEffect(() => {
    const sync = () => {
      setScreen(readAppScreen());
      setSystemTab(readSystemTab());
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("system-display-change", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("system-display-change", sync);
    };
  }, []);

  const activeScreenId = resolveHubActiveScreenId(screen, systemTab);

  return (
    <HubAppLogProvider
      activeScreen={activeScreenId}
      bootLog={{ scope: "Tool", message: "Tool Hub started", screen: "dashboard" }}
    >
      <AppShellContent
        screen={screen}
        setScreen={setScreen}
        systemTab={systemTab}
        setSystemTab={setSystemTab}
      />
    </HubAppLogProvider>
  );
}

export default App;
