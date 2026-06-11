/**
 * Chart legend resolver — golden scaffold for P00xx tools.
 * Wire in main.tsx: `configureChartLegend(resolveP0004ChartLegendIcon)`.
 * Other tools: copy this file, swap domain maps, keep `createChartLegendResolver`.
 */
import { Activity, CircleOff, Package } from "lucide-react";
import { createChartLegendResolver } from "@tool-workspace/hub-ui";
import type { FilterIconMeta } from "./badge-registry";
import { resolveHubChartLegendIcon, USER_PRESENCE, WORKSPACE_ROLE } from "./badge-registry";

/** Users tab — role legend rows (title case, same icons as HubRoleBadge). */
const USER_ROLE_CHART: Record<string, FilterIconMeta> = {
  Admin: WORKSPACE_ROLE.admin,
  Manager: WORKSPACE_ROLE.manager,
  User: WORKSPACE_ROLE.user,
};

/** Users tab — presence legend rows (title case, same icons as Activity filter). */
const USER_ACTIVITY_CHART: Record<string, FilterIconMeta> = {
  Online: USER_PRESENCE.online,
  Active: USER_PRESENCE.active,
  Idle: USER_PRESENCE.idle,
  Offline: USER_PRESENCE.offline,
};

/** Users tab — tool grant buckets + activity distribution. */
const USER_DIRECTORY_CHART: Record<string, FilterIconMeta> = {
  "No tools": { icon: Package, className: "text-slate-400" },
  "1 tool": { icon: Package, className: "text-emerald-400" },
  "2–3 tools": { icon: Package, className: "text-cyan-400" },
  "4+ tools": { icon: Package, className: "text-indigo-400" },
  "Has activity": { icon: Activity, className: "text-emerald-400" },
  "No activity": { icon: CircleOff, className: "text-slate-400" },
};

export const resolveP0004ChartLegendIcon = createChartLegendResolver(
  [USER_ROLE_CHART, USER_ACTIVITY_CHART, USER_DIRECTORY_CHART],
  resolveHubChartLegendIcon,
);

/** @deprecated Use resolveP0004ChartLegendIcon — import from this file, not badge-registry (avoids circular TDZ). */
export const resolveChartLegendIcon = resolveP0004ChartLegendIcon;
