import type { ToolVersionHistoryRow } from "../../../overview/tool-versions";

export const MOCK_VERSION_HISTORY: ToolVersionHistoryRow[] = [
  {
    id: "0.2.34",
    version: "0.2.34",
    display: "v0.2.34",
    date: "2026-05-20",
    title: "Hub drift badges",
    isCurrent: true,
    onManifest: true,
    onPackage: true,
    inChangelog: true,
    onGit: true,
    onPush: true,
    onRelease: true,
    publishedLabel: "12:40 20/05/2026",
    releaseUrl: "https://github.com/example/releases/tag/v0.2.34",
    syncStatus: "synced",
    syncNote: "Complete pipeline: package -> changelog -> manifest -> tag -> push -> release.",
  },
  {
    id: "0.2.33",
    version: "0.2.33",
    display: "v0.2.33",
    date: "2026-05-10",
    title: "Registry refresh",
    isCurrent: false,
    onManifest: false,
    onPackage: false,
    inChangelog: true,
    onGit: true,
    onPush: true,
    onRelease: true,
    publishedLabel: "10/05/2026",
    syncStatus: "synced",
    syncNote: "Released and documented in CHANGELOG.",
  },
];

export const TOOL_VERSION_VARIANTS = [
  { id: "V1", label: "History + pipeline", desc: "Mnf · Pkg · CL · Git · Push · Rel" },
] as const;

export type ToolVersionVariantId = "V1";

export function readToolVersionVariant(): ToolVersionVariantId {
  return "V1";
}

export function setToolVersionVariant(_id: ToolVersionVariantId) {
  const p = new URLSearchParams(window.location.search);
  p.set("screen", "system");
  p.set("stab", "template");
  p.set("dtpl", "tool-versions");
  p.set("vver", "V1");
  window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
}
