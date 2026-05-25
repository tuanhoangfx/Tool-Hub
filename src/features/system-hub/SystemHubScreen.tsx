import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { readHubListPrefs } from "../../lib/url-prefs";
import type { ResolvedTool } from "../../types";
import { SystemTabHeader } from "./SystemTabHeader";
import { SystemTabs, readSystemTab, type SystemTab } from "./components/SystemTabs";
import { computeSystemHeaderMetrics } from "./system-header-metrics";
import { DEFAULT_SYSTEM_HEADER_STAT_KEYS } from "./system-prefs";

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

function visibleSet(set: Set<string> | null, defaults: Set<string>) {
  return set ?? defaults;
}

type SystemHubScreenProps = {
  tools: ResolvedTool[];
  registryLive: boolean;
  registryLabel: string;
  versionReleaseDate: string;
  versionReleaseLive: boolean;
};

export function SystemHubScreen({
  tools,
  registryLive,
  registryLabel,
  versionReleaseDate,
  versionReleaseLive,
}: SystemHubScreenProps) {
  const [tab, setTab] = useState<SystemTab>(() => readSystemTab());
  const [prefs, setPrefs] = useState(readHubListPrefs);

  useEffect(() => {
    const sync = () => {
      setTab(readSystemTab());
      setPrefs(readHubListPrefs());
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const metrics = useMemo(() => computeSystemHeaderMetrics(tools.length), [tools.length]);
  const visHeaderStats = visibleSet(prefs.systemHeaderStats, DEFAULT_SYSTEM_HEADER_STAT_KEYS);

  return (
    <div className="anim-fade relative">
      <SystemTabHeader
        tab={tab}
        registryLive={registryLive}
        registryLabel={registryLabel}
        versionReleaseDate={versionReleaseDate}
        versionReleaseLive={versionReleaseLive}
        visibleHeaderStats={visHeaderStats}
        metrics={metrics}
        pinSticky={prefs.headerPin}
      />

      <div className="relative z-0 space-y-4">
        <SystemTabs tab={tab} onTab={setTab} />

        <div>
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
    </div>
  );
}
