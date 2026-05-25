import { manifestForTool } from "./tool-overview-data";
import type { ResolvedTool, ToolManifest } from "../../types";

export type ManifestLinkGap = {
  key: string;
  label: string;
};

export function auditManifestLinks(tool: ResolvedTool, manifest?: ToolManifest): ManifestLinkGap[] {
  const m = manifest ?? manifestForTool(tool);
  const gaps: ManifestLinkGap[] = [];
  const urls = m.urls ?? {};
  const stack = [...(m.stack ?? []), ...(tool.tags ?? [])].join(" ").toLowerCase();

  if (!urls.local?.trim() && !tool.localUrl?.trim()) {
    gaps.push({ key: "local", label: "Local URL" });
  }
  if (!urls.app?.trim() && !tool.appUrl?.trim()) {
    gaps.push({ key: "app", label: "Web URL" });
  }
  if (!m.github?.repo?.trim() && !tool.repo?.trim()) {
    gaps.push({ key: "github", label: "GitHub repo" });
  }

  const deploy = (m.deployTarget ?? tool.deployTarget ?? "").toLowerCase();
  if (deploy.includes("vercel")) {
    const hasVercelUrl =
      Boolean(m.vercel?.productionUrl?.trim()) ||
      Boolean(m.vercel?.previewUrl?.trim()) ||
      Boolean(urls.app?.trim()) ||
      Boolean(tool.appUrl?.trim());
    if (!hasVercelUrl) gaps.push({ key: "vercel-url", label: "Vercel URL" });
    if (!m.vercel?.projectId?.trim()) gaps.push({ key: "vercel-id", label: "Vercel project ID" });
  }

  const expectsSupabase = stack.includes("supabase") || Boolean(m.supabase);
  if (expectsSupabase) {
    if (!m.supabase?.url?.trim()) gaps.push({ key: "supabase-url", label: "Supabase URL" });
    if (!m.supabase?.projectRef?.trim()) gaps.push({ key: "supabase-ref", label: "Supabase project ref" });
  }

  return gaps;
}

export function manifestLinkGapCount(tool: ResolvedTool): number {
  return auditManifestLinks(tool).length;
}

export function hasManifestLinkGaps(tool: ResolvedTool): boolean {
  return manifestLinkGapCount(tool) > 0;
}

export function manifestLinkGapSummary(tool: ResolvedTool): string {
  const gaps = auditManifestLinks(tool);
  if (gaps.length === 0) return "Complete";
  return gaps.map((g) => g.label).join(", ");
}
