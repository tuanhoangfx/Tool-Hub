import { MaterialIcon } from "./MaterialIcon";
import { compactIconSize } from "@tool-workspace/hub-ui";

type StatusBadgeProps = {
  icon: string;
  label: string;
  tone: "ok" | "warn" | "bad" | "neutral";
  title?: string;
};

const DEFAULT_TITLES: Record<string, string> = {
  Ready: "Project is production-ready (manifest.health.status = Ready)",
  "Needs review": "Project needs review before relying on it",
  Experimental: "Project is experimental — API/behavior may change",
  Archived: "Project is archived and no longer maintained",
  Local: "Local-only — no GitHub repo configured",
};

export function StatusBadge({ icon, label, tone, title }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge-${tone}`} title={title ?? DEFAULT_TITLES[label] ?? label}>
      <MaterialIcon name={icon} size={compactIconSize(14)} />
      {label}
    </span>
  );
}
