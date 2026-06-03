import type { SystemTab } from "./components/SystemTabs";

/** Warm lazy chunks before tab switch (hover / idle prefetch). */
export function prefetchSystemTab(tab: SystemTab): void {
  switch (tab) {
    case "overview":
      void import("./SystemOverviewPanel");
      break;
    case "schema":
      void import("./SystemSchemaPanel");
      break;
    case "supabase-quota":
      void import("./SystemSupabaseQuotaPanel");
      break;
    case "server":
      void import("./SystemServerPanel");
      break;
    case "agent":
      void import("./SystemAgentContextPanel");
      break;
    case "template":
      void import("./design-template/DesignTemplateHub");
      break;
    default:
      break;
  }
}

export function prefetchAllSystemTabs(): void {
  prefetchSystemTab("overview");
  prefetchSystemTab("schema");
  prefetchSystemTab("supabase-quota");
  prefetchSystemTab("server");
  prefetchSystemTab("agent");
  prefetchSystemTab("template");
}
