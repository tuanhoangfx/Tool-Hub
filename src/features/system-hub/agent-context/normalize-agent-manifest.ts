import type {
  AgentContentAnchor,
  AgentContentField,
  AgentContextItem,
  AgentContextKind,
  AgentGuideSection,
  AgentManifest,
} from "./types";

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

function normalizeContentFields(raw: unknown): AgentContentField[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const fields = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Partial<AgentContentField>;
      const label = asString(row.label);
      const value = asString(row.value);
      if (!label || !value) return null;
      const variant =
        row.variant === "code" || row.variant === "text" || row.variant === "multiline" ? row.variant : undefined;
      return { label, value, variant, copy: row.copy === true };
    })
    .filter((f) => f != null) as AgentContentField[];
  return fields.length ? fields : undefined;
}

function normalizeGuideSections(raw: unknown): AgentGuideSection[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const sections = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Partial<AgentGuideSection>;
      if (row.type === "group") {
        const anchor = asString(row.anchor);
        const title = asString(row.title);
        return anchor && title ? ({ type: "group", anchor, title } as AgentGuideSection) : null;
      }
      if (row.type === "keyword") {
        const anchor = asString(row.anchor);
        const keyword = asString(row.keyword);
        if (!anchor || !keyword) return null;
        return {
          type: "keyword",
          anchor,
          group: asString(row.group),
          keyword,
          example: asString(row.example),
          skill: asString(row.skill),
          summary: asString(row.summary),
          when: asString(row.when),
          command: asString(row.command),
          patternId: typeof row.patternId === "string" ? row.patternId : null,
          goldenRef: typeof row.goldenRef === "string" ? row.goldenRef : null,
          tabHint: typeof row.tabHint === "string" ? row.tabHint : null,
          gateIntent: typeof row.gateIntent === "string" ? row.gateIntent : null,
        } as AgentGuideSection;
      }
      return null;
    })
    .filter((s): s is AgentGuideSection => s != null);
  return sections.length ? sections : undefined;
}

const KEYWORD_GROUPS = new Set(["verify", "git", "hub-ui", "pattern", "supabase"]);

function normalizeKeywordGroup(raw: unknown): AgentContextItem["keywordGroup"] | undefined {
  return typeof raw === "string" && KEYWORD_GROUPS.has(raw) ? (raw as AgentContextItem["keywordGroup"]) : undefined;
}

function normalizeContentAnchors(raw: unknown): AgentContentAnchor[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const anchors = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Partial<AgentContentAnchor>;
      const id = asString(row.id);
      const label = asString(row.label);
      const level = row.level === 2 || row.level === 3 ? row.level : 3;
      return id && label ? ({ id, label, level } as AgentContentAnchor) : null;
    })
    .filter((a): a is AgentContentAnchor => a != null);
  return anchors.length ? anchors : undefined;
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
    contentFields: normalizeContentFields(row.contentFields),
    guideSections: normalizeGuideSections(row.guideSections),
    contentAnchors: normalizeContentAnchors(row.contentAnchors),
    keywordGroup: normalizeKeywordGroup(row.keywordGroup),
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
