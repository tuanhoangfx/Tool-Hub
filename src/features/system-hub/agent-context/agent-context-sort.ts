import type { AgentContextItem, AgentContextKind } from "./types";

const KIND_ORDER: Record<AgentContextKind, number> = {
  rule: 0,
  skill: 1,
  command: 2,
  script: 3,
  contract: 4,
  file: 5,
};

/** Stable flat list: kind (Rule → Skill → File → Contract), then name. */
export function sortAgentContextItems(items: AgentContextItem[]): AgentContextItem[] {
  return [...items].sort((a, b) => {
    const byKind = (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99);
    if (byKind !== 0) return byKind;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
