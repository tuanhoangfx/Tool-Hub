export type AgentContextKind = "rule" | "skill" | "pattern" | "command" | "doc" | "agent";

export type AgentPatternLayer = "screen" | "modal";

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
};

export type AgentManifest = {
  generatedAt: string;
  workspaceRoot: string;
  items: AgentContextItem[];
};
