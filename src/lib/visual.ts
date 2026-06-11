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
  P0021: "movie",
  E0001: "cookie",
};

const CODE_SVG_ICONS: Record<string, string> = {
  P0001: "/icons/tools/P0001.svg",
  P0002: "/icons/tools/P0002.svg",
  P0004: "/icons/tools/P0004.svg",
  P0005: "/icons/tools/P0005.svg",
  P0007: "/icons/tools/P0007.svg",
  P0008: "/icons/tools/P0008.svg",
  P0009: "/icons/tools/P0009.svg",
  P0012: "/icons/tools/P0012.svg",
  P0013: "/icons/tools/P0013.svg",
  P0015: "/icons/tools/P0015.svg",
  P0019: "/icons/tools/P0019.svg",
  P0020: "/icons/tools/P0020.svg",
  P0021: "/icons/tools/P0021.svg",
  E0001: "/icons/tools/E0001.svg",
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
