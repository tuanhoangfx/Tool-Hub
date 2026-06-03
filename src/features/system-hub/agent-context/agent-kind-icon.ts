import { BookOpen, Bot, FileCode, ScrollText, Sparkles, Terminal, Wrench, type LucideIcon } from "lucide-react";
import type { AgentContextItem, AgentContextKind } from "./types";

export function agentKindIcon(kind: AgentContextKind): LucideIcon {
  switch (kind) {
    case "rule":
      return ScrollText;
    case "skill":
      return Sparkles;
    case "contract":
      return BookOpen;
    case "command":
      return Terminal;
    case "script":
      return Wrench;
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
