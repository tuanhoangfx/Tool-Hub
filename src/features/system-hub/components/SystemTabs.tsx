import { Database, LayoutGrid, Palette } from "lucide-react";

export type SystemTab = "overview" | "schema" | "template";

const tabs: { id: SystemTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "schema", label: "Schema", icon: Database },
  { id: "template", label: "Design Template", icon: Palette },
];

export function readSystemTab(): SystemTab {
  if (typeof window === "undefined") return "overview";
  const t = new URLSearchParams(window.location.search).get("stab");
  if (t === "schema") return "schema";
  if (t === "template") return "template";
  return "overview";
}

export const SYSTEM_TAB_ITEMS = tabs;

export function setSystemTab(id: SystemTab) {
  const p = new URLSearchParams(window.location.search);
  p.set("screen", "system");
  p.set("stab", id);
  if (id === "schema" && !p.get("table")) p.set("table", "catalog");
  window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
