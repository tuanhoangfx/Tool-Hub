import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { KpiTileData } from "@tool-workspace/hub-ui";
import { readSystemTab, type SystemTab } from "./components/SystemTabs";
import { readSystemTabDisplay, systemDisplayDefs } from "./system-display-prefs";

/** Chart slot keys — same as Hub / DisplayPrefs (`health_bar`, …). */
export const SYSTEM_CHART_SLOT_KEYS = [
  "health_bar",
  "category_bar",
  "deploy_donut",
  "status_donut",
] as const;

export type SystemChartSlotKey = (typeof SYSTEM_CHART_SLOT_KEYS)[number];

export type SystemChartSlots = Partial<Record<SystemChartSlotKey, ReactNode>>;

function visibleSet(set: Set<string> | null, defaults: Set<string>) {
  return set ?? defaults;
}

export function useSystemTabDisplayState(tabId: SystemTab) {
  const [stab, setStab] = useState(readSystemTab);
  const [displayTick, setDisplayTick] = useState(0);

  useEffect(() => {
    const sync = () => {
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

  const displayDefs = useMemo(() => systemDisplayDefs(tabId), [tabId]);
  const tabDisplay = useMemo(() => {
    void displayTick;
    return readSystemTabDisplay(tabId);
  }, [tabId, displayTick]);

  const visKpi = visibleSet(tabDisplay.kpi, displayDefs.defaultKpiKeys);
  const visCharts = visibleSet(tabDisplay.charts, displayDefs.defaultChartKeys);
  const isActiveTab = stab === tabId;

  return { visKpi, visCharts, displayDefs, isActiveTab };
}

export function filterKpiByDisplay(items: KpiTileData[], visKpi: Set<string>) {
  return items.filter((item) => {
    const key = item.prefKey;
    if (!key) return true;
    return visKpi.has(key);
  });
}

/** Hub-identical charts grid — visibility from System → Display prefs per tab. */
export function buildSystemChartsBand(
  visCharts: Set<string>,
  slots: SystemChartSlots,
): ReactNode | undefined {
  const nodes = SYSTEM_CHART_SLOT_KEYS.filter((key) => visCharts.has(key) && slots[key]).map(
    (key) => slots[key],
  );
  if (nodes.length === 0) return undefined;
  return <>{nodes}</>;
}
