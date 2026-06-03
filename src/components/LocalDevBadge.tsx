import { MaterialIcon } from "./MaterialIcon";
import { compactIconSize } from "../lib/ui-scale";
import type { HealthState } from "../hooks/useLocalHealth";

type LocalDevBadgeProps = {
  state: HealthState | undefined;
  port: string | null;
  localUrl?: string;
  compact?: boolean;
};

export function LocalDevBadge({ state, port, localUrl, compact }: LocalDevBadgeProps) {
  if (!port || !localUrl) return null;

  const label =
    state === "online"
      ? `:${port} live`
      : state === "offline"
        ? `:${port} down`
        : state === "checking"
          ? `:${port} …`
          : `:${port}`;

  const className =
    state === "online"
      ? "local-dev-badge local-dev-badge--live"
      : state === "offline"
        ? "local-dev-badge local-dev-badge--down"
        : "local-dev-badge local-dev-badge--idle";

  if (state === "offline") {
    return (
      <span
        className={compact ? `${className} local-dev-badge--compact` : className}
        title={`Local server not responding at ${localUrl}`}
      >
        <span className="local-dev-badge-dot" aria-hidden="true" />
        <MaterialIcon name="link_off" size={compactIconSize(12)} />
        <span className="local-dev-badge-label">{label}</span>
      </span>
    );
  }

  if (state === "online") {
    return (
      <a
        className={compact ? `${className} local-dev-badge--compact` : className}
        href={localUrl}
        target="_blank"
        rel="noreferrer"
        title={`Local server live at ${localUrl}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="local-dev-badge-dot" aria-hidden="true" />
        <MaterialIcon name="play_arrow" size={compactIconSize(12)} />
        <span className="local-dev-badge-label">{label}</span>
      </a>
    );
  }

  return (
    <span
      className={compact ? `${className} local-dev-badge--compact` : className}
      title={localUrl}
    >
      <span className="local-dev-badge-dot" aria-hidden="true" />
      <span className="local-dev-badge-label">{label}</span>
    </span>
  );
}

/** @deprecated use LocalDevBadge */
export function RunningBadge({
  state,
  localUrl,
  compact,
}: {
  state: HealthState | undefined;
  localUrl?: string;
  compact?: boolean;
}) {
  const port = localUrl ? tryPort(localUrl) : null;
  return <LocalDevBadge state={state} port={port} localUrl={localUrl} compact={compact} />;
}

function tryPort(url: string) {
  try {
    return new URL(url).port || null;
  } catch {
    return null;
  }
}
