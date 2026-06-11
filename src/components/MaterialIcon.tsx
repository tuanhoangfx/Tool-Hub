import { compactIconSize } from "@tool-workspace/hub-ui";

type MaterialIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
};

export function MaterialIcon({ name, className = "", filled = false, size = compactIconSize(20) }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "fill-1" : ""} ${className}`.trim()}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
