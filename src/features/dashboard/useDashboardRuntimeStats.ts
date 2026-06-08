import { useEffect, useState } from "react";
import { prefetchJson } from "@dev/hub-load";
import { agentManifestCache } from "../../lib/agent-manifest-cache";
import { prefetchSupabaseQuotaCatalog } from "../../lib/hub-background-prefetch";
import { normalizeAgentManifest } from "../system-hub/agent-context/normalize-agent-manifest";
import { readUserManagementStaleCache } from "../identity/user-management-client-cache";
import { readSupabaseQuotaStaleCache } from "../system-hub/supabase-quota-client-cache";
import { AGENT_MANIFEST_REFRESH_EVENT } from "../system-hub/agent-manifest-events";
import { SUPABASE_QUOTA_UPDATED_EVENT } from "../system-hub/supabase-quota-events";

export type DashboardRuntimeStats = {
  userCount: number | null;
  agentManifestCount: number | null;
  supabaseProjectCount: number | null;
  supabaseErrorCount: number | null;
  localToolCount: number | null;
};

function readStatsFromCaches(): DashboardRuntimeStats {
  const users = readUserManagementStaleCache();
  const agent = agentManifestCache.readStale();
  const quota = readSupabaseQuotaStaleCache();
  const projects = quota?.projects ?? [];

  return {
    userCount: users?.rows?.length ?? null,
    agentManifestCount: agent?.items?.length ?? null,
    supabaseProjectCount: projects.length > 0 ? projects.length : null,
    supabaseErrorCount:
      projects.length > 0 ? projects.filter((p) => Boolean(p.error?.trim())).length : null,
    localToolCount: null,
  };
}

/** Lazy runtime counts for Dashboard card meta (users, agent manifest, Supabase quota). */
export function useDashboardRuntimeStats(localToolCount?: number): DashboardRuntimeStats {
  const [stats, setStats] = useState<DashboardRuntimeStats>(() => ({
    ...readStatsFromCaches(),
    localToolCount: localToolCount ?? null,
  }));

  useEffect(() => {
    const sync = () =>
      setStats({ ...readStatsFromCaches(), localToolCount: localToolCount ?? null });
    sync();

    prefetchSupabaseQuotaCatalog();
    prefetchJson("/agent-manifest.json", (json) => {
      const data = normalizeAgentManifest(json);
      if (data) agentManifestCache.write(data);
      sync();
    });

    window.addEventListener(AGENT_MANIFEST_REFRESH_EVENT, sync);
    window.addEventListener(SUPABASE_QUOTA_UPDATED_EVENT, sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener(AGENT_MANIFEST_REFRESH_EVENT, sync);
      window.removeEventListener(SUPABASE_QUOTA_UPDATED_EVENT, sync);
      window.removeEventListener("popstate", sync);
    };
  }, [localToolCount]);

  return stats;
}
