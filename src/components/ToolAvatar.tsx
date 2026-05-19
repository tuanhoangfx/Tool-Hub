import { MaterialIcon } from "./MaterialIcon";

type ToolAvatarProps = {
  code: string;
  iconName: string;
  svgSrc?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE = { sm: 32, md: 40, lg: 48 } as const;

export function ToolAvatar({ code, iconName, svgSrc, size = "md" }: ToolAvatarProps) {
  const px = SIZE[size];
  const glyphPx = size === "lg" ? 32 : size === "md" ? 26 : 20;

  if (svgSrc) {
    return (
      <div className={`tool-avatar tool-avatar-${size} tool-avatar-svg`} style={{ width: px, height: px }}>
        <img src={svgSrc} alt={code} width={glyphPx} height={glyphPx} />
      </div>
    );
  }

  const initials = code.slice(0, 2).toUpperCase();
  const iconPx = size === "lg" ? 22 : size === "md" ? 18 : 16;
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
