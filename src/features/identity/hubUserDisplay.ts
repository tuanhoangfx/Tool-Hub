import type { LucideIcon } from "lucide-react";
import { Crown, ShieldCheck, UserRound } from "lucide-react";
import type { UserManagementRow } from "./userManagementRepository";

export type HubWorkspaceRole = UserManagementRow["role"];

const ROLE_RANK: Record<HubWorkspaceRole, number> = {
  admin: 3,
  manager: 2,
  user: 1,
};

export function hubUserInitials(user: Pick<UserManagementRow, "email" | "fullName" | "id">): string {
  const email = user.email?.trim();
  if (email && email.includes("@")) {
    const local = email.split("@")[0] ?? "";
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local.length === 1) return `${local}${email[0] ?? "U"}`.toUpperCase();
  }
  const parts = user.fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return (user.id || "U").slice(0, 2).toUpperCase();
}

export function parseHubRole(value: string | null | undefined): HubWorkspaceRole {
  if (value === "admin" || value === "manager") return value;
  if (value === "user" || value === "employee") return "user";
  return "user";
}

/** Profile fetch can lag; fall back to directory row for the signed-in user. */
export function resolveSessionActorRole(
  profileRole: UserManagementRow["role"] | null,
  sessionUserId: string | undefined,
  rows: UserManagementRow[],
): UserManagementRow["role"] | null {
  if (profileRole) return profileRole;
  if (!sessionUserId) return null;
  return rows.find((r) => r.id === sessionUserId)?.role ?? null;
}

export function hubRoleLabel(role: HubWorkspaceRole): string {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  return "User";
}

export function hubRoleMeta(role: HubWorkspaceRole): { label: string; Icon: LucideIcon } {
  if (role === "admin") return { label: "Admin", Icon: Crown };
  if (role === "manager") return { label: "Manager", Icon: ShieldCheck };
  return { label: "User", Icon: UserRound };
}

function rowScore(row: UserManagementRow): number {
  const roleScore = ROLE_RANK[row.role] ?? 1;
  const activeMs = row.lastActiveAt ? new Date(row.lastActiveAt).getTime() : 0;
  const activity = row.activityCount ?? 0;
  return roleScore * 1e15 + activeMs * 10 + activity;
}

/** One row per auth id; merge duplicate emails (keep strongest / most active). */
export function deduplicateUserRows(rows: UserManagementRow[]): UserManagementRow[] {
  const byId = new Map<string, UserManagementRow>();
  for (const row of rows) {
    if (!row.id) continue;
    const prev = byId.get(row.id);
    if (!prev || rowScore(row) > rowScore(prev)) byId.set(row.id, row);
  }

  const byEmail = new Map<string, UserManagementRow>();
  const noEmail: UserManagementRow[] = [];

  for (const row of byId.values()) {
    const email = row.email.trim().toLowerCase();
    if (!email) {
      noEmail.push(row);
      continue;
    }
    const prev = byEmail.get(email);
    if (!prev || rowScore(row) > rowScore(prev)) byEmail.set(email, row);
  }

  return [...byEmail.values(), ...noEmail];
}
