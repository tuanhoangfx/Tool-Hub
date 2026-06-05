import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HubTabChrome } from "@tool-workspace/hub-ui";
import { readHubListPrefs } from "../../lib/url-prefs";
import type { ResolvedTool } from "../../types";
import { readSystemTab, type SystemTab } from "./components/SystemTabs";
import { SystemChromeContext } from "./system-chrome-context";
import { SystemFilterBarOutlet, SystemFilterRegistryProvider } from "./system-filter-registry";
import { SystemTabHeader } from "./SystemTabHeader";
import {
  buildSystemHeaderStats,
  defaultSystemHeaderStatKeys,
} from "./system-header-metrics";
import { prefetchSupabaseQuotaCatalog } from "../../lib/hub-background-prefetch";
import { SUPABASE_QUOTA_UPDATED_EVENT } from "./supabase-quota-events";
import { AGENT_MANIFEST_REFRESH_EVENT } from "./agent-manifest-events";
import { DesignTemplateHub } from "./design-template/DesignTemplateHub";
import { SystemOverviewPanel } from "./SystemOverviewPanel";
import { SystemSchemaPanel } from "./SystemSchemaPanel";
import { SystemSupabaseQuotaPanel } from "./SystemSupabaseQuotaPanel";
import { SystemAgentContextPanel } from "./SystemAgentContextPanel";
import { SystemServerPanel } from "./SystemServerPanel";

type SystemHubScreenProps = {
  tools: ResolvedTool[];
  registryLive: boolean;
  registryLabel: string;
  versionReleaseDate: string;
  versionReleaseLive: boolean;
  headerActions?: ReactNode;
};

function TabPanel({
  tabId,
  activeTab,
  visited,
  children,
}: {
  tabId: SystemTab;
  activeTab: SystemTab;
  visited: Set<SystemTab>;
  children: ReactNode;
}) {
  const isActive = activeTab === tabId;
  if (!isActive && !visited.has(tabId)) return null;
  return (
    <div className={isActive ? undefined : "hidden"} aria-hidden={!isActive}>
      {children}
    </div>
  );
}

function visibleHeaderStats(set: Set<string> | null, defaults: Set<string>) {
  return set ?? defaults;
}

export function SystemHubScreen({
  tools,
  versionReleaseDate,
  headerActions,
}: SystemHubScreenProps) {
  const [tab, setTab] = useState<SystemTab>(() => readSystemTab());
  const [visited, setVisited] = useState<Set<SystemTab>>(() => new Set([readSystemTab()]));
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const filterAnchorRef = useRef<HTMLDivElement | null>(null);
  const [filterAnchorReady, setFilterAnchorReady] = useState(false);

  useLayoutEffect(() => {
    const sync = () => {
      const next = readSystemTab();
      setTab(next);
      setVisited((prev) => {
        const merged = new Set(prev);
        merged.add(next);
        return merged;
      });
      setPrefs(readHubListPrefs());
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    setVisited((prev) => new Set(prev).add(tab));
  }, [tab]);

  useEffect(() => {
    prefetchSupabaseQuotaCatalog();
  }, []);

  const [headerTick, setHeaderTick] = useState(0);

  useEffect(() => {
    const bump = () => setHeaderTick((n) => n + 1);
    window.addEventListener(SUPABASE_QUOTA_UPDATED_EVENT, bump);
    window.addEventListener(AGENT_MANIFEST_REFRESH_EVENT, bump);
    return () => {
      window.removeEventListener(SUPABASE_QUOTA_UPDATED_EVENT, bump);
      window.removeEventListener(AGENT_MANIFEST_REFRESH_EVENT, bump);
    };
  }, []);

  const stackChrome = prefs.searchPin && prefs.headerPin;

  const centerStats = useMemo(() => {
    void headerTick;
    const keys = visibleHeaderStats(prefs.systemHeaderStats, defaultSystemHeaderStatKeys(tab));
    return buildSystemHeaderStats(tab, tools, keys);
  }, [prefs.systemHeaderStats, tab, tools, headerTick]);

  const bindFilterAnchor = useCallback((node: HTMLDivElement | null) => {
    filterAnchorRef.current = node;
    setFilterAnchorReady(node != null);
  }, []);

  const chromeValue = useMemo(
    () => ({ stackChrome, filterAnchorRef, filterAnchorReady }),
    [stackChrome, filterAnchorReady],
  );

  const header = (
    <SystemTabHeader
      versionReleaseDate={versionReleaseDate}
      centerStats={centerStats}
      pinSticky={stackChrome ? false : prefs.headerPin}
      dividerBelow={stackChrome ? false : !prefs.searchPin}
      embedded={stackChrome}
      actions={headerActions}
    />
  );

  const filterBar = stackChrome ? (
    <div ref={bindFilterAnchor} className="system-filter-portal" />
  ) : (
    <SystemFilterBarOutlet tabId={tab} />
  );

  return (
    <SystemFilterRegistryProvider>
      <SystemChromeContext.Provider value={chromeValue}>
        <HubTabChrome header={header} filterBar={filterBar}>
          <div className="hub-tab-content-zone relative z-0">
          <TabPanel tabId="overview" activeTab={tab} visited={visited}>
            <SystemOverviewPanel tools={tools} />
          </TabPanel>
          <TabPanel tabId="schema" activeTab={tab} visited={visited}>
            <SystemSchemaPanel />
          </TabPanel>
          <TabPanel tabId="supabase-quota" activeTab={tab} visited={visited}>
            <SystemSupabaseQuotaPanel />
          </TabPanel>
          <TabPanel tabId="server" activeTab={tab} visited={visited}>
            <SystemServerPanel tools={tools} />
          </TabPanel>
          <TabPanel tabId="agent" activeTab={tab} visited={visited}>
            <SystemAgentContextPanel />
          </TabPanel>
          {visited.has("template") ? (
            <div className={tab === "template" ? undefined : "hidden"} aria-hidden={tab !== "template"}>
              <DesignTemplateHub />
            </div>
          ) : null}
          </div>
        </HubTabChrome>
      </SystemChromeContext.Provider>
    </SystemFilterRegistryProvider>
  );
}

export { prefetchSystemTab } from "./system-tab-prefetch";
