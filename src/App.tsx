import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { DisplayPrefs, SalesSidebar } from "./components/sales-shell";
import type { HubViewMode } from "./components/sales-shell";
import {
  DEFAULT_HUB_CHART_KEYS,
  DEFAULT_HUB_FILTER_KEYS,
  DEFAULT_HUB_KPI_KEYS,
  HUB_CHART_DEFS,
  HUB_FILTER_DEFS,
  HUB_KPI_DEFS,
} from "./features/hub/hub-prefs";
import { HubListPage } from "./features/hub";

const SystemHubScreen = lazy(() =>
  import("./features/system-hub/SystemHubScreen").then((m) => ({ default: m.SystemHubScreen })),
);
import { useRepositories, useSessionState, useUrlState } from "./hooks";
import { readAppScreen, setAppScreen, type AppScreen } from "./lib/app-screen";
import { resolveVersionReleaseMeta } from "./lib/app-release";
import { formatDate } from "./lib/tooling";

const AUTO_REFRESH_MS = 12 * 60 * 60 * 1000;

const sidebarDisplayPrefs = (
  <DisplayPrefs
    kpis={HUB_KPI_DEFS}
    charts={HUB_CHART_DEFS}
    filters={HUB_FILTER_DEFS}
    defaultKpiKeys={DEFAULT_HUB_KPI_KEYS}
    defaultChartKeys={DEFAULT_HUB_CHART_KEYS}
    defaultFilterKeys={DEFAULT_HUB_FILTER_KEYS}
    showRange={false}
    showHeaderPin
    sidebarRow
  />
);

function App() {
  const { state: urlState, update: updateUrl } = useUrlState();
  const [screen, setScreen] = useState<AppScreen>(() => readAppScreen());
  const [viewMode, setViewMode] = useSessionState<"grid" | "table">("lib:viewMode", "grid");
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshAll();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refreshAll]);

  const handleSelectTool = (id: string) => {
    setSelectedId(id);
    updateUrl({ tool: id, detail: true });
    void prefetchRemote(id);
  };

  const handleCloseDetail = () => {
    updateUrl({ detail: false });
  };

  const navigate = (next: AppScreen) => {
    setAppScreen(next);
    setScreen(next);
  };

  const registryLive = Boolean(localRegistry?.generatedAt) && !registryError;
  const registryLabel = registryLive ? formatDate(localRegistry!.generatedAt) : "No registry";

  const hubSelf = useMemo(() => resolvedTools.find((t) => t.code === "P0004"), [resolvedTools]);
  const versionRelease = useMemo(() => resolveVersionReleaseMeta(hubSelf), [hubSelf]);

  return (
    <div className="hub-app theme-hub flex h-full min-h-0 w-full overflow-hidden">
      <SalesSidebar
        screen={screen}
        onNavigate={navigate}
        loadingAll={loadingAll}
        onLoadRegistry={() => void loadLocalRegistry()}
        onRefreshAll={() => void refreshAll()}
        displayPrefs={sidebarDisplayPrefs}
      />

      <main className="hub-main flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
        {screen === "system" ? (
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--muted)]">
                Loading System…
              </div>
            }
          >
            <SystemHubScreen
              tools={resolvedTools}
              registryLive={registryLive}
              registryLabel={registryLabel}
              versionReleaseDate={versionRelease.shortLabel}
              versionReleaseLive={versionRelease.live}
            />
          </Suspense>
        ) : (
          <HubListPage
            allTools={resolvedTools}
            selectedId={selectedId}
            onSelect={handleSelectTool}
            modalOpen={urlState.detail}
            onCloseModal={handleCloseDetail}
            loadingAll={loadingAll}
            registryError={registryError}
            onRefresh={() => void refreshAll()}
            onRefreshTool={(id) => void refreshTool(id)}
            viewMode={hubView}
            onViewModeChange={(v) => setViewMode(v === "card" ? "grid" : "table")}
            registryLive={registryLive}
            registryLabel={registryLabel}
            versionReleaseDate={versionRelease.shortLabel}
            versionReleaseLive={versionRelease.live}
          />
        )}
      </main>
    </div>
  );
}

export default App;
