import { FALLBACK_REPOSITORIES } from "../data/repositories";
import { prefetchJson } from "@dev/hub-load";
import type { LocalRegistry, ToolRepository } from "../types";
import { hubCatalogCache, readHubCatalogStaleCache, writeHubCatalogCache } from "./hub-catalog-client-cache";

const LOCAL_REGISTRY_URL = "/local-registry.json";

export function applyLocalRegistryToHubCache(registry: LocalRegistry, defaultRepos?: ToolRepository[]): void {
  const stale = readHubCatalogStaleCache();
  writeHubCatalogCache({
    defaultRepos: defaultRepos ?? stale?.defaultRepos ?? FALLBACK_REPOSITORIES,
    localRegistry: registry,
    remoteStates: stale?.remoteStates ?? {},
  });
}

/** Warm Hub catalog from workspace scan JSON (instant paint on next load + prefetch cache). */
export function hydrateHubCatalogFromLocalRegistry(): void {
  prefetchJson(LOCAL_REGISTRY_URL, (json) => {
    try {
      const registry = json as LocalRegistry;
      if (!registry?.repositories?.length) return;
      applyLocalRegistryToHubCache(registry);
    } catch {
      /* invalid registry */
    }
  });
}

export function hasHubCatalogStalePaint(): boolean {
  const stale = hubCatalogCache.readStale();
  return Boolean(stale?.localRegistry?.repositories?.length || stale?.defaultRepos?.length);
}
