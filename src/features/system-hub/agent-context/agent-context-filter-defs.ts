import type { FilterDef } from "../../../components/sales-shell";

export const AGENT_KIND_FILTERS: FilterDef[] = [
  {
    key: "agentKind",
    label: "Kind",
    showAllLabel: true,
    options: [
      { value: "pattern", label: "Pattern" },
      { value: "rule", label: "Rule" },
      { value: "skill", label: "Skill" },
      { value: "command", label: "Command" },
      { value: "agent", label: "Subagent" },
      { value: "doc", label: "Doc" },
    ],
  },
  {
    key: "agentLayer",
    label: "Layer",
    showAllLabel: true,
    options: [
      { value: "screen", label: "Screen" },
      { value: "modal", label: "Modal" },
    ],
  },
  {
    key: "agentScope",
    label: "Scope",
    showAllLabel: true,
    options: [
      { value: "workspace", label: "Workspace" },
      { value: "user", label: "User" },
      { value: "package", label: "Package" },
    ],
  },
];
