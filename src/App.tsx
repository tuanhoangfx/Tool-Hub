import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { FileText } from "lucide-react";
import { DisplayPrefs, SalesSidebar } from "./components/sales-shell";
import type { HubViewMode } from "./components/sales-shell";
import { readSystemTab } from "./features/system-hub/components/SystemTabs";
import { systemDisplayDefs } from "./features/system-hub/system-display-prefs";
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
import { compactIconSize } from "./lib/ui-scale";
import { runWorkspaceScan } from "./services/workspace-scan";

const AUTO_REFRESH_MS = 12 * 60 * 60 * 1000;
type ScanStatus = "idle" | "scanning" | "success" | "error";

type AppLogEntry = {
  id: string;
  at: number;
  scope: string;
  message: string;
};

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
  const defs = !isGlobal && screen === "system" ? systemDisplayDefs(systemTab) : null;

  return (
    <DisplayPrefs
      kpis={isGlobal ? undefined : defs?.kpis ?? HUB_KPI_DEFS}
      charts={isGlobal ? undefined : defs?.charts ?? HUB_CHART_DEFS}
      filters={isGlobal || screen === "system" ? undefined : HUB_FILTER_DEFS}
      defaultKpiKeys={defs?.defaultKpiKeys ?? DEFAULT_HUB_KPI_KEYS}
      defaultChartKeys={defs?.defaultChartKeys ?? DEFAULT_HUB_CHART_KEYS}
      defaultFilterKeys={DEFAULT_HUB_FILTER_KEYS}
      showRange={false}
      showLimit={!isGlobal && screen !== "system"}
      showHeaderPin={isGlobal}
      sidebarRow={sidebarRow}
      scope={scope}
    />
  );
}

function AppLogButton({ logs }: { logs: AppLogEntry[] }) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [],
  );

  useLayoutEffect(() => {
    if (!open || !ref.current) return;

    const update = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const mainRect = document.querySelector(".hub-main")?.getBoundingClientRect();
      const minLeft = Math.max(8, (mainRect?.left ?? 0) + 8);
      const availableWidth = Math.max(160, window.innerWidth - minLeft - 8);
      const width = Math.min(320, availableWidth);
      const left = Math.min(Math.max(rect.right - width, minLeft), window.innerWidth - width - 8);
      setPanelStyle({
        position: "fixed",
        left,
        top: rect.bottom + 6,
        width,
        zIndex: 1100,
        maxHeight: "min(70vh, 28rem)",
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="btn btn-ghost inline-flex items-center gap-1.5 px-2.5"
        title="Usage log"
        onClick={() => setOpen((value) => !value)}
      >
        <FileText size={compactIconSize(14)} className="text-cyan-300" aria-hidden />
        <span className="hidden sm:inline">Log</span>
      </button>
      {open
        ? createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="rounded-xl border border-white/10 bg-[var(--bg)] p-3 shadow-2xl shadow-black/40"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[var(--text)]">Usage log</div>
              <div className="text-[10px] text-[var(--muted)]">Runtime actions in this session</div>
            </div>
            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
              {logs.length}
            </span>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-white/5 bg-white/[.025] px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--muted)]">
                    <span>{log.scope}</span>
                    <span className="tabular-nums">{formatter.format(log.at)}</span>
                  </div>
                  <div className="mt-0.5 text-xs leading-snug text-[var(--text)]/90">{log.message}</div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 px-3 py-5 text-center text-xs text-[var(--muted)]">
                Chưa có thao tác trong phiên này.
              </div>
            )}
          </div>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}

function AppHeaderActions({ logs }: { logs: AppLogEntry[] }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <AppDisplayPrefs scope="tab" />
      <AppLogButton logs={logs} />
    </div>
  );
}

