import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { readHubListPrefs } from "../../lib/url-prefs";
import type { ResolvedTool } from "../../types";
import { readSystemTab, type SystemTab } from "./components/SystemTabs";
import { SystemChromeContext } from "./system-chrome-context";
import { SystemTabHeader } from "./SystemTabHeader";
import { prefetchSupabaseQuotaCatalog } from "../../lib/hub-background-prefetch";
import { DesignTemplateHub } from "./design-template/DesignTemplateHub";
import { SystemOverviewPanel } from "./SystemOverviewPanel";
import { SystemSchemaPanel } from "./SystemSchemaPanel";
import { SystemSupabaseQuotaPanel } from "./SystemSupabaseQuotaPanel";
import { SystemAgentContextPanel } from "./SystemAgentContextPanel";

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
  if (!visited.has(tabId)) return null;
  const isActive = activeTab === tabId;
  return (
    <div className={isActive ? undefined : "hidden"} aria-hidden={!isActive}>
      {children}
    </div>
  );
}

export function SystemHubScreen({
  tools,
  headerActions,
}: SystemHubScreenProps) {
  const [tab, setTab] = useState<SystemTab>(() => readSystemTab());
  const [visited, setVisited] = useState<Set<SystemTab>>(() => new Set([readSystemTab()]));
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const [filterSlot, setFilterSlot] = useState<ReactNode>(null);

  useEffect(() => {
    const sync = () => {
      const next = readSystemTab();
      setTab(next);
      setVisited((prev) => new Set(prev).add(next));
      setPrefs(readHubListPrefs());
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    setVisited((prev) => new Set(prev).add(tab));
  }, [tab]);

  useEffect(() => {
    prefetchSupabaseQuotaCatalog();
  }, []);

  const stackChrome = prefs.searchPin && prefs.headerPin;
  const registerFilter = useCallback((node: ReactNode | null) => {
    setFilterSlot(node);
  }, []);
  const chromeValue = useMemo(() => ({ stackChrome, registerFilter }), [stackChrome, registerFilter]);

  const header = (
    <SystemTabHeader
      pinSticky={stackChrome ? false : prefs.headerPin}
      dividerBelow={stackChrome ? false : !prefs.searchPin}
      embedded={stackChrome}
      actions={headerActions}
    />
  );

  return (
    <SystemChromeContext.Provider value={chromeValue}>
      <div
        className="anim-fade relative"
        {...(prefs.searchPin ? { "data-search-pin": true } : {})}
        {...(prefs.headerPin ? { "data-header-pin": true } : {})}
      >
        {stackChrome ? (
          <div className="hub-chrome-sticky sticky top-0 z-40 -mx-6 border-b border-white/5 bg-[var(--bg)]">
            {header}
            {filterSlot}
          </div>
        ) : (
          header
        )}

        <div className="relative z-0">
          <TabPanel tabId="overview" activeTab={tab} visited={visited}>
            <SystemOverviewPanel tools={tools} />
          </TabPanel>
          <TabPanel tabId="schema" activeTab={tab} visited={visited}>
            <SystemSchemaPanel />
          </TabPanel>
          <TabPanel tabId="supabase-quota" activeTab={tab} visited={visited}>
            <SystemSupabaseQuotaPanel />
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
      </div>
    </SystemChromeContext.Provider>
  );
}

export { prefetchSystemTab } from "./system-tab-prefetch";
