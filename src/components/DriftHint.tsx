import { MaterialIcon } from "./MaterialIcon";
import { buildDriftTooltip } from "../lib/tooltips";
import { Tooltip } from "./Tooltip";

type DriftHintProps = {
  alerts: string[];
  compact?: boolean;
};

export function DriftHint({ alerts, compact = false }: DriftHintProps) {
  const tip = buildDriftTooltip(alerts);
  const hasDrift = alerts.length > 0;

  const chip = (
    <span className={`mini-stat ${hasDrift ? "mini-stat-warn" : "mini-stat-ok"}`}>
      <MaterialIcon name={hasDrift ? "warning" : "verified"} size={15} />
      {hasDrift ? `${alerts.length} drift` : compact ? "OK" : "Synced"}
    </span>
  );

  return (
    <Tooltip title={tip.title} lines={tip.lines} align="end">
      {chip}
    </Tooltip>
  );
}
