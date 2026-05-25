import type { WorkspaceTool } from "../../lib/workspace";
import type { ResolvedTool } from "../../types";

function mapType(tool: ResolvedTool): WorkspaceTool["type"] {
  const cat = tool.category.toLowerCase();
  if (cat.includes("electron") || cat.includes("desktop")) return "Electron";
  if (cat.includes("infra")) return "Infra";
  if (cat.includes("node") || cat.includes("bot")) return "Node";
  if (cat.includes("static")) return "Static";
  return "Web";
}

function mapStatus(tool: ResolvedTool): WorkspaceTool["status"] {
  if (tool.status === "Archived") return "Idle";
  if (tool.status === "Needs review") return "Needs review";
  return "Active";
}

function mapHealth(tool: ResolvedTool): WorkspaceTool["health"] {
  if (tool.driftAlerts.length > 0) return "fail";
  if (tool.healthLabel === "Ready") return "pass";
  if (tool.healthLabel === "Needs review") return "warn";
  return "warn";
}

export function toolsToWorkspace(tools: ResolvedTool[], currentCode = "P0004"): WorkspaceTool[] {
  return tools.map((t) => ({
    code: t.code,
    name: t.name,
    type: mapType(t),
    status: mapStatus(t),
    version: t.version,
    stack: t.tags.length > 0 ? t.tags.slice(0, 4) : [t.category],
    health: mapHealth(t),
    url: t.appUrl,
    current: t.code === currentCode,
  }));
}

export function workspaceStats(tools: WorkspaceTool[]) {
  return {
    totalTools: tools.length,
    active: tools.filter((t) => t.status === "Active").length,
    needsReview: tools.filter((t) => t.status === "Needs review").length,
    idle: tools.filter((t) => t.status === "Idle").length,
    avgVersion: "0.6.x",
    mostUsedStack: "React + Vite",
  };
}
