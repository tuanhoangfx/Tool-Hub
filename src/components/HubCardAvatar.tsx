import type { LucideIcon } from "lucide-react";
import { compactIconSize } from "@tool-workspace/hub-ui";

export type HubCardAvatarVariant = "supabase" | "agent";
export type HubCardAvatarSize = "xs" | "sm" | "md";

type HubCardAvatarProps = {
  variant: HubCardAvatarVariant;
  icon: LucideIcon;
  size?: HubCardAvatarSize;
  statusColor?: string;
  statusTitle?: string;
  className?: string;
};

const BOX_PX: Record<HubCardAvatarSize, number> = {
  xs: 26,
  sm: 32,
  md: 40,
};

const ICON_PX: Record<HubCardAvatarSize, number> = {
  xs: 14,
  sm: 18,
  md: 22,
};

const STATUS_DOT: Record<HubCardAvatarSize, string> = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
};

/** Gradient tile + single Lucide glyph + optional status dot (Hub / Supabase / Agent cards). */
export function HubCardAvatar({
  variant,
  icon: Icon,
  size = "sm",
  statusColor,
  statusTitle,
  className = "",
}: HubCardAvatarProps) {
  const px = compactIconSize(BOX_PX[size]);
  const iconPx = compactIconSize(ICON_PX[size]);

  return (
    <div className={`relative shrink-0 ${className}`.trim()}>
      <div
        className={`hub-card-avatar hub-card-avatar--${variant} hub-card-avatar--${size}`}
        style={{ width: px, height: px }}
        aria-hidden={statusTitle ? undefined : true}
        title={statusTitle}
      >
        <Icon size={iconPx} className="hub-card-avatar__icon" strokeWidth={2} aria-hidden />
      </div>
      {statusColor ? (
        <span
          className={`absolute -right-0.5 -top-0.5 rounded-full ring-2 ring-[var(--panel)] ${STATUS_DOT[size]}`}
          style={{ background: statusColor }}
          title={statusTitle}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
