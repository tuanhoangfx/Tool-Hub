import { useCallback, useEffect, useState } from "react";
import { agentManifestCache } from "../../../lib/agent-manifest-cache";
import { normalizeAgentManifest } from "./normalize-agent-manifest";
import type { AgentManifest } from "./types";

const MANIFEST_URL = "/agent-manifest.json";

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

  useEffect(() => {
    const stale = agentManifestCache.readStale();
    if (stale) setManifest(stale);
    void load(stale != null);
  }, [load]);

  const reload = useCallback(() => load(false), [load]);

  return { manifest, items: manifest?.items ?? [], loading, error, reload };
}
