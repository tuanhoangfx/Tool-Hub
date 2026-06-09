import { createModulePrefetch } from "@dev/hub-load";
import type { SystemTab } from "./components/SystemTabs";

const systemTabPrefetch = createModulePrefetch<SystemTab>({
  overview: () => import("./SystemOverviewPanel"),
  schema: () => import("./SystemSchemaPanel"),
  "supabase-quota": () => import("./SystemSupabaseQuotaPanel"),
  server: () => import("./SystemServerPanel"),
  agent: () => import("./SystemAgentContextPanel"),
  template: () => import("./design-template/DesignTemplateHub"),
});

/** Warm lazy chunks before tab switch (hover / idle prefetch). */
export function prefetchSystemTab(tab: SystemTab): void {
  systemTabPrefetch.prefetch(tab);
}

export function prefetchAllSystemTabs(): void {
  systemTabPrefetch.prefetchAll();
}
