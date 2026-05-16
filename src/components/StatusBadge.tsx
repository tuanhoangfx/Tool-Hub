import { MaterialIcon } from "./MaterialIcon";

type StatusBadgeProps = {
  icon: string;
  label: string;
  tone: "ok" | "warn" | "bad" | "neutral";
};

export function StatusBadge({ icon, label, tone }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge-${tone}`}>
      <MaterialIcon name={icon} size={14} />
      {label}
    </span>
  );
}
