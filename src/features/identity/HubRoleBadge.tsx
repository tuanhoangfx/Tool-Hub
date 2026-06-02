import { resolveFilterOptionIcon } from "../../lib/badge-registry";
import { hubRoleLabel } from "./hubUserDisplay";
import type { UserManagementRow } from "./userManagementRepository";

export function HubRoleBadge({ role }: { role: UserManagementRow["role"] }) {
  const meta = resolveFilterOptionIcon("role", { value: role, label: hubRoleLabel(role) });
  const Icon = meta?.icon;
  return (
    <span className={`hub-users-role-badge hub-users-role-badge--${role}`}>
      {Icon ? <Icon size={12} className={`hub-users-role-badge-icon ${meta.className}`} aria-hidden /> : null}
      <span className="hub-users-role-badge-label">{hubRoleLabel(role)}</span>
    </span>
  );
}
