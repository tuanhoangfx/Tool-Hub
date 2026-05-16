import { MaterialIcon } from "./MaterialIcon";

type ToolAvatarProps = {
  code: string;
  iconName: string;
  size?: "sm" | "md" | "lg";
};

const SIZE = { sm: 32, md: 40, lg: 48 } as const;

export function ToolAvatar({ code, iconName, size = "md" }: ToolAvatarProps) {
  const px = SIZE[size];
  const initials = code.slice(0, 2).toUpperCase();

  return (
    <div className={`tool-avatar tool-avatar-${size}`} style={{ width: px, height: px }}>
      <span className="tool-avatar-initials" aria-hidden="true">
        {initials}
      </span>
      <span className="tool-avatar-glyph">
        <MaterialIcon name={iconName} size={size === "lg" ? 22 : size === "md" ? 18 : 16} />
      </span>
    </div>
  );
}
