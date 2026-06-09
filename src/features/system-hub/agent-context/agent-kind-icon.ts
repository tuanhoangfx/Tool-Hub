import { FileText, type LucideIcon } from "lucide-react";
import { AGENT_KIND_SEMANTIC, resolveSemanticIcon } from "@tool-workspace/hub-ui";
import type { AgentContextItem, AgentContextKind } from "./types";

export function agentKindIcon(kind: AgentContextKind): LucideIcon {
  const key = AGENT_KIND_SEMANTIC[kind];
  if (key) return resolveSemanticIcon(key).icon as LucideIcon;
  return FileText;
}

export function agentStatusDotColor(item: Pick<AgentContextItem, "alwaysApply" | "agentRequestable">): string {
  if (item.alwaysApply) return "#22c55e";
  if (item.agentRequestable) return "#f59e0b";
  return "#64748b";
}
