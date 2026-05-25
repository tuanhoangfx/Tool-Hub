import { parseChangelog } from "../../lib/changelog-parser";
import { HUB_CHANGELOG_INDEX, type ChangelogEntry } from "../../lib/workspace";
import { deployLabel } from "../../lib/tooling";
import type { ResolvedTool, ToolManifest } from "../../types";

export function manifestForTool(tool: ResolvedTool): ToolManifest {
  const m = tool.remote?.manifest;
  if (m) return m;
  return {
    code: tool.code,
    name: tool.name,
    status: tool.status,
    summary: tool.summary,
    stack: tool.tags?.length ? tool.tags : [tool.category],
    aliases: [tool.code],
    github: tool.repo ? { repo: tool.repo, branch: tool.branch } : undefined,
    urls: { app: tool.appUrl, local: tool.localUrl },
    release: { version: tool.version, readiness: [] },
    deployTarget: tool.deployTarget,
    health: { status: tool.healthLabel, note: tool.driftAlerts[0] },
    commands: {},
    docs: { readme: "README.md", changelog: "CHANGELOG.md" },
  };
}

export function changelogEntriesForTool(tool: ResolvedTool, hubFallbackRaw?: string): ChangelogEntry[] {
  const text = tool.remote?.files?.find((f) => f.path.toLowerCase() === "changelog.md")?.text;
  if (text) {
    return parseChangelog(text).slice(0, 8).map((e) => ({
      version: e.version ?? "—",
      date: e.date ?? "",
      type: e.type ?? "",
      title: e.title ?? e.heading,
    }));
  }
  if (tool.code === "P0004" && hubFallbackRaw) {
    return HUB_CHANGELOG_INDEX;
  }
  return [];
}

export function changelogFullTextForTool(tool: ResolvedTool, hubFallbackRaw?: string): string | undefined {
  const text = tool.remote?.files?.find((f) => f.path.toLowerCase() === "changelog.md")?.text;
  if (text) return text;
  if (tool.code === "P0004") return hubFallbackRaw;
  return undefined;
}

export function featuresForTool(tool: ResolvedTool, manifest: ToolManifest): string[] {
  if (manifest.features?.length) return manifest.features;
  if (tool.usage?.length) return tool.usage;
  if (tool.summary) return [tool.summary, `${tool.category} · ${deployLabel(tool.deployTarget)}`];
  return ["No feature list in manifest yet."];
}

export function stackForTool(tool: ResolvedTool, manifest: ToolManifest): string[] {
  if (manifest.stack?.length) return manifest.stack;
  if (tool.tags?.length) return tool.tags;
  return [tool.category];
}
