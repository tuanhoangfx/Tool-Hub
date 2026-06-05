import type { PrefItem } from "../../components/sales-shell/DisplayPrefs";
import { defaultKpiKeysFromDefs } from "../../lib/kpi-display-defaults";

export const HUB_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Tools (shown)" },
  { key: "ready", label: "Ready" },
  { key: "releases", label: "With release" },
  { key: "drift", label: "Drift alerts" },
  { key: "local_only", label: "Local only" },
  { key: "link_gaps", label: "Link gaps" },
  { key: "draft", label: "Draft" },
  { key: "hosted", label: "Hosted (VPS/Vercel)" },
];

export const HUB_CHART_DEFS: PrefItem[] = [
  { key: "health_bar", label: "By Health (bar)" },
  { key: "category_bar", label: "By Category (bar)" },
  { key: "deploy_donut", label: "Deploy distribution (donut)" },
  { key: "status_donut", label: "Status distribution (donut)" },
];

export type HubHeaderStatKey = "ready" | "releases" | "drift" | "link_gaps";

export const HUB_HEADER_STAT_DEFS: PrefItem[] = [
  { key: "ready", label: "Ready" },
  { key: "releases", label: "Releases" },
  { key: "drift", label: "Drift" },
  { key: "link_gaps", label: "Link gaps" },
];

export const HUB_FILTER_DEFS: PrefItem[] = [
  { key: "health", label: "Health" },
  { key: "category", label: "Category" },
  { key: "deploy", label: "Deploy" },
  { key: "status", label: "Status" },
  { key: "drift", label: "Drift" },
  { key: "links", label: "Manifest links" },
];

export const DEFAULT_HUB_HEADER_STAT_KEYS = new Set(["ready", "releases"]);
/** 7 of 8 Hub KPIs on by default (hides last: Hosted). */
export const DEFAULT_HUB_KPI_KEYS = defaultKpiKeysFromDefs(HUB_KPI_DEFS);
export const DEFAULT_HUB_CHART_KEYS = new Set(["health_bar", "category_bar", "deploy_donut", "status_donut"]);
export const DEFAULT_HUB_FILTER_KEYS = new Set(HUB_FILTER_DEFS.map((f) => f.key));
