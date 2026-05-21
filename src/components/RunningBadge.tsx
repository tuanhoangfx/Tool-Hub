import { MaterialIcon } from "./MaterialIcon";
import type { HealthState } from "../hooks/useLocalHealth";

type RunningBadgeProps = {
  state: HealthState | undefined;
  localUrl?: string;
  compact?: boolean;
};

export function RunningBadge({ state, localUrl, compact }: RunningBadgeProps) {
  if (state !== "online" || !localUrl) return null;

  return (
    <a
      className={compact ? "running-badge running-badge-compact" : "running-badge"}
      href={localUrl}
      target="_blank"
      rel="noreferrer"
      title={`Local server is responding at ${localUrl}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="running-badge-dot" aria-hidden="true" />
      <MaterialIcon name="play_arrow" size={12} />
      <span className="running-badge-label">RUNNING</span>
    </a>
  );
}
