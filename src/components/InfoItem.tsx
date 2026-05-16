import { MaterialIcon } from "./MaterialIcon";

type InfoItemProps = {
  icon: string;
  label: string;
  value: string | number;
};

export function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="info-item">
      <span className="info-item-label">
        <MaterialIcon name={icon} size={14} />
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}
