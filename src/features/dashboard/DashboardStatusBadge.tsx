import { MetricBadge } from "@tool-workspace/hub-ui";
import type { DashboardScreenStatus } from "./dashboard-screen-status";

export function DashboardStatusBadge({ status }: { status: DashboardScreenStatus }) {
  return <MetricBadge label={status.label} tone={status.tone} iconMeta={status.iconMeta} />;
}
