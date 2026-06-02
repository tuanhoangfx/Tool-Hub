import { createClientCache } from "@dev/hub-load";
import type { LocalRegistry, ToolRemoteState, ToolRepository } from "../types";

export type HubCatalogCacheData = {
  defaultRepos: ToolRepository[];
  localRegistry?: LocalRegistry;
  remoteStates: Record<string, ToolRemoteState>;
};

export const hubCatalogCache = createClientCache<HubCatalogCacheData>({
  key: "hub:catalog:v1",
  ttlMs: 15 * 60_000,
  validate: (data): data is HubCatalogCacheData =>
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as HubCatalogCacheData).defaultRepos),
});

export function sanitizeHubRemoteStates(
  states: Record<string, ToolRemoteState>,
): Record<string, ToolRemoteState> {
  return Object.fromEntries(
    Object.entries(states).map(([id, state]) => [id, { ...state, loading: false }]),
  );
}

export function writeHubCatalogCache(data: HubCatalogCacheData): void {
  hubCatalogCache.write({
    defaultRepos: data.defaultRepos,
    localRegistry: data.localRegistry,
    remoteStates: sanitizeHubRemoteStates(data.remoteStates),
  });
}

export function readHubCatalogStaleCache(): HubCatalogCacheData | null {
  const data = hubCatalogCache.readStale();
  if (!data) return null;
  return {
    defaultRepos: data.defaultRepos,
    localRegistry: data.localRegistry,
    remoteStates: sanitizeHubRemoteStates(data.remoteStates ?? {}),
  };
}
