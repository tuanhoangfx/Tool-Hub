import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FilterBar,
  KpiStrip,
  type FilterDef,
  type FilterValues,
  type KpiTileData,
} from "../../components/sales-shell";
import { readHubListPrefs } from "../../lib/url-prefs";
import { readSystemTab, type SystemTab } from "./components/SystemTabs";

const STACK_FILTER_TABS: SystemTab[] = ["supabase-quota", "agent"];
import {
  readSystemTabDisplay,
  systemDisplayDefs,
} from "./system-display-prefs";
import { useSystemChrome } from "./system-chrome-context";

function visibleSet(set: Set<string> | null, defaults: Set<string>) {
  return set ?? defaults;
}

export type SystemHubShellProps = {
  placeholder: string;
  filters?: FilterDef[];
  query: string;
  onQueryChange: (q: string) => void;
  values: FilterValues;
  onValuesChange: (v: FilterValues) => void;
  toolbar?: ReactNode;
  kpiItems: KpiTileData[];
  /** Render when matching chart pref keys (health_bar, category_bar, deploy_donut, status_donut). */
  charts?: ReactNode;
  children: ReactNode;
};

export function SystemHubShell({
  placeholder,
  filters = [],
  query,
  onQueryChange,
  values,
  onValuesChange,
  toolbar,
  kpiItems,
  charts,
  children,
}: SystemHubShellProps) {
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const [stab, setStab] = useState(readSystemTab);
  const [displayTick, setDisplayTick] = useState(0);
  const chrome = useSystemChrome();

  useEffect(() => {
    const sync = () => {
      setPrefs(readHubListPrefs());
      setStab(readSystemTab());
      setDisplayTick((n) => n + 1);
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("system-display-change", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("system-display-change", sync);
    };
  }, []);

  const displayDefs = useMemo(() => systemDisplayDefs(stab), [stab]);
  const tabDisplay = useMemo(() => {
    void displayTick;
    return readSystemTabDisplay(stab);
  }, [stab, displayTick]);
  const visKpi = visibleSet(tabDisplay.kpi, displayDefs.defaultKpiKeys);
  const visCharts = visibleSet(tabDisplay.charts, displayDefs.defaultChartKeys);
  const kpiVisible = kpiItems.filter((item) => {
    const key = item.prefKey;
    if (!key) return true;
    return visKpi.has(key);
  });
  const showCharts = charts && visCharts.size > 0;
  const hasAnalytics = kpiVisible.length > 0 || showCharts;

  const filterBar = useMemo(
    () => (
      <FilterBar
        layout="hub"
        pinSticky={chrome?.stackChrome ? false : prefs.searchPin}
        headerPinned={prefs.headerPin}
        embedded={Boolean(chrome?.stackChrome)}
        placeholder={placeholder}
        filters={filters}
        query={query}
        onQueryChange={onQueryChange}
        values={values}
        onValuesChange={onValuesChange}
        toolbar={toolbar}
      />
    ),
    [
      chrome?.stackChrome,
      prefs.searchPin,
      prefs.headerPin,
      placeholder,
      filters,
      query,
      values,
      toolbar,
      onQueryChange,
      onValuesChange,
    ],
  );

  useEffect(() => {
    if (!chrome?.stackChrome) {
      chrome?.registerFilter(null);
      return;
    }
    if (!STACK_FILTER_TABS.includes(stab)) {
      chrome.registerFilter(null);
      return;
    }
    chrome.registerFilter(filterBar);
    return () => chrome.registerFilter(null);
  }, [chrome, filterBar, stab]);

  const showFilterInline = !chrome?.stackChrome;

  return (
    <div className={`system-hub-shell anim-fade ${showFilterInline ? "space-y-4" : "space-y-4 pt-4"}`}>
      {showFilterInline ? filterBar : null}

      {hasAnalytics ? (
        <div className="mt-5 space-y-5">
          {kpiVisible.length > 0 ? <KpiStrip items={kpiVisible} /> : null}
          {showCharts ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{charts}</div> : null}
        </div>
      ) : null}

      <div className="system-hub-body">{children}</div>
    </div>
  );
}
