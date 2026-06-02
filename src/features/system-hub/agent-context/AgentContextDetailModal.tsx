import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { HubCardAvatar } from "../../../components/HubCardAvatar";
import { compactIconSize } from "../../../lib/ui-scale";
import type { AgentContextItem } from "./types";
import { agentKindIcon, agentStatusDotColor } from "./agent-kind-icon";

const DETAIL_TOC = [
  { id: "overview", label: "Overview", emoji: "◎" },
  { id: "content", label: "Content", emoji: "¶" },
  { id: "paths", label: "Paths & sync", emoji: "⎘" },
  { id: "triggers", label: "Triggers", emoji: "⚡" },
] as const;

type AgentContextDetailModalProps = {
  item: AgentContextItem | null;
  manifestGeneratedAt?: string;
  onClose: () => void;
};

export function AgentContextDetailModal({ item, manifestGeneratedAt, onClose }: AgentContextDetailModalProps) {
  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.classList.add("hub-modal-open");
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.classList.remove("hub-modal-open");
    };
  }, [item, onClose]);

  if (!item) return null;

  const idPrefix = `ac-${item.id}-`;

  return createPortal(
    <div className="modal-backdrop modal-backdrop--tool-detail" role="presentation" onClick={onClose}>
      <div
        className="modal-shell modal-shell--tool-detail"
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name} — agent context`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close modal-close--tool-detail" onClick={onClose} aria-label="Close">
          <X size={compactIconSize(16)} />
        </button>
        <div className="modal-shell__scroll">
          <header className="mb-4 border-b border-white/5 pb-4">
            <div className="flex flex-wrap items-start gap-3">
              <HubCardAvatar
                variant="agent"
                icon={agentKindIcon(item.kind)}
                size="md"
                statusColor={agentStatusDotColor(item)}
                statusTitle={
                  item.alwaysApply ? "Always apply" : item.agentRequestable ? "Agent requestable" : "Manual"
                }
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-300/90">
                  Agent context · {item.kind}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--text)]">{item.name}</h2>
                <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">{item.path}</p>
              </div>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-[var(--overview-toc-w)_minmax(0,1fr)]">
            <div className="overview-toc-nav h-[var(--overview-toc-h)] w-[var(--overview-toc-w)] shrink-0 overflow-hidden rounded-2xl border border-indigo-300/10 bg-[var(--panel)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)] ring-1 ring-white/[.025]">
              <nav className="space-y-0.5">
                {DETAIL_TOC.map(({ id, label, emoji }) => (
                  <a
                    key={id}
                    href={`#${idPrefix}${id}`}
                    className="group flex h-[var(--overview-toc-row-h)] w-full items-center gap-2 rounded-lg border border-transparent px-2 text-[13px] text-[var(--muted)] transition-colors hover:border-indigo-300/10 hover:bg-indigo-500/[.08] hover:text-[var(--text)]"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-white/10 text-[12px]">
                      {emoji}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
                  </a>
                ))}
              </nav>
            </div>

            <div className="min-w-0 space-y-4">
              <section id={`${idPrefix}overview`} className="scroll-mt-4 rounded-xl border border-white/5 bg-white/[.02] p-3">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Overview</h3>
                <p className="text-sm text-[var(--text)]">{item.summary}</p>
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-[var(--muted)]">Scope</dt>
                    <dd className="font-medium capitalize">{item.scope}</dd>
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
              </section>

              <section id={`${idPrefix}content`} className="scroll-mt-4 rounded-xl border border-white/5 bg-white/[.02] p-3">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Content</h3>
                <pre className="max-h-64 overflow-auto rounded-lg border border-white/5 bg-[#0d1117] p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                  {item.bodyPreview}
                </pre>
              </section>

              <section id={`${idPrefix}paths`} className="scroll-mt-4 rounded-xl border border-white/5 bg-white/[.02] p-3">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Paths & sync
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Manifest from <span className="font-mono text-indigo-200/90">pnpm agent:manifest</span> (runs on build).
                  {manifestGeneratedAt ? (
                    <>
                      {" "}
                      Last sync: <span className="text-[var(--text)]">{new Date(manifestGeneratedAt).toLocaleString()}</span>
                    </>
                  ) : null}
                </p>
              </section>

              <section id={`${idPrefix}triggers`} className="scroll-mt-4 rounded-xl border border-white/5 bg-white/[.02] p-3">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Triggers</h3>
                <p className="text-sm text-[var(--text)]">{item.trigger ?? "—"}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-white/10 bg-white/[.04] px-2 py-0.5 text-[10px] text-[var(--muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
