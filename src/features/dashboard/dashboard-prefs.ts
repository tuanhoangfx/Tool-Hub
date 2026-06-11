import type { PrefItem } from "../../components/sales-shell/DisplayPrefs";
import { defaultKpiKeysFromDefs } from "../../lib/kpi-display-defaults";

export const DASHBOARD_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Screens shown" },
  { key: "hub", label: "Hub group" },
  { key: "users", label: "Users group" },
  { key: "system", label: "System group" },
  { key: "directory", label: "Directory template" },
  { key: "system_panels", label: "System panels" },
  { key: "document_toc", label: "Document TOC" },
];

export const DASHBOARD_CHART_DEFS: PrefItem[] = [
  { key: "group_bar", label: "By group (bar)" },
  { key: "template_bar", label: "By template (bar)" },
];

export type DashboardHeaderStatKey = "total" | "system" | "directory";

export const DASHBOARD_HEADER_STAT_DEFS: PrefItem[] = [
  { key: "total", label: "Screens" },
  { key: "system", label: "System tabs" },
  { key: "directory", label: "Directory" },
];

export const DASHBOARD_FILTER_DEFS: PrefItem[] = [
  { key: "group", label: "Group" },
  { key: "template", label: "Template" },
  { key: "pinned", label: "Pinned" },
];

export const DASHBOARD_PINNED_FILTER_OPTIONS = [{ value: "pinned", label: "Pinned only" }] as const;

export const DEFAULT_DASHBOARD_HEADER_STAT_KEYS = new Set<DashboardHeaderStatKey>(["total", "system"]);
export const DEFAULT_DASHBOARD_KPI_KEYS = defaultKpiKeysFromDefs(DASHBOARD_KPI_DEFS);
export const DEFAULT_DASHBOARD_CHART_KEYS = new Set(["group_bar", "template_bar"]);
export const DEFAULT_DASHBOARD_FILTER_KEYS = new Set(DASHBOARD_FILTER_DEFS.map((f) => f.key));
