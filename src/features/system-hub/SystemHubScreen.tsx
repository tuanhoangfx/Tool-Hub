import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { readHubListPrefs } from "../../lib/url-prefs";
import type { ResolvedTool } from "../../types";
import { readSystemTab, type SystemTab } from "./components/SystemTabs";
import { SystemChromeContext } from "./system-chrome-context";
import { SystemTabHeader } from "./SystemTabHeader";

const SystemOverviewPanel = lazy(() =>
  import("./SystemOverviewPanel").then((m) => ({ default: m.SystemOverviewPanel })),
);
const SystemSchemaPanel = lazy(() =>
  import("./SystemSchemaPanel").then((m) => ({ default: m.SystemSchemaPanel })),
);
import { DesignTemplateHub } from "./design-template/DesignTemplateHub";

function SystemTabFallback({ label }: { label: string }) {
  return (
    <div className="flex min-h-[12rem] items-center justify-center rounded-xl border border-white/5 bg-white/[.02] py-12 text-sm text-[var(--muted)]">
      Loading {label}…
    </div>
  );
}

type SystemHubScreenProps = {
  tools: ResolvedTool[];
  registryLive: boolean;
  registryLabel: string;
  versionReleaseDate: string;
  versionReleaseLive: boolean;
  headerActions?: ReactNode;
};

export function SystemHubScreen({
  tools,
  headerActions,
}: SystemHubScreenProps) {
  const [tab, setTab] = useState<SystemTab>(() => readSystemTab());
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const [filterSlot, setFilterSlot] = useState<ReactNode>(null);

  useEffect(() => {
    const sync = () => {
      setTab(readSystemTab());
      setPrefs(readHubListPrefs());
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
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
          {tab === "overview" ? (
            <Suspense fallback={<SystemTabFallback label="overview" />}>
              <SystemOverviewPanel tools={tools} />
            </Suspense>
          ) : null}
          {tab === "schema" ? (
            <Suspense fallback={<SystemTabFallback label="schema" />}>
              <SystemSchemaPanel />
            </Suspense>
          ) : null}
          {tab === "template" ? <DesignTemplateHub /> : null}
        </div>
      </div>
    </SystemChromeContext.Provider>
  );
}
