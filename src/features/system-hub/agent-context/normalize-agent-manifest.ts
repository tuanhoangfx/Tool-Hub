import type { AgentContextItem, AgentContextKind, AgentManifest } from "./types";

const VALID_KINDS = new Set<AgentContextKind>(["rule", "skill", "file", "contract", "command", "script"]);
const VALID_SCOPES = new Set<AgentContextItem["scope"]>(["workspace", "user", "package"]);

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeItem(raw: unknown, index: number): AgentContextItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<AgentContextItem>;
  const kind = asString(row.kind);
  const scope = asString(row.scope);
  const path = asString(row.path);
  const name = asString(row.name, path || `item-${index + 1}`);

  return {
    id: asString(row.id, `agent-${index}-${name}`),
    kind: VALID_KINDS.has(kind as AgentContextKind) ? (kind as AgentContextKind) : "file",
    name,
    path,
    scope: VALID_SCOPES.has(scope as AgentContextItem["scope"])
      ? (scope as AgentContextItem["scope"])
      : "workspace",
    alwaysApply: row.alwaysApply === true,
    agentRequestable: row.agentRequestable === true,
    trigger: typeof row.trigger === "string" ? row.trigger : undefined,
    commandId: typeof row.commandId === "string" ? row.commandId : undefined,
    summary: asString(row.summary),
    bodyPreview: asString(row.bodyPreview),
    lines: typeof row.lines === "number" && Number.isFinite(row.lines) ? row.lines : 0,
    updatedAt: asString(row.updatedAt),
    tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => typeof t === "string") : [],
  };
}

/** Coerce manifest rows so UI never crashes on unknown kind/scope or missing fields. */
export function normalizeAgentManifest(data: unknown): AgentManifest | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as Partial<AgentManifest>;
  const items = Array.isArray(raw.items)
    ? raw.items.map(normalizeItem).filter((item): item is AgentContextItem => item != null)
    : [];

  return {
    generatedAt: asString(raw.generatedAt, new Date().toISOString()),
    workspaceRoot: asString(raw.workspaceRoot),
    items,
  };
}
