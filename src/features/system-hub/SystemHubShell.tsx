import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  FilterBar,
  HubTabScreenBody,
  hubSystemShortcutScope,
  type FilterDef,
  type FilterValues,
  type KpiTileData,
} from "@tool-workspace/hub-ui";
import { readHubListPrefs } from "../../lib/url-prefs";
import { SYSTEM_TAB_ITEMS, type SystemTab } from "./components/SystemTabs";
import { useSystemChrome } from "./system-chrome-context";
import { useRegisterSystemTabFilter } from "./system-filter-registry";
import {
  buildSystemChartsBand,
  filterKpiByDisplay,
  useSystemTabDisplayState,
  type SystemChartSlots,
} from "./system-tab-analytics";

export type SystemHubShellProps = {
  /** System sub-tab id — drives sticky filter portal + Display prefs scope. */
  tabId: SystemTab;
  placeholder?: string;
  filters?: FilterDef[];
  query?: string;
  onQueryChange?: (q: string) => void;
  values?: FilterValues;
  onValuesChange?: (v: FilterValues) => void;
  toolbar?: ReactNode;
  kpiItems?: KpiTileData[];
  chartSlots?: SystemChartSlots;
  /** Override pill between analytics and body (default: tab label from SYSTEM_TAB_ITEMS). */
  sectionRuleLabel?: string;
  /** Hide search/filter row (e.g. Design Template). */
  showFilter?: boolean;
  children: ReactNode;
};

export function SystemHubShell({
  tabId,
  placeholder = "Search…",
  filters = [],
  query = "",
  onQueryChange,
  values = {},
  onValuesChange,
  toolbar,
  kpiItems = [],
  chartSlots = {},
  sectionRuleLabel,
  showFilter = true,
  children,
}: SystemHubShellProps) {
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const chrome = useSystemChrome();
  const { visKpi, visCharts, isActiveTab } = useSystemTabDisplayState(tabId);

  useEffect(() => {
    const sync = () => setPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const kpiVisible = useMemo(() => filterKpiByDisplay(kpiItems, visKpi), [kpiItems, visKpi]);
  const chartsBand = useMemo(
    () => buildSystemChartsBand(visCharts, chartSlots),
    [visCharts, chartSlots],
  );

  const ruleLabel =
    sectionRuleLabel ?? SYSTEM_TAB_ITEMS.find((t) => t.id === tabId)?.label ?? "Data";

  const filterBar = useMemo(
    () =>
      showFilter && onQueryChange ? (
        <FilterBar
          shortcutScope={hubSystemShortcutScope(tabId)}
          layout="hub"
          pinSticky={chrome?.stackChrome ? false : prefs.searchPin}
          headerPinned={prefs.headerPin}
          embedded={Boolean(chrome?.stackChrome)}
          placeholder={placeholder}
          filters={filters}
          query={query}
          onQueryChange={onQueryChange}
          values={values}
          onValuesChange={onValuesChange ?? (() => {})}
          toolbar={toolbar}
        />
      ) : null,
    [
      showFilter,
      onQueryChange,
      tabId,
      chrome?.stackChrome,
      prefs.searchPin,
      prefs.headerPin,
      placeholder,
      filters,
      query,
      values,
      toolbar,
      onValuesChange,
    ],
  );

  const portalFilter =
    Boolean(showFilter) &&
    Boolean(chrome?.stackChrome) &&
    Boolean(chrome?.filterAnchorReady) &&
    isActiveTab &&
    chrome?.filterAnchorRef.current != null &&
    filterBar != null;

  const filterChrome =
    portalFilter && chrome?.filterAnchorRef.current
      ? createPortal(filterBar, chrome.filterAnchorRef.current)
      : null;

  useRegisterSystemTabFilter(tabId, filterBar, {
    enabled: showFilter,
    stacked: Boolean(chrome?.stackChrome),
    isActiveTab,
  });

  return (
    <>
      {filterChrome}
      <HubTabScreenBody
        embedded
        kpis={kpiVisible}
        charts={chartsBand}
        sectionRuleLabel={ruleLabel}
      >
        {children}
      </HubTabScreenBody>
    </>
  );
}
