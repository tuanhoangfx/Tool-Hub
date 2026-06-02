import { prefetchJson } from "@dev/hub-load";
import type { AgentManifest } from "../features/system-hub/agent-context/types";
import { hydrateHubCatalogFromLocalRegistry } from "./hub-catalog-hydrate";
import { agentManifestCache } from "./agent-manifest-cache";
import { QuotaPayloadSchema } from "../features/system-hub/supabase-quota-schema";
import {
  readSupabaseQuotaStaleCache,
  writeSupabaseQuotaClientCache,
} from "../features/system-hub/supabase-quota-client-cache";

const AGENT_MANIFEST_URL = "/agent-manifest.json";

function applyAgentManifest(json: unknown): void {
  try {
    const data = json as AgentManifest;
    if (Array.isArray(data?.items)) agentManifestCache.write(data);
  } catch {
    /* invalid manifest */
  }
}

const SNAPSHOT_URL = "/supabase-quota-catalog.snapshot.json";

function applyQuotaPayload(json: unknown): void {
  try {
    const data = QuotaPayloadSchema.parse(json);
    if (data.ok) writeSupabaseQuotaClientCache(data);
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
export function prefetchSupabaseQuotaCatalog(): void {
  hydrateSupabaseQuotaFromBuildSnapshot();
  prefetchJson("/api/supabase/quota?fast=1", applyQuotaPayload);
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
