import type { ResolvedTool } from "../types";

export type PublishCheck = {
  label: string;
  passed: boolean;
};

export function buildPublishChecks(tool: ResolvedTool): PublishCheck[] {
  const files = tool.remote?.files ?? [];
  return [
    { label: "README", passed: Boolean(files.find((f) => f.path === "README.md" && f.ok)) },
    {
      label: "CHANGELOG",
      passed: Boolean(files.find((f) => f.path === "CHANGELOG.md" && f.ok)) && tool.driftAlerts.every((a) => !a.includes("CHANGELOG")),
    },
    { label: "Manifest", passed: Boolean(files.find((f) => f.path === tool.manifestPath && f.ok)) },
    { label: "No drift", passed: tool.driftAlerts.length === 0 },
    { label: "Release", passed: Boolean(tool.remote?.latestRelease) },
    { label: "Scripts", passed: tool.scriptFiles.every((s) => files.find((f) => f.path === s && f.ok)) },
  ];
}

export function formatPublishChecklist(tool: ResolvedTool, checks: PublishCheck[]) {
  const passed = checks.filter((c) => c.passed).length;
  const lines = [
    `Publish checklist — ${tool.name} (${tool.code})`,
    `Repo: ${tool.repo}`,
    `Version: v${tool.version}`,
    `Score: ${passed}/${checks.length}`,
    "",
    ...checks.map((c) => `- [${c.passed ? "x" : " "}] ${c.label}`),
  ];
  if (tool.driftAlerts.length > 0) {
    lines.push("", "Drift:", ...tool.driftAlerts.map((a) => `- ${a}`));
  }
  if (tool.suggestions.length > 0) {
    lines.push("", "Suggestions:", ...tool.suggestions.map((s) => `- ${s}`));
  }
  return lines.join("\n");
}
