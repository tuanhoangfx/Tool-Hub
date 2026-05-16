import type { RemoteFileState } from "../types";
import { buildHealthTooltip } from "../lib/tooltips";
import { Tooltip } from "./Tooltip";

type HealthBarProps = {
  percent: number;
  files?: RemoteFileState[];
};

export function HealthBar({ percent, files }: HealthBarProps) {
  const tone = percent > 70 ? "ok" : percent >= 30 ? "warn" : "bad";
  const clamped = Math.max(0, Math.min(100, percent));
  const tip = buildHealthTooltip(files);

  const bar = (
    <div className="health-bar-wrap">
      <div className="health-bar-head">
        <span className="health-bar-label">
          <span className={`health-dot ${tone}`} aria-hidden="true" />
          Files
        </span>
        <span className={`health-pct health-pct-${tone}`}>{clamped}%</span>
      </div>
      <div className="health-bar-track" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div className={`health-bar-fill health-bar-fill-${tone}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );

  return (
    <Tooltip title={tip.title} lines={tip.lines} align="start">
      {bar}
    </Tooltip>
  );
}
