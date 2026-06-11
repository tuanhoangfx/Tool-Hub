import type { PrefItem } from "../../components/sales-shell/DisplayPrefs";
import { defaultKpiKeysFromDefs } from "../../lib/kpi-display-defaults";

export const USER_KPI_DEFS: PrefItem[] = [
  { key: "total", label: "Users (shown)" },
  { key: "active", label: "Active now" },
  { key: "admins", label: "Admins" },
  { key: "managers", label: "Managers" },
  { key: "members", label: "Members" },
  { key: "tool_grants", label: "Tool grants" },
  { key: "with_tools", label: "With tool access" },
  { key: "idle", label: "Idle / offline" },
];

export const DEFAULT_USER_KPI_KEYS = defaultKpiKeysFromDefs(USER_KPI_DEFS);

export const USER_CHART_DEFS: PrefItem[] = [
  { key: "role_bar", label: "By Role (bar)" },
  { key: "activity_bar", label: "By Activity (bar)" },
  { key: "tool_bar", label: "Tool access (bar)" },
  { key: "distribution_bar", label: "Activity Distribution (bar)" },
];

export const DEFAULT_USER_CHART_KEYS = new Set(USER_CHART_DEFS.map((c) => c.key));
