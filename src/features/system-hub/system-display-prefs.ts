import type { PrefItem } from "../../components/sales-shell/DisplayPrefs";
import { DEFAULT_HUB_CHART_KEYS, HUB_CHART_DEFS, HUB_KPI_DEFS } from "../hub/hub-prefs";
import type { SystemTab } from "./components/SystemTabs";
import { readSystemTab } from "./components/SystemTabs";

const STORAGE_KEY = "tool-hub:system-display";

type TabDisplayStored = { kpi: string[] | null; charts: string[] | null };
type StoredMap = Partial<Record<SystemTab, TabDisplayStored>>;

export const SYSTEM_SCHEMA_KPI_DEFS: PrefItem[] = [
  { key: "fields", label: "Fields" },
  { key: "groups", label: "Groups" },
  { key: "input", label: "Input fields" },
  { key: "options", label: "With options" },
];

export const SYSTEM_SCHEMA_CHART_DEFS: PrefItem[] = [
  { key: "health_bar", label: "By mode (bar)" },
  { key: "category_bar", label: "By group (bar)" },
];

export const DEFAULT_SYSTEM_SCHEMA_KPI_KEYS = new Set(SYSTEM_SCHEMA_KPI_DEFS.map((d) => d.key));
export const DEFAULT_SYSTEM_SCHEMA_CHART_KEYS = new Set(["health_bar", "category_bar"]);

export const SYSTEM_TEMPLATE_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Templates" },
  { key: "locked", label: "Locked" },
  { key: "preview", label: "In preview" },
];

export const SYSTEM_TEMPLATE_CHART_DEFS: PrefItem[] = [
  { key: "status_donut", label: "Template status (donut)" },
];

export const DEFAULT_SYSTEM_TEMPLATE_KPI_KEYS = new Set(["total", "locked", "preview"]);
export const DEFAULT_SYSTEM_TEMPLATE_CHART_KEYS = new Set(["status_donut"]);

export const SYSTEM_SUPABASE_QUOTA_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Projects (shown)" },
  { key: "orgs", label: "Organizations" },
  { key: "errors", label: "Errors" },
  { key: "restricted", label: "Restricted" },
  { key: "api_total", label: "API requests (sum)" },
  { key: "api_rest", label: "REST / min (sum)" },
];

export const SYSTEM_SUPABASE_QUOTA_CHART_DEFS: PrefItem[] = [
  { key: "category_bar", label: "By region (bar)" },
  { key: "health_bar", label: "By plan (bar)" },
];

export const DEFAULT_SYSTEM_SUPABASE_QUOTA_KPI_KEYS = new Set([
  "total",
  "orgs",
  "errors",
  "restricted",
  "api_total",
]);
export const DEFAULT_SYSTEM_SUPABASE_QUOTA_CHART_KEYS = new Set(["category_bar", "health_bar"]);

export const SYSTEM_AGENT_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Items (shown)" },
  { key: "rules", label: "Rules" },
  { key: "skills", label: "Skills" },
  { key: "always", label: "Always on" },
];

export const SYSTEM_AGENT_CHART_DEFS: PrefItem[] = [
  { key: "health_bar", label: "By kind (bar)" },
  { key: "category_bar", label: "By scope (bar)" },
  { key: "deploy_donut", label: "Apply mode (donut)" },
  { key: "status_donut", label: "Size (lines) (donut)" },
];

export const DEFAULT_SYSTEM_AGENT_KPI_KEYS = new Set(["total", "rules", "skills", "always"]);
export const DEFAULT_SYSTEM_AGENT_CHART_KEYS = new Set([
  "health_bar",
  "category_bar",
  "deploy_donut",
  "status_donut",
]);

/** Overview hides all KPI and chart cards by default. */
export const DEFAULT_SYSTEM_OVERVIEW_KPI_KEYS = new Set<string>();
export const DEFAULT_SYSTEM_OVERVIEW_CHART_KEYS = new Set<string>();

