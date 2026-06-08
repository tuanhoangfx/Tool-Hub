import type { FilterDef, FilterValues } from "../../../components/sales-shell";

export const AGENT_ONBOARDING_PRESET: FilterValues = {
  agentTag: ["onboarding"],
};

export const AGENT_KEYWORD_PRESETS = {
  verify: { agentTag: ["keyword"], agentKeywordGroup: ["verify"] },
  git: { agentTag: ["keyword"], agentKeywordGroup: ["git"] },
  hubUi: { agentTag: ["keyword"], agentKeywordGroup: ["hub-ui"] },
  pattern: { agentTag: ["keyword"], agentKeywordGroup: ["pattern"] },
  supabase: { agentTag: ["keyword"], agentKeywordGroup: ["supabase"] },
  allKeywords: { agentTag: ["keyword"] },
} as const satisfies Record<string, FilterValues>;

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
    key: "agentTag",
    label: "Tag",
    showAllLabel: true,
    options: [
      { value: "onboarding", label: "Onboarding" },
      { value: "keyword", label: "Keyword" },
      { value: "infrastructure", label: "Infrastructure" },
      { value: "pattern", label: "Pattern keyword" },
      { value: "supabase", label: "Supabase" },
    ],
  },
  {
    key: "agentKeywordGroup",
    label: "Keyword group",
    showAllLabel: true,
    options: [
      { value: "verify", label: "Verify" },
      { value: "git", label: "Git / Production" },
      { value: "hub-ui", label: "Hub UI shell" },
      { value: "pattern", label: "Pattern clone" },
      { value: "supabase", label: "Supabase / Migrate" },
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
