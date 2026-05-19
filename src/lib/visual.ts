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

const CODE_ICONS: Record<string, string> = {
  P0001: "smart_toy",
  P0002: "live_tv",
  P0004: "library_books",
  P0005: "chat",
  P0007: "router",
  P0008: "point_of_sale",
};

const CODE_SVG_ICONS: Record<string, string> = {
  P0001: "/icons/electron.svg",
  P0002: "/icons/youtube.svg",
  P0004: "/icons/github.svg",
  P0005: "/icons/zalo.svg",
  P0007: "/icons/openrouter.svg",
  P0008: "/icons/nextjs.svg",
};

export function toolSvgIcon(tool: { code: string }): string | null {
  const code = tool.code?.toUpperCase();
  return CODE_SVG_ICONS[code] ?? null;
}

export function toolIconName(tool: { code: string; icon?: string }) {
  if (tool.icon) return tool.icon;
  const code = tool.code?.toUpperCase();
  if (code && CODE_ICONS[code]) return CODE_ICONS[code];
  const low = (tool.code || "").toLowerCase();
  if (low.includes("github") || low.includes("gtm")) return "hub";
  if (low.includes("yt") || low.includes("stream")) return "live_tv";
  if (low.includes("gpm")) return "smart_toy";
  if (low.includes("workspace") || low.includes("wsc")) return "dashboard";
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
