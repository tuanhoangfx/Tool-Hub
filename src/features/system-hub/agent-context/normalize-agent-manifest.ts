import type { AgentContextItem, AgentContextKind, AgentManifest } from "./types";

const VALID_KINDS = new Set<AgentContextKind>(["rule", "skill", "pattern", "command", "doc", "agent"]);

/** Legacy manifest rows → canonical kind */
const LEGACY_KIND_MAP: Record<string, AgentContextKind> = {
  contract: "doc",
  file: "doc",
  script: "command",
  table: "pattern",
  screen: "pattern",
  component: "pattern",
};

const VALID_LAYERS = new Set(["screen", "modal"]);
const LEGACY_LAYERS = new Set(["table-part", "exception"]);

const VALID_SCOPES = new Set<AgentContextItem["scope"]>(["workspace", "user", "package"]);

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeKind(raw: string): AgentContextKind {
  if (VALID_KINDS.has(raw as AgentContextKind)) return raw as AgentContextKind;
  return LEGACY_KIND_MAP[raw] ?? "doc";
}

function normalizeItem(raw: unknown, index: number): AgentContextItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<AgentContextItem>;
  const kind = normalizeKind(asString(row.kind));
  const scope = asString(row.scope);
  const path = asString(row.path);
  const name = asString(row.name, path || `item-${index + 1}`);

  let layer = typeof row.layer === "string" ? row.layer : undefined;
  if (layer && LEGACY_LAYERS.has(layer)) layer = "screen";
  if (layer && !VALID_LAYERS.has(layer)) layer = undefined;

  return {
    id: asString(row.id, `agent-${index}-${name}`),
    kind,
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
    golden: typeof row.golden === "string" && row.golden.trim() ? row.golden.trim() : undefined,
    clone: typeof row.clone === "string" && row.clone.trim() ? row.clone.trim() : undefined,
    cloneTooltip:
      typeof row.cloneTooltip === "string" && row.cloneTooltip.trim() ? row.cloneTooltip.trim() : undefined,
    layer: layer as AgentContextItem["layer"] | undefined,
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
