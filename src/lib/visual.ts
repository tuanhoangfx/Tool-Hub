import type { ResolvedTool, RemoteFileState } from "../types";

export function fileHealthPercent(files?: RemoteFileState[]) {
  if (!files?.length) return 0;
  return Math.round((files.filter((f) => f.ok).length / files.length) * 100);
}

export function healthTone(percent: number) {
  if (percent > 70) return "ok" as const;
  if (percent >= 30) return "warn" as const;
  return "bad" as const;
}

export function toolIconName(tool: ResolvedTool) {
  const code = tool.code.toLowerCase();
  if (code.includes("github") || code.includes("gtm")) return "hub";
  if (code.includes("yt") || code.includes("stream")) return "live_tv";
  if (code.includes("gpm")) return "smart_toy";
  if (code.includes("workspace") || code.includes("wsc")) return "dashboard";
  return "inventory_2";
}

export function statusIcon(tool: ResolvedTool) {
  if (tool.remoteEnabled === false) return "cloud_off";
  if (tool.healthLabel === "Ready") return "check_circle";
  if (tool.healthLabel === "Needs review") return "rate_review";
  if (tool.healthLabel === "Experimental") return "science";
  if (tool.healthLabel === "Archived") return "inventory";
  return "help";
}
