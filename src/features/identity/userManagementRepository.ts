import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { deduplicateUserRows } from "./hubUserDisplay";

export type UserManagementRow = {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "manager" | "user";
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastActiveAt: string | null;
  projectCount: number;
  projectNames: string[];
  toolCount: number;
  toolCodes: string[];
  activityCount: number;
  status: "online" | "active" | "idle" | "offline";
};

type ProfileRow = {
  id?: string;
  user_id?: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_sign_in_at?: string | null;
  last_activity_at?: string | null;
  project_count?: number | null;
  project_names?: string[] | null;
  tool_count?: number | null;
  tool_codes?: string[] | null;
  activity_count?: number | null;
};

function cleanRole(value: string | null | undefined): UserManagementRow["role"] {
  if (value === "admin" || value === "manager") return value;
  if (value === "user" || value === "employee") return "user";
  return "user";
}

function statusFromLastActive(value: string | null): UserManagementRow["status"] {
  if (!value) return "offline";
  const ageMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ageMs)) return "offline";
  if (ageMs <= 5 * 60 * 1000) return "online";
  if (ageMs <= 24 * 60 * 60 * 1000) return "active";
  if (ageMs <= 7 * 24 * 60 * 60 * 1000) return "idle";
  return "offline";
}

function normalizeProfile(row: ProfileRow): UserManagementRow {
  const id = row.id ?? row.user_id ?? "";
  const email = row.email?.trim() ?? "";
  const fullName = row.full_name?.trim() || email || id;
  const lastActiveAt = row.last_activity_at ?? row.last_sign_in_at ?? null;
  const projectNames = Array.isArray(row.project_names) ? row.project_names.filter(Boolean) : [];
  const toolCodes = Array.isArray(row.tool_codes) ? row.tool_codes.filter(Boolean) : [];
  return {
    id,
    fullName,
    email,
    role: cleanRole(row.role),
    avatarUrl: null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    lastActiveAt,
    projectCount: row.project_count ?? projectNames.length,
    projectNames,
    toolCount: row.tool_count ?? toolCodes.length,
    toolCodes,
    activityCount: row.activity_count ?? 0,
    status: statusFromLastActive(lastActiveAt),
  };
}

function missingRpc(message: string) {
  return /workspace_user_directory/i.test(message) && /does not exist|not found|PGRST202|42883/i.test(message);
}

export async function updateUserRole(
  targetUserId: string,
  role: UserManagementRow["role"],
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from("profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", targetUserId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export type UserProfilePatch = {
  fullName?: string;
  email?: string;
  role?: UserManagementRow["role"];
};

export async function updateUserProfile(
  targetUserId: string,
  patch: UserProfilePatch,
): Promise<{ ok: boolean; error: string | null }> {
  const row: Record<string, string> = { updated_at: new Date().toISOString() };
  if (patch.fullName !== undefined) row.full_name = patch.fullName.trim();
  if (patch.email !== undefined) row.email = patch.email.trim().toLowerCase();
  if (patch.role !== undefined) row.role = patch.role;

  const { error } = await supabase.from("profiles").update(row).eq("id", targetUserId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function fetchCurrentProfileRole(userId: string): Promise<UserManagementRow["role"] | null> {
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (error || !data?.role) return null;
  return cleanRole(data.role);
}

export const TOOL_NONE = "__no_tools__";

export async function fetchUserManagementRows(session: Session): Promise<{
  rows: UserManagementRow[];
  warning: string | null;
}> {
  const directory = await supabase.rpc("workspace_user_directory");

  if (!directory.error && Array.isArray(directory.data)) {
    const rows = deduplicateUserRows(
      (directory.data as ProfileRow[]).map(normalizeProfile).filter((row) => row.id),
    );
    return { rows, warning: null };
  }

  const message = directory.error?.message ?? "Unable to load user directory from database.";
  if (!missingRpc(message)) {
    return { rows: [], warning: message };
  }

  const profile = await supabase
    .from("profiles")
    .select("id,full_name,email,role,avatar_url,created_at,updated_at,last_sign_in_at")
    .eq("id", session.user.id)
    .maybeSingle();

  return {
    rows: profile.data ? [normalizeProfile(profile.data as ProfileRow)] : [],
    warning:
      "Missing RPC workspace_user_directory. Run supabase/migrations/20260529120000_hub_identity_profiles.sql on project x1z10 P01.",
  };
}
