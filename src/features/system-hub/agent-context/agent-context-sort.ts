import type { AgentContextItem, AgentContextKind } from "./types";

const KIND_ORDER: Record<AgentContextKind, number> = {
  rule: 0,
  skill: 1,
  file: 2,
  contract: 3,
};

/** Stable flat list: kind (Rule → Skill → File → Contract), then name. */
export function sortAgentContextItems(items: AgentContextItem[]): AgentContextItem[] {
  return [...items].sort((a, b) => {
    const byKind = (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99);
    if (byKind !== 0) return byKind;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
