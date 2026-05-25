/** Locked UI decisions — reference only; no mockups or variant pickers. */
export type LockedUiDecision = {
  id: string;
  label: string;
  choice: string;
  production: string;
  doc?: string;
};

export const LOCKED_UI_DECISIONS: LockedUiDecision[] = [
  {
    id: "tool-versions",
    label: "Tool Versions",
    choice: "V4 Filtered table",
    production: "src/features/overview/ToolVersionsPanel.tsx",
    doc: "docs/DESIGN-DECISION-TOOL-VERSIONS.md",
  },
  {
    id: "tool-links",
    label: "Tool Links",
    choice: "V4a Standard",
    production: "src/features/overview/ToolLinksTable.tsx",
    doc: "docs/DESIGN-PREVIEW-TOOL-LINKS.md",
  },
  {
    id: "hub-card",
    label: "Hub Card",
    choice: "V4 quiet badges + V3 status dot",
    production: "src/features/hub/HubToolCard.tsx",
    doc: "docs/DESIGN-DECISION-HUB-CARD.md",
  },
  {
    id: "hub-header",
    label: "Hub / System header",
    choice: "V2 Compact command rail",
    production: "src/features/hub/HubStickyHeader.tsx · src/components/sales-shell/AppTabHeader.tsx",
    doc: "docs/DESIGN-DECISION-HUB-HEADER.md",
  },
  {
    id: "badges",
    label: "Badges & filter icons",
    choice: "badge-registry (Hub canonical)",
    production: "src/lib/badge-registry.ts",
  },
];

export const LOCKED_UI_COUNT = LOCKED_UI_DECISIONS.length;
export const LOCKED_UI_LOCKED_COUNT = 4;
