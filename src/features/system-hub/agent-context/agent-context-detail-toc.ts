export const AGENT_CONTEXT_DETAIL_TOC = [
  { id: "overview", label: "Overview", emoji: "◎", chipClass: "border-indigo-400/30 bg-indigo-500/15" },
  { id: "content", label: "Content", emoji: "¶", chipClass: "border-sky-400/30 bg-sky-500/15" },
  { id: "paths", label: "Paths & sync", emoji: "⎘", chipClass: "border-violet-400/30 bg-violet-500/15" },
  { id: "triggers", label: "Triggers", emoji: "⚡", chipClass: "border-amber-400/30 bg-amber-500/15" },
] as const;

export function agentContextSectionTitle(id: (typeof AGENT_CONTEXT_DETAIL_TOC)[number]["id"]): string {
  const item = AGENT_CONTEXT_DETAIL_TOC.find((t) => t.id === id);
  return item ? `${item.emoji} ${item.label}` : id;
}