export const SYSTEM_SERVER_KPI_DEFS: PrefItem[] = [
  { key: "host", label: "VPS host" },
  { key: "ready", label: "Ready" },
  { key: "releases", label: "With release" },
  { key: "drift", label: "Drift alerts" },
];

export const DEFAULT_SYSTEM_SERVER_KPI_KEYS = new Set(SYSTEM_SERVER_KPI_DEFS.map((d) => d.key));

function loadStored(): StoredMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredMap) : {};
  } catch {
    return {};
  }
}

function saveStored(map: StoredMap) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function systemDisplayDefs(stab: SystemTab = readSystemTab()) {
  switch (stab) {
    case "schema":
      return {
        kpis: SYSTEM_SCHEMA_KPI_DEFS,
        charts: SYSTEM_SCHEMA_CHART_DEFS,
        defaultKpiKeys: DEFAULT_SYSTEM_SCHEMA_KPI_KEYS,
        defaultChartKeys: DEFAULT_SYSTEM_SCHEMA_CHART_KEYS,
      };
    case "supabase-quota":
      return {
        kpis: SYSTEM_SUPABASE_QUOTA_KPI_DEFS,
        charts: SYSTEM_SUPABASE_QUOTA_CHART_DEFS,
        defaultKpiKeys: DEFAULT_SYSTEM_SUPABASE_QUOTA_KPI_KEYS,
        defaultChartKeys: DEFAULT_SYSTEM_SUPABASE_QUOTA_CHART_KEYS,
      };
    case "server":
      return {
        kpis: SYSTEM_SERVER_KPI_DEFS,
        charts: HUB_CHART_DEFS,
        defaultKpiKeys: DEFAULT_SYSTEM_SERVER_KPI_KEYS,
        defaultChartKeys: DEFAULT_HUB_CHART_KEYS,
      };
    case "agent":
      return {
        kpis: SYSTEM_AGENT_KPI_DEFS,
        charts: SYSTEM_AGENT_CHART_DEFS,
        defaultKpiKeys: DEFAULT_SYSTEM_AGENT_KPI_KEYS,
        defaultChartKeys: DEFAULT_SYSTEM_AGENT_CHART_KEYS,
      };
    case "template":
      return {
        kpis: SYSTEM_TEMPLATE_KPI_DEFS,
        charts: SYSTEM_TEMPLATE_CHART_DEFS,
        defaultKpiKeys: DEFAULT_SYSTEM_TEMPLATE_KPI_KEYS,
        defaultChartKeys: DEFAULT_SYSTEM_TEMPLATE_CHART_KEYS,
      };
    default:
      return {
        kpis: HUB_KPI_DEFS,
        charts: HUB_CHART_DEFS,
        defaultKpiKeys: DEFAULT_SYSTEM_OVERVIEW_KPI_KEYS,
        defaultChartKeys: DEFAULT_SYSTEM_OVERVIEW_CHART_KEYS,
      };
  }
}

export function readSystemTabDisplay(stab: SystemTab = readSystemTab()): {
  kpi: Set<string> | null;
  charts: Set<string> | null;
} {
  const row = loadStored()[stab];
  return {
    kpi: row?.kpi == null ? null : new Set(row.kpi),
    charts: row?.charts == null ? null : new Set(row.charts),
  };
}

export function patchSystemTabDisplay(
  stab: SystemTab,
  patch: Partial<{ kpi: string[] | null; charts: string[] | null }>,
) {
  const map = loadStored();
  const prev = map[stab] ?? { kpi: null, charts: null };
  map[stab] = { ...prev, ...patch };
  saveStored(map);
  window.dispatchEvent(new CustomEvent("system-display-change"));
}

export function resetSystemTabDisplay(stab?: SystemTab) {
  const map = loadStored();
  if (stab) {
    delete map[stab];
  } else {
    for (const key of Object.keys(map) as SystemTab[]) delete map[key];
  }
  saveStored(map);
  window.dispatchEvent(new CustomEvent("system-display-change"));
}
