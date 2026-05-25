export type WorkspaceTool = {
  code: string;
  name: string;
  type: "Web" | "Electron" | "Node" | "Static" | "Infra";
  status: "Active" | "Idle" | "Needs review";
  version: string;
  stack: string[];
  health: "pass" | "warn" | "fail";
  url?: string;
  current?: boolean;
};

export type ChangelogEntry = {
  version: string;
  date: string;
  type: string;
  title: string;
};

export const HUB_CHANGELOG_INDEX: ChangelogEntry[] = [
  { version: "0.1.0", date: "2026-05-24", type: "P0008 shell", title: "Hub Orders layout + System Overview/Schema clone" },
  { version: "0.1.0", date: "2026-05-24", type: "Infra rename", title: "Full infra rename Tool Hub" },
  { version: "0.1.0", date: "2026-05-23", type: "Rebrand", title: "Tool Hub rebrand + Library-only UI" },
];
