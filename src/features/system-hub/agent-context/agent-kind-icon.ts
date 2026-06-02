import { BookOpen, Bot, FileCode, ScrollText, Sparkles, type LucideIcon } from "lucide-react";
import type { AgentContextItem, AgentContextKind } from "./types";

export function agentKindIcon(kind: AgentContextKind): LucideIcon {
  switch (kind) {
    case "rule":
      return ScrollText;
    case "skill":
      return Sparkles;
    case "contract":
      return BookOpen;
    case "file":
      return FileCode;
    default:
      return Bot;
  }
}

export function agentStatusDotColor(item: Pick<AgentContextItem, "alwaysApply" | "agentRequestable">): string {
  if (item.alwaysApply) return "#22c55e";
  if (item.agentRequestable) return "#f59e0b";
  return "#64748b";
}
