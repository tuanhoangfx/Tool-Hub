import { useCallback, useEffect, useState } from "react";
import { agentManifestCache } from "../../../lib/agent-manifest-cache";
import { runAgentManifestSync } from "../../../services/agent-manifest-sync";
import { AGENT_MANIFEST_REFRESH_EVENT } from "../agent-manifest-events";
import { normalizeAgentManifest } from "./normalize-agent-manifest";
import type { AgentManifest } from "./types";

const MANIFEST_URL = "/agent-manifest.json";

async function rebuildAndFetchManifest(): Promise<AgentManifest> {
  const sync = await runAgentManifestSync();
  if (!sync.ok) {
    throw new Error(sync.message ?? "Agent manifest sync failed");
  }
  const response = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = normalizeAgentManifest(await response.json());
  if (!data) throw new Error("Invalid manifest");
  agentManifestCache.write(data);
  return data;
}

export function useAgentManifest() {
  const [manifest, setManifest] = useState<AgentManifest | null>(() => {
    const stale = agentManifestCache.readStale();
    return stale ? normalizeAgentManifest(stale) : null;
  });
  const [loading, setLoading] = useState(() => agentManifestCache.readStale() == null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = normalizeAgentManifest(await response.json());
      if (!data) throw new Error("Invalid manifest");
      agentManifestCache.write(data);
      setManifest(data);
    } catch (err) {
      const stale = agentManifestCache.readStale();
      if (stale) {
        setManifest(stale);
      } else {
        setError(err instanceof Error ? err.message : "Unable to load agent manifest");
        setManifest(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /** Rebuild manifest on disk (dev API) then reload JSON — same as sidebar Refresh includes. */
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rebuildAndFetchManifest();
      setManifest(data);
    } catch (err) {
      const stale = agentManifestCache.readStale();
      if (stale) {
        setManifest(stale);
        setError(err instanceof Error ? err.message : "Sync failed; showing cached manifest");
      } else {
        setError(err instanceof Error ? err.message : "Unable to sync agent manifest");
        setManifest(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stale = agentManifestCache.readStale();
    if (stale) setManifest(stale);
    void load(stale != null);
  }, [load]);

  useEffect(() => {
    const onSidebarRefresh = () => {
      void reload();
    };
    window.addEventListener(AGENT_MANIFEST_REFRESH_EVENT, onSidebarRefresh);
    return () => window.removeEventListener(AGENT_MANIFEST_REFRESH_EVENT, onSidebarRefresh);
  }, [reload]);

  return { manifest, items: manifest?.items ?? [], loading, error, reload };
}
