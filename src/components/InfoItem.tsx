import { MaterialIcon } from "./MaterialIcon";
import { compactIconSize } from "@tool-workspace/hub-ui";

type InfoItemProps = {
  icon: string;
  label: string;
  value: string | number;
};

export function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="info-item">
      <span className="info-item-label">
        <MaterialIcon name={icon} size={compactIconSize(14)} />
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}