function App() {
  const { state: urlState, update: updateUrl } = useUrlState();
  const [screen, setScreen] = useState<AppScreen>(() => readAppScreen());
  const [viewMode, setViewMode] = useSessionState<"grid" | "table">("lib:viewMode", "grid");
  const [scanningWorkspace, setScanningWorkspace] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanMessage, setScanMessage] = useState("");
  const [logs, setLogs] = useState<AppLogEntry[]>(() => [
    {
      id: `boot-${Date.now()}`,
      at: Date.now(),
      scope: "Tool",
      message: "Tool Hub started",
    },
  ]);
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

  const addLog = useCallback((scope: string, message: string) => {
    setLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        at: Date.now(),
        scope,
        message,
      },
      ...prev,
    ].slice(0, 30));
  }, []);

  const settleScanStatus = useCallback((status: ScanStatus, message: string) => {
    setScanStatus(status);
    setScanMessage(message);
    if (status === "scanning") return;
    window.setTimeout(() => {
      setScanStatus("idle");
      setScanMessage("");
    }, 10_000);
  }, []);

  useEffect(() => {
    const onPop = () => setScreen(readAppScreen());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const onLog = (event: Event) => {
      const detail = (event as CustomEvent<{ scope?: string; message?: string }>).detail;
      addLog(detail?.scope ?? "Tool", detail?.message ?? "Updated settings");
    };
    window.addEventListener("tool-hub-log", onLog);
    return () => window.removeEventListener("tool-hub-log", onLog);
  }, [addLog]);

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
    addLog("Hub", `Opened ${id} detail`);
    setSelectedId(id);
    updateUrl({ tool: id, detail: true });
    void prefetchRemote(id);
  };

  const handleCloseDetail = () => {
    addLog("Hub", "Closed tool detail");
    updateUrl({ detail: false });
  };

  const navigate = (next: AppScreen) => {
    if (next !== screen) addLog("Navigation", `Switched to ${next === "system" ? "System" : "Hub"}`);
    setAppScreen(next);
    setScreen(next);
  };

  const handleScanWorkspace = async () => {
    if (scanningWorkspace) return;
    setScanningWorkspace(true);
    settleScanStatus("scanning", "Scanning workspace via local launcher...");
    addLog("Tool", "Workspace scan requested");
    try {
      const result = await runWorkspaceScan();
      if (!result.ok) {
        const message = `${result.message ?? "Workspace scan failed"}; loaded existing registry if available`;
        settleScanStatus("error", message);
        addLog("Tool", message);
        await loadLocalRegistry();
        return;
      }
      const message = "Workspace scan completed; registry reloaded";
      settleScanStatus("success", message);
      addLog("Tool", message);
      await loadLocalRegistry();
    } finally {
      setScanningWorkspace(false);
    }
  };

  const handleRefreshAll = () => {
    addLog("Tool", "Refresh all requested");
    void refreshAll();
  };

  const handleRefreshTool = (id: string) => {
    addLog("Hub", `Refresh ${id} requested`);
    void refreshTool(id);
  };

  const handleViewModeChange = (next: HubViewMode) => {
    addLog("Hub", `Switched view to ${next === "card" ? "Cards" : "Table"}`);
    setViewMode(next === "card" ? "grid" : "table");
  };

  const registryLive = Boolean(localRegistry?.generatedAt) && !registryError;
  const registryLabel = registryLive ? formatDate(localRegistry!.generatedAt) : "";

  const hubSelf = useMemo(() => resolvedTools.find((t) => t.code === "P0004"), [resolvedTools]);
  const versionRelease = useMemo(() => resolveVersionReleaseMeta(hubSelf), [hubSelf]);
  const headerActions = <AppHeaderActions logs={logs} />;

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
        onScanWorkspace={() => void handleScanWorkspace()}
        onRefreshAll={handleRefreshAll}
        displayPrefs={<AppDisplayPrefs sidebarRow scope="global" />}
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
              headerActions={headerActions}
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
        )}
      </main>
    </div>
  );
}

export default App;
