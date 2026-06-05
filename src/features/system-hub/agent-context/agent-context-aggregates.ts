import type { BarItem } from "../../../components/sales-shell";
import { resolveChartLegendIcon } from "../../../lib/badge-registry";
import type { AgentContextItem, AgentContextKind } from "./types";

const CHART_COLORS = ["#818cf8", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#f43f5e"];

const AGENT_KIND_CHART_LABEL: Record<AgentContextKind, string> = {
  pattern: "Pattern",
  rule: "Rule",
  skill: "Skill",
  command: "Command",
  doc: "Doc",
  agent: "Subagent",
};

function breakdown(items: AgentContextItem[], pick: (item: AgentContextItem) => string): BarItem[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const label = pick(item) || "—";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value], i) => ({
      label,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
      iconMeta: resolveChartLegendIcon(label),
    }))
    .sort((a, b) => b.value - a.value);
}

function applyMode(item: AgentContextItem): string {
  if (item.alwaysApply) return "Always apply";
  if (item.agentRequestable) return "Agent requestable";
  return "Manual / other";
}

function sizeBucket(lines: number): string {
  if (lines <= 20) return "Small (≤20)";
  if (lines <= 80) return "Medium (21–80)";
  return "Large (80+)";
}

export function agentContextKpis(items: AgentContextItem[]) {
  return {
    shown: items.length,
    patterns: items.filter((i) => i.kind === "pattern").length,
    rules: items.filter((i) => i.kind === "rule").length,
    skills: items.filter((i) => i.kind === "skill").length,
    agents: items.filter((i) => i.kind === "agent").length,
    commands: items.filter((i) => i.kind === "command").length,
    always: items.filter((i) => i.alwaysApply).length,
    requestable: items.filter((i) => i.agentRequestable).length,
  };
}

export function agentContextCharts(items: AgentContextItem[]) {
  return {
    kind: breakdown(items, (i) => AGENT_KIND_CHART_LABEL[i.kind] ?? i.kind),
    scope: breakdown(items, (i) => i.scope.charAt(0).toUpperCase() + i.scope.slice(1)),
    apply: breakdown(items, applyMode),
    size: breakdown(items, (i) => sizeBucket(i.lines)),
  };
}
