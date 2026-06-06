import { hubUserInitials } from "./hubUserDisplay";
import type { UserManagementRow } from "./userManagementRepository";

type HubUserAvatarProps = {
  user: Pick<UserManagementRow, "email" | "fullName" | "id">;
  size?: "sm" | "md";
  className?: string;
};

const SIZE_CLASS = {
  sm: "hub-users-avatar-marker",
  md: "hub-user-avatar hub-user-avatar--md",
} as const;

/** Default initials avatar (same style as signed-in user modal — no external image URLs). */
export function HubUserAvatar({ user, size = "sm", className = "" }: HubUserAvatarProps) {
  return (
    <span className={`${SIZE_CLASS[size]} ${className}`.trim()} aria-hidden>
      {hubUserInitials(user)}
    </span>
  );
}
