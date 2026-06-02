import { Bot, Database, Gauge, LayoutGrid, Palette } from "lucide-react";
import { buildSystemUrl, readSystemRoute } from "../../../lib/system-path";
import { sanitizeQueryForScreen } from "../../../lib/hub-query";
import type { SchemaEntity } from "../../../lib/system-path";

export type SystemTab = "overview" | "schema" | "supabase-quota" | "agent" | "template";

const tabs: { id: SystemTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "schema", label: "Schema", icon: Database },
  { id: "supabase-quota", label: "Supabase Quota", icon: Gauge },
  { id: "agent", label: "Agent", icon: Bot },
  { id: "template", label: "Design Template", icon: Palette },
];

export function readSystemTab(): SystemTab {
  return readSystemRoute().tab;
}

export const SYSTEM_TAB_ITEMS = tabs;

export function setSystemTab(id: SystemTab) {
  const onSystemPath = typeof window !== "undefined" && window.location.pathname.startsWith("/system");
  const route = onSystemPath ? readSystemRoute() : { tab: id as SystemTab };
  route.tab = id;

  if (id !== "schema") delete route.schemaEntity;
  else if (!route.schemaEntity) route.schemaEntity = "catalog";

  if (id === "template") {
    route.design = {
      template: route.design?.template ?? "agent-context",
      variant: route.design?.variant ?? 1,
      live: false,
    };
  } else {
    delete route.design;
  }

  const p = sanitizeQueryForScreen("system", window.location.search);
  const url = buildSystemUrl(route, p.toString());
  if (onSystemPath) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function readSchemaEntity(): SchemaEntity {
  const entity = readSystemRoute().schemaEntity;
  if (entity === "manifest" || entity === "runtime") return entity;
  return "catalog";
}

export function setSchemaEntity(entity: SchemaEntity) {
  const route = readSystemRoute();
  route.tab = "schema";
  route.schemaEntity = entity;
  delete route.design;
  const p = sanitizeQueryForScreen("system", window.location.search);
  window.history.replaceState(null, "", buildSystemUrl(route, p.toString()));
  window.dispatchEvent(new PopStateEvent("popstate"));
}
