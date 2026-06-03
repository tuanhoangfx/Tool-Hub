export type AgentContextKind = "rule" | "skill" | "file" | "contract" | "command" | "script";

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
};

export type AgentManifest = {
  generatedAt: string;
  workspaceRoot: string;
  items: AgentContextItem[];
};
