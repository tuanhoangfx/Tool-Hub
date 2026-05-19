import { MaterialIcon } from "./MaterialIcon";
import { buildDriftTooltip } from "../lib/tooltips";
import { Tooltip } from "./Tooltip";

type DriftHintProps = {
  alerts: string[];
  compact?: boolean;
};

// Render only when there ARE drift alerts. Clean cards otherwise.
export function DriftHint({ alerts }: DriftHintProps) {
  if (alerts.length === 0) return null;
  const tip = buildDriftTooltip(alerts);

  const chip = (
    <span className="mini-stat mini-stat-warn">
      <MaterialIcon name="warning" size={15} />
      {alerts.length} drift
    </span>
  );

  return (
    <Tooltip title={tip.title} lines={tip.lines} align="end">
      {chip}
    </Tooltip>
  );
}
