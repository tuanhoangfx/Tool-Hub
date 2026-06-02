import type { LocalRegistry, ToolRepository } from "../../types";
import { supabase } from "../../lib/supabase";

export type HubToolRow = {
  tool_code: string;
  name: string;
  category: string | null;
  status: string | null;
  archived_at: string | null;
  /** Present in UI when row comes from workspace JSON but not yet in hub_tools. */
  registryOnly?: boolean;
};

export type HubToolCatalogEntry = {
  tool_code: string;
  name: string;
  category: string | null;
  status: string | null;
};

export function catalogFromRepositories(repos: ToolRepository[]): HubToolCatalogEntry[] {
  const seen = new Set<string>();
  const out: HubToolCatalogEntry[] = [];
  for (const repo of repos) {
    const tool_code = (repo.code || repo.id || "").trim();
    if (!tool_code || seen.has(tool_code)) continue;
    seen.add(tool_code);
    out.push({
      tool_code,
      name: repo.name?.trim() || tool_code,
      category: repo.category?.trim() || null,
      status: repo.status?.trim() || null,
    });
  }
  return out.sort((a, b) => a.tool_code.localeCompare(b.tool_code));
}

async function fetchRegistryRepositories(path: string): Promise<ToolRepository[]> {
  try {
    const res = await fetch(`${path}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as LocalRegistry & { repositories?: ToolRepository[] };
    return data.repositories ?? [];
  } catch {
    return [];
  }
}

/** Workspace scan output (Tool + Extension roots) merged with local-registry. */
export async function loadWorkspaceToolCatalog(): Promise<HubToolCatalogEntry[]> {
  const [localRepos, workspaceRepos] = await Promise.all([
    fetchRegistryRepositories("/local-registry.json"),
    fetchRegistryRepositories("/workspace-catalog.json"),
  ]);
  return catalogFromRepositories([...localRepos, ...workspaceRepos]);
}

/** Union DB catalog with workspace JSON so extensions (E00xx) always appear in UI. */
export function mergeHubToolCatalog(dbTools: HubToolRow[], catalog: HubToolCatalogEntry[]): HubToolRow[] {
  const map = new Map<string, HubToolRow>();
  for (const t of dbTools) {
    map.set(t.tool_code, { ...t, registryOnly: false });
  }
  for (const c of catalog) {
    const existing = map.get(c.tool_code);
    if (existing) {
      map.set(c.tool_code, {
        ...existing,
        name: existing.name || c.name,
        category: existing.category ?? c.category,
        status: existing.status ?? c.status,
        registryOnly: false,
      });
    } else {
      map.set(c.tool_code, {
        tool_code: c.tool_code,
        name: c.name,
        category: c.category,
        status: c.status,
        archived_at: null,
        registryOnly: true,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.tool_code.localeCompare(b.tool_code));
}

export function countRegistryOnlyTools(tools: HubToolRow[]): number {
  return tools.filter((t) => t.registryOnly).length;
}

export async function fetchHubTools(): Promise<{ tools: HubToolRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("hub_tools")
    .select("tool_code,name,category,status,archived_at")
    .is("archived_at", null)
    .order("tool_code");
  if (error) {
    if (/hub_tools|does not exist|PGRST205/i.test(error.message)) {
      return { tools: [], error: null };
    }
    return { tools: [], error: error.message };
  }
  return { tools: (data ?? []) as HubToolRow[], error: null };
}

export async function syncHubToolsCatalog(entries: HubToolCatalogEntry[]): Promise<{ count: number; error: string | null }> {
  if (!entries.length) return { count: 0, error: null };
  const { data, error } = await supabase.rpc("sync_hub_tools", { p_tools: entries });
  if (error) {
    if (/sync_hub_tools|does not exist|PGRST202/i.test(error.message)) {
      return { count: 0, error: "Missing RPC sync_hub_tools. Run scripts/apply-hub-tool-access.ps1." };
    }
    return { count: 0, error: error.message };
  }
  return { count: typeof data === "number" ? data : 0, error: null };
}

export async function fetchUserToolCodes(userId: string): Promise<{ codes: string[]; error: string | null }> {
  const { data, error } = await supabase.from("tool_access").select("tool_code").eq("user_id", userId);
  if (error) {
    if (/tool_access|does not exist|PGRST205/i.test(error.message)) {
      return { codes: [], error: null };
    }
    return { codes: [], error: error.message };
  }
  return { codes: (data ?? []).map((row) => String(row.tool_code)), error: null };
}

export async function setUserToolAccess(
  userId: string,
  toolCodes: string[],
  grantedBy: string,
): Promise<{ ok: boolean; error: string | null }> {
  const unique = [...new Set(toolCodes.map((c) => c.trim()).filter(Boolean))];
  const { data: existing, error: readErr } = await supabase.from("tool_access").select("tool_code").eq("user_id", userId);
  if (readErr) return { ok: false, error: readErr.message };

  const prev = new Set((existing ?? []).map((r) => String(r.tool_code)));
  const next = new Set(unique);
  const toRemove = [...prev].filter((c) => !next.has(c));
  const toAdd = [...next].filter((c) => !prev.has(c));

  if (toRemove.length) {
    const { error } = await supabase.from("tool_access").delete().eq("user_id", userId).in("tool_code", toRemove);
    if (error) return { ok: false, error: error.message };
  }

  if (toAdd.length) {
    const rows = toAdd.map((tool_code) => ({
      user_id: userId,
      tool_code,
      permission: "access",
      granted_by: grantedBy,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("tool_access").upsert(rows, { onConflict: "user_id,tool_code" });
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true, error: null };
}

/** Clears all Hub tool grants for the given users (profiles remain). */
export async function revokeAllToolAccessForUsers(userIds: string[]): Promise<{ ok: boolean; error: string | null }> {
  const ids = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
  if (!ids.length) return { ok: true, error: null };
  const { error } = await supabase.from("tool_access").delete().in("user_id", ids);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
