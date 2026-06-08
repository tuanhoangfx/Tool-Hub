import { AlignLeft, LayoutGrid, RefreshCw, Zap } from "lucide-react";
import { HubTocSectionNav, HUB_TOOL_DETAIL_SCROLL_ROOT } from "@tool-workspace/hub-ui";

const AGENT_TOC_ITEMS = [
  { id: "overview", label: "Overview", icon: <LayoutGrid size={11} strokeWidth={2} aria-hidden /> },
  { id: "content", label: "Content", icon: <AlignLeft size={11} strokeWidth={2} aria-hidden /> },
  { id: "paths", label: "Paths & sync", icon: <RefreshCw size={11} strokeWidth={2} aria-hidden /> },
  { id: "triggers", label: "Triggers", icon: <Zap size={11} strokeWidth={2} aria-hidden /> },
] as const;

export const AGENT_CONTEXT_SECTION_IDS = AGENT_TOC_ITEMS.map((item) => item.id);

export type AgentContextSectionId = (typeof AGENT_TOC_ITEMS)[number]["id"];

export function agentContextSectionTitle(id: AgentContextSectionId): string {
  return AGENT_TOC_ITEMS.find((item) => item.id === id)?.label ?? id;
}

type AgentContextTocNavProps = {
  idPrefix?: string;
  scrollRootSelector?: string;
};

export function AgentContextTocNav({
  idPrefix = "",
  scrollRootSelector = HUB_TOOL_DETAIL_SCROLL_ROOT,
}: AgentContextTocNavProps) {
  return (
    <div className="overview-toc-nav relative z-10 w-[var(--overview-toc-w)] shrink-0 rounded-2xl border border-indigo-300/10 bg-[var(--panel)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)] ring-1 ring-white/[.025]">
      <HubTocSectionNav items={AGENT_TOC_ITEMS} sectionIdPrefix={idPrefix} scrollRootSelector={scrollRootSelector} />
    </div>
  );
}
