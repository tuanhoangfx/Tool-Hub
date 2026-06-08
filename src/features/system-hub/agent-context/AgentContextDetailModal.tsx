import { useMemo } from "react";
import {
  HubToolDetailModal,
  HubToolDetailSection,
  HUB_TOOL_DETAIL_SECTIONS_CLASS,
} from "@tool-workspace/hub-ui";
import { HubCardAvatar } from "../../../components/HubCardAvatar";
import { TocHighlightContent, TocSectionHighlightProvider } from "../../overview/toc-section-highlight-context";
import { AgentContextTocNav, AGENT_CONTEXT_SECTION_IDS, agentContextSectionTitle } from "./agent-context-toc-nav";
import { AgentContextBodyView } from "./AgentContextBodyView";
import { agentKindIcon, agentStatusDotColor } from "./agent-kind-icon";
import type { AgentContextItem } from "./types";

type AgentContextDetailModalProps = {
  item: AgentContextItem | null;
  manifestGeneratedAt?: string;
  onClose: () => void;
};

export function AgentContextDetailModal({ item, manifestGeneratedAt, onClose }: AgentContextDetailModalProps) {
  const idPrefix = item ? `ac-${item.id}-` : "";
  const tocSectionIds = useMemo(
    () => (item ? AGENT_CONTEXT_SECTION_IDS.map((id) => `${idPrefix}${id}`) : []),
    [idPrefix, item],
  );

  if (!item) return null;

  return (
    <HubToolDetailModal
      open
      onClose={onClose}
      title={item.name}
      titleId={`agent-context-${item.id}`}
      ariaLabelledBy={`agent-context-${item.id}`}
      headerLeading={
        <HubCardAvatar
          variant="agent"
          icon={agentKindIcon(item.kind)}
          size="sm"
          statusColor={agentStatusDotColor(item)}
          statusTitle={item.alwaysApply ? "Always apply" : item.agentRequestable ? "Agent requestable" : "Manual"}
        />
      }
      headerTrailing={
        <span className="truncate font-mono text-[10px] text-[var(--muted)]">{item.kind}</span>
      }
      toc={<AgentContextTocNav idPrefix={idPrefix} />}
    >
      <TocSectionHighlightProvider sectionIds={tocSectionIds}>
        <TocHighlightContent className={HUB_TOOL_DETAIL_SECTIONS_CLASS}>
          <p className="font-mono text-[11px] text-[var(--muted)]">{item.path}</p>

          <HubToolDetailSection id={`${idPrefix}overview`} title={agentContextSectionTitle("overview")}>
            <p className="text-sm text-[var(--text)]">{item.summary}</p>
            <dl className="grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-[var(--muted)]">Scope</dt>
                <dd className="font-medium capitalize">{item.scope}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Golden</dt>
                <dd className="font-mono text-[11px] font-medium text-emerald-200/90">{item.golden ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Clone</dt>
                <dd className="whitespace-pre-wrap font-mono text-[11px] font-medium text-sky-200/90" title={item.cloneTooltip}>
                  {item.clone ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Lines</dt>
                <dd className="font-medium tabular-nums">{item.lines}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Always apply</dt>
                <dd className="font-medium">{item.alwaysApply ? "Yes" : "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Agent requestable</dt>
                <dd className="font-medium">{item.agentRequestable ? "Yes" : "—"}</dd>
              </div>
            </dl>
          </HubToolDetailSection>

          <HubToolDetailSection id={`${idPrefix}content`} title={agentContextSectionTitle("content")}>
            <AgentContextBodyView item={item} />
          </HubToolDetailSection>

          <HubToolDetailSection id={`${idPrefix}paths`} title={agentContextSectionTitle("paths")}>
            <p className="text-xs text-[var(--muted)]">
              Manifest rebuilt on Refresh (dev) or <span className="font-mono text-indigo-200/90">pnpm build</span>.
              {manifestGeneratedAt ? (
                <>
                  {" "}
                  Last sync: <span className="text-[var(--text)]">{new Date(manifestGeneratedAt).toLocaleString()}</span>
                </>
              ) : null}
            </p>
          </HubToolDetailSection>

          <HubToolDetailSection id={`${idPrefix}triggers`} title={agentContextSectionTitle("triggers")}>
            <p className="text-sm text-[var(--text)]">{item.trigger ?? "—"}</p>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/10 bg-white/[.04] px-2 py-0.5 text-[10px] text-[var(--muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </HubToolDetailSection>
        </TocHighlightContent>
      </TocSectionHighlightProvider>
    </HubToolDetailModal>
  );
}
