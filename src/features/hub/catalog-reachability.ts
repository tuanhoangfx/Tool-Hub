import type { ResolvedTool } from "../../types";

/** Unique app + local URLs for on-demand reachability probe (no auto poll on catalog). */
export function catalogReachabilityUrls(tools: ResolvedTool[]): string[] {
  const urls = new Set<string>();
  for (const tool of tools) {
    if (tool.appUrl?.trim()) urls.add(tool.appUrl.trim());
    if (tool.localUrl?.trim()) urls.add(tool.localUrl.trim());
  }
  return [...urls].sort();
}
