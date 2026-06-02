import { createClientCache } from "@dev/hub-load";
import type { AgentManifest } from "../features/system-hub/agent-context/types";

export const agentManifestCache = createClientCache<AgentManifest>({
  key: "hub:agent-manifest:v1",
  ttlMs: 15 * 60_000,
  validate: (data): data is AgentManifest =>
    typeof data === "object" && data !== null && Array.isArray((data as AgentManifest).items),
});
