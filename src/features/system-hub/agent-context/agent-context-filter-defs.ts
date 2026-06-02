import type { FilterDef } from "../../../components/sales-shell";

export const AGENT_KIND_FILTERS: FilterDef[] = [
  {
    key: "kind",
    label: "Kind",
    showAllLabel: true,
    options: [
      { value: "rule", label: "Rule" },
      { value: "skill", label: "Skill" },
      { value: "file", label: "File" },
      { value: "contract", label: "Contract" },
    ],
  },
  {
    key: "scope",
    label: "Scope",
    showAllLabel: true,
    options: [
      { value: "workspace", label: "Workspace" },
      { value: "user", label: "User" },
      { value: "package", label: "Package" },
    ],
  },
];
