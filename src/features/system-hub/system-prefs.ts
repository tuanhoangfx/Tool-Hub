import type { PrefItem } from "../../components/sales-shell/DisplayPrefs";

export type SystemHeaderStatKey = "tools" | "templates" | "locked" | "schema";

export const SYSTEM_HEADER_STAT_DEFS: PrefItem[] = [
  { key: "tools", label: "Tools" },
  { key: "templates", label: "Templates" },
  { key: "locked", label: "Locked designs" },
  { key: "schema", label: "Schema entities" },
];

export const DEFAULT_SYSTEM_HEADER_STAT_KEYS = new Set<SystemHeaderStatKey>(["tools", "templates"]);
