import type { PrefItem } from "../../components/sales-shell/DisplayPrefs";
import { migrateChartKeyList } from "@tool-workspace/hub-ui";
import { DEFAULT_HUB_CHART_KEYS, HUB_CHART_DEFS, HUB_KPI_DEFS } from "../hub/hub-prefs";
import { defaultKpiKeysFromDefs } from "../../lib/kpi-display-defaults";
import type { SystemTab } from "./components/SystemTabs";
import { readSystemTab } from "./components/SystemTabs";

const STORAGE_KEY = "tool-hub:system-display";

type TabDisplayStored = { kpi: string[] | null; charts: string[] | null };
type StoredMap = Partial<Record<SystemTab, TabDisplayStored>>;

export const SYSTEM_SCHEMA_KPI_DEFS: PrefItem[] = [
  { key: "fields", label: "Fields (shown)" },
  { key: "groups", label: "Groups" },
  { key: "input", label: "Input fields" },
  { key: "options", label: "With options" },
  { key: "pk", label: "Primary keys" },
  { key: "auto", label: "Auto fields" },
  { key: "derive", label: "Derived / compute" },
  { key: "readonly", label: "Read-only" },
];

export const SYSTEM_SCHEMA_CHART_DEFS: PrefItem[] = [
  { key: "health_bar", label: "By mode (bar)" },
  { key: "category_bar", label: "By group (bar)" },
];

export const DEFAULT_SYSTEM_SCHEMA_KPI_KEYS = defaultKpiKeysFromDefs(SYSTEM_SCHEMA_KPI_DEFS);
export const DEFAULT_SYSTEM_SCHEMA_CHART_KEYS = new Set(["health_bar", "category_bar"]);

export const SYSTEM_TEMPLATE_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Templates" },
  { key: "locked", label: "Locked" },
  { key: "preview", label: "In preview" },
  { key: "draft", label: "Draft" },
  { key: "published", label: "Published" },
  { key: "variants", label: "Variants" },
  { key: "features", label: "Features" },
  { key: "archived", label: "Archived" },
];

export const SYSTEM_TEMPLATE_CHART_DEFS: PrefItem[] = [
  { key: "status_bar", label: "Template status (bar)" },
];

export const DEFAULT_SYSTEM_TEMPLATE_KPI_KEYS = defaultKpiKeysFromDefs(SYSTEM_TEMPLATE_KPI_DEFS);
export const DEFAULT_SYSTEM_TEMPLATE_CHART_KEYS = new Set(["status_bar"]);

export const SYSTEM_SUPABASE_QUOTA_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Projects (shown)" },
  { key: "metrics", label: "Live metrics" },
  { key: "catalog", label: "Catalog only" },
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

export const DEFAULT_SYSTEM_SUPABASE_QUOTA_KPI_KEYS = defaultKpiKeysFromDefs(SYSTEM_SUPABASE_QUOTA_KPI_DEFS);
export const DEFAULT_SYSTEM_SUPABASE_QUOTA_CHART_KEYS = new Set(["category_bar", "health_bar"]);

export const SYSTEM_AGENT_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Items (shown)" },
  { key: "rules", label: "Rules" },
  { key: "skills", label: "Skills" },
  { key: "patterns", label: "Patterns" },
  { key: "agents", label: "Subagents" },
  { key: "commands", label: "Commands" },
  { key: "always", label: "Always on" },
  { key: "requestable", label: "Agent requestable" },
];

export const SYSTEM_AGENT_CHART_DEFS: PrefItem[] = [
  { key: "health_bar", label: "By kind (bar)" },
  { key: "category_bar", label: "By scope (bar)" },
  { key: "deploy_bar", label: "Apply mode (bar)" },
  { key: "status_bar", label: "Size (lines) (bar)" },
];

export const DEFAULT_SYSTEM_AGENT_KPI_KEYS = defaultKpiKeysFromDefs(SYSTEM_AGENT_KPI_DEFS);
export const DEFAULT_SYSTEM_AGENT_CHART_KEYS = new Set([
  "health_bar",
  "category_bar",
  "deploy_bar",
  "status_bar",
]);

/** Overview: all KPI/chart defs available in Display prefs, hidden by default. */
export const DEFAULT_SYSTEM_OVERVIEW_KPI_KEYS = new Set<string>();
export const DEFAULT_SYSTEM_OVERVIEW_CHART_KEYS = new Set<string>();

export const SYSTEM_SERVER_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Deployments (shown)" },
  { key: "metrics", label: "Live URL" },
  { key: "catalog", label: "No public URL" },
  { key: "orgs", label: "Hosts" },
  { key: "errors", label: "Errors" },
  { key: "restricted", label: "Drift alerts" },
  { key: "api_total", label: "Tools linked" },
  { key: "api_rest", label: "Ready" },
];

export const SYSTEM_SERVER_CHART_DEFS: PrefItem[] = [
  { key: "category_bar", label: "By provider (bar)" },
  { key: "health_bar", label: "By health (bar)" },
];

export const DEFAULT_SYSTEM_SERVER_KPI_KEYS = defaultKpiKeysFromDefs(SYSTEM_SERVER_KPI_DEFS);
export const DEFAULT_SYSTEM_SERVER_CHART_KEYS = new Set(["category_bar", "health_bar"]);

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
        charts: SYSTEM_SERVER_CHART_DEFS,
        defaultKpiKeys: DEFAULT_SYSTEM_SERVER_KPI_KEYS,
        defaultChartKeys: DEFAULT_SYSTEM_SERVER_CHART_KEYS,
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
  const rawCharts = row?.charts ?? null;
  const { next: migratedCharts, changed } = migrateChartKeyList(rawCharts);
  if (changed && migratedCharts) {
    patchSystemTabDisplay(stab, { charts: migratedCharts });
  }
  return {
    kpi: row?.kpi == null ? null : new Set(row.kpi),
    charts: migratedCharts == null ? null : new Set(migratedCharts),
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
