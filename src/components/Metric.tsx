import { MaterialIcon } from "./MaterialIcon";
import { compactIconSize } from "../lib/ui-scale";

type MetricProps = {
  icon: string;
  label: string;
  value: string | number;
  badge: string;
  badgeClass: "ok" | "bad" | "run";
  accent?: "brand" | "green" | "blue" | "amber";
};

export function Metric({ icon, label, value, badge, badgeClass, accent = "brand" }: MetricProps) {
  return (
    <article className={`stat stat-accent-${accent}`}>
      <div className="stat-top">
        <span className="stat-icon">
          <MaterialIcon name={icon} size={compactIconSize(22)} />
        </span>
        <span className={`badge ${badgeClass}`}>{badge}</span>
      </div>
      <strong>{value}</strong>
      <label>{label}</label>
    </article>
  );
}
