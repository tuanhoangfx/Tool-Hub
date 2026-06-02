import { prefetchJson } from "@dev/hub-load";
import { normalizeAgentManifest } from "../features/system-hub/agent-context/normalize-agent-manifest";
import { hydrateHubCatalogFromLocalRegistry } from "./hub-catalog-hydrate";
import { agentManifestCache } from "./agent-manifest-cache";
import { QuotaPayloadSchema } from "../features/system-hub/supabase-quota-schema";
import {
  readSupabaseQuotaStaleCache,
  writeSupabaseQuotaClientCache,
} from "../features/system-hub/supabase-quota-client-cache";
import { mergeQuotaPayloadPatches } from "../features/system-hub/supabase-quota-merge";

const AGENT_MANIFEST_URL = "/agent-manifest.json";

function applyAgentManifest(json: unknown): void {
  try {
    const data = normalizeAgentManifest(json);
    if (data) agentManifestCache.write(data);
  } catch {
    /* invalid manifest */
  }
}

const SNAPSHOT_URL = "/supabase-quota-catalog.snapshot.json";

function applyQuotaPayload(json: unknown): void {
  try {
    const data = QuotaPayloadSchema.parse(json);
    if (!data.ok) return;
    const prev = readSupabaseQuotaStaleCache();
    if (
      prev &&
      data.projects?.length &&
      (data.projects.length < (prev.projects?.length ?? 0) || (data.organizations?.length ?? 0) > 0)
    ) {
      writeSupabaseQuotaClientCache(
        mergeQuotaPayloadPatches(prev, {
          projects: data.projects ?? [],
          organizations: data.organizations ?? [],
        }),
      );
      return;
    }
    writeSupabaseQuotaClientCache(data);
  } catch {
    /* invalid snapshot */
  }
}

/** Instant catalog from build-time snapshot (no dev server). */
export function hydrateSupabaseQuotaFromBuildSnapshot(): void {
  if (readSupabaseQuotaStaleCache()) return;
  prefetchJson(SNAPSHOT_URL, applyQuotaPayload);
}

/** Warm Supabase Quota catalog via dev API (tool bindings may be newer than snapshot). */
const PRIORITY_REFS = "bklxcjrkhrevdcqjscku,zvdxznbbwbqvdaxliujs";

export function prefetchSupabaseQuotaCatalog(): void {
  hydrateSupabaseQuotaFromBuildSnapshot();
  prefetchJson("/api/supabase/quota?fast=1", applyQuotaPayload);
  prefetchJson(`/api/supabase/quota?refs=${PRIORITY_REFS}`, applyQuotaPayload);
}

/** Warm static registry JSON used by Users tool catalog. */
export function prefetchWorkspaceCatalogJson(): void {
  hydrateHubCatalogFromLocalRegistry();
  prefetchJson("/workspace-catalog.json", () => undefined);
}

export function prefetchAgentManifest(): void {
  prefetchJson(AGENT_MANIFEST_URL, applyAgentManifest);
}

export function prefetchHubBackgroundData(): void {
  hydrateHubCatalogFromLocalRegistry();
  hydrateSupabaseQuotaFromBuildSnapshot();
  prefetchSupabaseQuotaCatalog();
  prefetchWorkspaceCatalogJson();
  prefetchAgentManifest();
}
