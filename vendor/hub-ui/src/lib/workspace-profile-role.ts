import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { normalizeWorkspaceRoleKey, type HubWorkspaceRoleKey } from "../auth/hub-workspace-role-icon";

type RoleListener = (role: HubWorkspaceRoleKey) => void;

type ProfileRoleChannelEntry = {
  channel: RealtimeChannel | null;
  listeners: Set<RoleListener>;
};

/** One subscribed channel per client+user — avoids ".on() after subscribe()" on React remount. */
const profileRoleChannels = new WeakMap<SupabaseClient, Map<string, ProfileRoleChannelEntry>>();

function profileRoleChannelTopic(channelName: string): string {
  return `realtime:${channelName}`;
}

function removeStaleProfileRoleChannels(client: SupabaseClient, channelName: string): void {
  const topic = profileRoleChannelTopic(channelName);
  for (const ch of client.getChannels()) {
    if (ch.topic === topic) void client.removeChannel(ch);
  }
}

const ROLE_CACHE_KEY = "hub:workspace-profile-role";

export type FetchWorkspaceProfileRoleOptions = {
  /** Dual-auth tools (P0020) — Hub profiles keyed by identity user, not local Supabase auth id. */
  email?: string | null;
  /** Apply Hub JWT on client before RLS query (e.g. applyHubIdentitySession). */
  prepareClient?: (client: SupabaseClient) => Promise<void>;
};

type DirectoryRow = { id?: string; role?: string | null; email?: string | null };

function parseRoleCache(raw: string | null, userId: string): HubWorkspaceRoleKey | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { userId?: string; role?: string };
    if (parsed.userId !== userId || !parsed.role) return null;
    return normalizeWorkspaceRoleKey(parsed.role);
  } catch {
    return null;
  }
}

function readRoleCache(userId: string): HubWorkspaceRoleKey | null {
  if (typeof window === "undefined") return null;
  return (
    parseRoleCache(window.sessionStorage.getItem(ROLE_CACHE_KEY), userId) ??
    parseRoleCache(window.localStorage.getItem(ROLE_CACHE_KEY), userId)
  );
}

function writeRoleCache(userId: string, role: HubWorkspaceRoleKey): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ userId, role });
  try {
    window.sessionStorage.setItem(ROLE_CACHE_KEY, payload);
    window.localStorage.setItem(ROLE_CACHE_KEY, payload);
  } catch {
    /* ignore quota */
  }
}

function pickDirectoryRole(
  rows: DirectoryRow[],
  userId: string,
  email?: string | null,
): HubWorkspaceRoleKey | null {
  const byId = rows.find((r) => r.id === userId);
  if (byId?.role) return normalizeWorkspaceRoleKey(String(byId.role));
  const mail = email?.trim().toLowerCase();
  if (!mail) return null;
  const byEmail = rows.find((r) => (r.email ?? "").trim().toLowerCase() === mail);
  if (byEmail?.role) return normalizeWorkspaceRoleKey(String(byEmail.role));
  return null;
}

/** Fetch workspace role from shared `profiles` table (Hub Users SSOT). */
export async function fetchWorkspaceProfileRole(
  client: SupabaseClient,
  userId: string,
  opts?: FetchWorkspaceProfileRoleOptions,
): Promise<HubWorkspaceRoleKey | null> {
  const cached = readRoleCache(userId);
  if (opts?.prepareClient) await opts.prepareClient(client);
  else await client.auth.getSession();

  const { data, error } = await client.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (!error && data?.role) {
    const role = normalizeWorkspaceRoleKey(String(data.role));
    writeRoleCache(userId, role);
    return role;
  }

  const directory = await client.rpc("workspace_user_directory");
  if (!directory.error && Array.isArray(directory.data)) {
    const role = pickDirectoryRole(directory.data as DirectoryRow[], userId, opts?.email);
    if (role) {
      writeRoleCache(userId, role);
      return role;
    }
  }

  return cached;
}

/** Live `profiles.role` updates — sidebar icon stays in sync after admin edits. */
export function subscribeWorkspaceProfileRole(
  client: SupabaseClient,
  userId: string,
  onRole: (role: HubWorkspaceRoleKey) => void,
): () => void {
  const channelName = `hub-profile-role:${userId}`;
  let byUser = profileRoleChannels.get(client);
  if (!byUser) {
    byUser = new Map();
    profileRoleChannels.set(client, byUser);
  }

  let entry = byUser.get(userId);
  if (!entry) {
    removeStaleProfileRoleChannels(client, channelName);
    const listeners = new Set<RoleListener>();
    entry = { channel: null, listeners };
    byUser.set(userId, entry);
    const channel = client
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          const next = (payload.new as { role?: string | null } | undefined)?.role;
          if (!next) return;
          const role = normalizeWorkspaceRoleKey(next);
          writeRoleCache(userId, role);
          for (const listener of listeners) listener(role);
        },
      )
      .subscribe();
    entry.channel = channel;
  }

  entry.listeners.add(onRole);
  return () => {
    entry!.listeners.delete(onRole);
    if (entry!.listeners.size === 0) {
      byUser!.delete(userId);
      if (entry!.channel) void client.removeChannel(entry!.channel);
    }
  };
}

/** Seed sidebar icon before async fetch (same-tab sessionStorage). */
export function readCachedWorkspaceProfileRole(userId: string): HubWorkspaceRoleKey | null {
  return readRoleCache(userId);
}

/** Write role cache when directory/modal resolves role (Users tab SSOT). */
export function cacheWorkspaceProfileRole(userId: string, role: string): void {
  writeRoleCache(userId, normalizeWorkspaceRoleKey(role));
}

/** Prefetch profiles.role after sign-in — sidebar icon ready before shell paints. */
export async function warmWorkspaceProfileRole(
  client: SupabaseClient,
  opts?: { userId?: string | null; email?: string | null; prepareClient?: (client: SupabaseClient) => Promise<void> },
): Promise<void> {
  const { data } = await client.auth.getSession();
  const userId = opts?.userId?.trim() || data.session?.user?.id;
  if (!userId) return;
  await fetchWorkspaceProfileRole(client, userId, {
    email: opts?.email ?? data.session?.user?.email ?? null,
    prepareClient: opts?.prepareClient,
  });
}
