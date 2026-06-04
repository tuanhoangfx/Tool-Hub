import type { AgentContextItem, AgentContextKind } from "./types";

const KIND_ORDER: Record<AgentContextKind, number> = {
  pattern: 0,
  rule: 1,
  skill: 2,
  agent: 3,
  command: 4,
  doc: 5,
};

/** Stable flat list: kind (Pattern first), then name. */
export function sortAgentContextItems(items: AgentContextItem[]): AgentContextItem[] {
  return [...items].sort((a, b) => {
    const byKind = (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99);
    if (byKind !== 0) return byKind;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
