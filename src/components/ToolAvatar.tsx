import { MaterialIcon } from "./MaterialIcon";
import { compactIconSize } from "../lib/ui-scale";

type ToolAvatarProps = {
  code: string;
  iconName: string;
  svgSrc?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: compactIconSize(32),
  md: compactIconSize(40),
  lg: compactIconSize(48),
} as const;

export function ToolAvatar({ code, iconName, svgSrc, size = "md" }: ToolAvatarProps) {
  const px = SIZE[size];
  const glyphPx = size === "lg" ? compactIconSize(32) : size === "md" ? compactIconSize(26) : compactIconSize(20);

  if (svgSrc) {
    return (
      <div className={`tool-avatar tool-avatar-${size} tool-avatar-svg`} style={{ width: px, height: px }}>
        <img src={svgSrc} alt={code} width={glyphPx} height={glyphPx} />
      </div>
    );
  }

  const initials = code.slice(0, 2).toUpperCase();
  const iconPx = size === "lg" ? compactIconSize(22) : size === "md" ? compactIconSize(18) : compactIconSize(16);
  return (
    <div className={`tool-avatar tool-avatar-${size}`} style={{ width: px, height: px }}>
      <span className="tool-avatar-initials" aria-hidden="true">
        {initials}
      </span>
      <span className="tool-avatar-glyph">
        <MaterialIcon name={iconName} size={iconPx} />
      </span>
    </div>
  );
}
