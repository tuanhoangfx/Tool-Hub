import { useCallback, useEffect, useState } from "react";
import { agentManifestCache } from "../../../lib/agent-manifest-cache";
import type { AgentManifest } from "./types";

const MANIFEST_URL = "/agent-manifest.json";

export function useAgentManifest() {
  const [manifest, setManifest] = useState<AgentManifest | null>(() => agentManifestCache.readStale());
  const [loading, setLoading] = useState(() => agentManifestCache.readStale() == null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as AgentManifest;
      if (!Array.isArray(data?.items)) throw new Error("Invalid manifest");
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

  useEffect(() => {
    void load(agentManifestCache.readStale() != null);
  }, [load]);

  return { manifest, items: manifest?.items ?? [], loading, error, reload: () => load(false) };
}
