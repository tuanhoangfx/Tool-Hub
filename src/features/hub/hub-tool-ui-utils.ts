import type { HealthState } from "../../hooks/useLocalHealth";
import type { ResolvedTool } from "../../types";

export type ToolCategoryKind = "web" | "bot" | "desktop" | "other";

const CATEGORY_BADGE: Record<ToolCategoryKind, string> = {
  web: "border-cyan-400/35 bg-cyan-500/12 text-cyan-200",
  bot: "border-violet-400/35 bg-violet-500/12 text-violet-200",
  desktop: "border-amber-400/35 bg-amber-500/12 text-amber-200",
  other: "border-slate-400/30 bg-slate-500/10 text-slate-300",
};

export function normalizeToolCategory(category: string): ToolCategoryKind {
  const c = category.trim().toLowerCase();
  if (c === "bot" || c.startsWith("bot")) return "bot";
  if (c === "desktop" || c.includes("desktop") || c.includes("electron")) return "desktop";
  if (c === "web" || c.startsWith("web")) return "web";
  return "other";
}

export function toolCodeBadgeClass(category: string): string {
  return CATEGORY_BADGE[normalizeToolCategory(category)];
}

export function healthDotColor(
  tool: Pick<ResolvedTool, "driftAlerts" | "localUrl">,
  healthState: HealthState | undefined,
  linkGapCount: number,
): string {
  if (tool.driftAlerts.length > 0) return "#f43f5e";
  if (linkGapCount > 0) return "#f59e0b";
  if (tool.localUrl && healthState === "offline") return "#ef4444";
  if (healthState === "online") return "#22c55e";
  if (tool.localUrl && healthState === "checking") return "#38bdf8";
  return "#64748b";
}
