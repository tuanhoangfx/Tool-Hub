import { chartBreakdownFromPicker, type ChartRow } from "@tool-workspace/hub-ui";
import { resolveP0004ChartLegendIcon } from "../../lib/badge-registry-chart";
import { hubRoleLabel } from "./hubUserDisplay";
import type { UserManagementRow } from "./userManagementRepository";

const iconFor = resolveP0004ChartLegendIcon;

function statusLabel(status: UserManagementRow["status"]): string {
  const labels: Record<UserManagementRow["status"], string> = {
    online: "Online",
    active: "Active",
    idle: "Idle",
    offline: "Offline",
  };
  return labels[status];
}

function toolAccessBucket(toolCount: number): string {
  if (toolCount === 0) return "No tools";
  if (toolCount === 1) return "1 tool";
  if (toolCount <= 3) return "2–3 tools";
  return "4+ tools";
}

export type UserChartBands = {
  role: ChartRow[];
  activity: ChartRow[];
  tool: ChartRow[];
  distribution: ChartRow[];
};

/** Golden Users analytics charts — top 3 + Others, icons via badge-registry-chart. */
export function userCharts(rows: readonly UserManagementRow[]): UserChartBands {
  return {
    role: chartBreakdownFromPicker(rows, (row) => hubRoleLabel(row.role), { iconFor }),
    activity: chartBreakdownFromPicker(rows, (row) => statusLabel(row.status), { iconFor }),
    tool: chartBreakdownFromPicker(rows, (row) => toolAccessBucket(row.toolCount), { iconFor }),
    distribution: chartBreakdownFromPicker(
      rows,
      (row) => (row.activityCount > 0 ? "Has activity" : "No activity"),
      { iconFor },
    ),
  };
}
