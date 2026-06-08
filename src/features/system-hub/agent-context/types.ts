export type AgentContextKind = "rule" | "skill" | "pattern" | "command" | "doc" | "agent";

export type AgentPatternLayer = "screen" | "modal";

export type AgentContentField = {
  label: string;
  value: string;
  variant?: "code" | "text" | "multiline";
  copy?: boolean;
};

export type AgentGuideSection =
  | { type: "group"; anchor: string; title: string }
  | {
      type: "keyword";
      anchor: string;
      group: string;
      keyword: string;
      example: string;
      skill: string;
      summary: string;
      when: string;
      command: string;
      patternId: string | null;
      goldenRef: string | null;
      tabHint: string | null;
      gateIntent: string | null;
    };

export type AgentContentAnchor = {
  id: string;
  label: string;
  level: 2 | 3;
};

export type AgentContextItem = {
  id: string;
  kind: AgentContextKind;
  name: string;
  path: string;
  scope: "workspace" | "user" | "package";
  alwaysApply?: boolean;
  agentRequestable?: boolean;
  trigger?: string;
  summary: string;
  bodyPreview: string;
  lines: number;
  updatedAt: string;
  tags: string[];
  /** Cursor slash command, e.g. hub-ui */
  commandId?: string;
  /** Hub UI pattern layer (kind=pattern only) */
  layer?: AgentPatternLayer;
  /** Hub UI pattern golden ref, e.g. P0004/hub-list */
  golden?: string;
  /** Hub UI clone instances summary, e.g. P0006/bots, P0020/twofa */
  clone?: string;
  /** Full clone list for table tooltip */
  cloneTooltip?: string;
  /** Structured Reading mode fields (keyword rows) */
  contentFields?: AgentContentField[];
  /** Grouped keyword guide sections (agent-keyword-guide) */
  guideSections?: AgentGuideSection[];
  /** In-content anchor nav (deprecated — use table search/filter) */
  contentAnchors?: AgentContentAnchor[];
  /** Keyword SSOT group (keyword-* command rows) */
  keywordGroup?: "verify" | "git" | "hub-ui" | "pattern" | "supabase";
};

export type AgentManifest = {
  generatedAt: string;
  workspaceRoot: string;
  items: AgentContextItem[];
};
