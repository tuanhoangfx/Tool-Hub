import type { ProjectRow, ToolBindingRow } from "./SystemSupabaseQuotaPanel.types";

/** Infer Hub category tint for P00xx / E00xx tool codes. */
export function toolCategoryForCode(code: string): string {
  const c = code.trim().toUpperCase();
  if (c.startsWith("P0005") || c.includes("BOT")) return "bot";
  if (c.startsWith("E")) return "desktop";
  return "web";
}

/** Workspace scan + catalog + legacy client map — prefer server-merged `tools`. */
export function resolveProjectToolCodes(
  project: ProjectRow,
  toolCodesByRef: Record<string, string[]> = {},
): string[] {
  if (project.tools?.length) return project.tools;
  const ws = project.projectRef ? toolCodesByRef[project.projectRef] ?? [] : [];
  const cat = project.catalogTools ?? [];
  const scanned = project.workspaceTools ?? [];
  return [...new Set([...ws, ...scanned, ...cat])].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

export function bindingsForTool(bindings: ToolBindingRow[] | undefined, toolCode: string): ToolBindingRow[] {
  return (bindings ?? []).filter((b) => b.toolCode === toolCode);
}

/** Tooltip: env file + key per workspace binding. */
export function formatToolUsedByTooltip(toolCode: string, bindings: ToolBindingRow[] | undefined): string {
  const rows = bindingsForTool(bindings, toolCode);
  if (!rows.length) {
    return `Used by: ${toolCode}\n(catalog mapping — no .env binding found in workspace scan)`;
  }
  const lines = rows.map((b) => {
    const head = b.toolName && b.toolName !== toolCode ? `${toolCode} · ${b.toolName}` : toolCode;
    if (b.source === "catalog") return `${head} · catalog`;
    const envParts = [b.envFile, b.envKey].filter(Boolean).join(" · ");
    const label = b.envLabel && b.envKey ? ` (${b.envLabel})` : b.envLabel ? ` · ${b.envLabel}` : "";
    return envParts ? `${head} · ${envParts}${label}` : head;
  });
  return `Used by:\n${lines.join("\n")}`;
}
