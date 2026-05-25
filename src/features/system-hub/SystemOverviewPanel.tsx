import { useMemo, useState } from "react";
import changelogRaw from "../../../CHANGELOG.md?raw";
import manifestJson from "../../../tool.manifest.json";
import type { ResolvedTool, ToolManifest, ToolRepository } from "../../types";
import { ToolOverviewContent } from "../overview/ToolOverviewContent";

function hubToolFromManifest(manifest: ToolManifest): ResolvedTool {
  const base: ToolRepository = {
    id: manifest.code ?? "P0004",
    code: manifest.code ?? "P0004",
    name: manifest.name ?? "Tool Hub",
    category: "Web",
    audience: "internal",
    status: (manifest.status as ToolRepository["status"]) ?? "Ready",
    summary: manifest.summary ?? "",
    tags: manifest.stack ?? [],
    repo: manifest.github?.repo ?? "",
    branch: manifest.github?.branch ?? "main",
    appUrl: manifest.urls?.app,
    localUrl: manifest.urls?.local,
    localPath: "",
    deployTarget: (manifest.deployTarget as ToolRepository["deployTarget"]) ?? "vercel",
    remoteEnabled: true,
    usage: manifest.features ?? [],
    downloadHint: "",
    manifestPath: "tool.manifest.json",
    trackedFiles: [],
    scriptFiles: [],
  };
  return {
    ...base,
    version: manifest.release?.version ?? "0.1.0",
    releaseUrl: "",
    repoUrl: manifest.github?.repo ? `https://github.com/${manifest.github.repo}` : "",
    downloadUrl: "",
    healthLabel: manifest.health?.status ?? "Ready",
    updatedAt: "",
    driftAlerts: manifest.health?.note ? [manifest.health.note] : [],
    suggestions: [],
  };
}

export function SystemOverviewPanel({ tools }: { tools: ResolvedTool[] }) {
  const hubTool = useMemo(() => {
    const found = tools.find((t) => t.code === "P0004");
    return found ?? hubToolFromManifest(manifestJson as ToolManifest);
  }, [tools]);

  const [focusedId, setFocusedId] = useState<string | null>(null);

  const activeTool = useMemo(() => {
    if (!focusedId) return hubTool;
    return tools.find((t) => t.id === focusedId) ?? hubTool;
  }, [focusedId, tools, hubTool]);

  return (
    <ToolOverviewContent
      tool={activeTool}
      allTools={tools}
      hubChangelogRaw={changelogRaw}
      onSelectTool={setFocusedId}
    />
  );
}
