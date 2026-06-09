import { ArrowUpRight, Star } from "lucide-react";
import { HubAppTabGroupBadge, HubUiTemplateBadge, navIconClass, navMetaTextClass } from "@tool-workspace/hub-ui";
import { compactIconSize } from "../../lib/ui-scale";
import type { DashboardTabEntry } from "./dashboard-tab-registry";
import { DashboardStatusBadge } from "./DashboardStatusBadge";

const STATUS_DOT: Record<string, string> = {
  ok: "#22c55e",
  warn: "#f59e0b",
  bad: "#f43f5e",
  neutral: "#94a3b8",
};

type DashboardTabCardProps = {
  entry: DashboardTabEntry;
  pinned: boolean;
  onOpen: (entry: DashboardTabEntry) => void;
  onPreview: (entry: DashboardTabEntry) => void;
  onTogglePin: (id: string) => void;
};

export function DashboardTabCard({ entry, pinned, onOpen, onPreview, onTogglePin }: DashboardTabCardProps) {
  const Icon = entry.icon;
  const dot = entry.status ? STATUS_DOT[entry.status.tone] ?? STATUS_DOT.neutral : undefined;

  return (
    <article className="group flex h-full min-h-[var(--hub-card-min-h)] w-full flex-col rounded-xl border border-white/5 bg-[var(--panel)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-indigo-500/40 hover:bg-white/[0.02] hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]">
      <button type="button" onClick={() => onPreview(entry)} className="flex flex-1 flex-col p-4 text-left">
        <div className="mb-3 flex shrink-0 items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative shrink-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                <Icon size={compactIconSize(16)} className={navIconClass(entry.iconTone, true)} aria-hidden />
              </span>
              {dot ? (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-[var(--panel)]"
                  style={{ background: dot }}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text)]">{entry.label}</p>
            </div>
          </div>
          <span className="shrink-0">
            <HubUiTemplateBadge template={entry.template} />
          </span>
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 text-xs text-[var(--muted)]">
          <p className="line-clamp-3 text-sm leading-snug">{entry.description}</p>
          {entry.meta ? <p className={`text-[11px] font-medium ${navMetaTextClass(entry.iconTone)}`}>{entry.meta}</p> : null}
        </div>

        <div className="mt-auto shrink-0 pt-3">
          <div className="flex min-h-[var(--hub-card-chip-row-min-h,22px)] flex-wrap items-center gap-1.5">
            <HubAppTabGroupBadge group={entry.group} />
            {entry.status ? <DashboardStatusBadge status={entry.status} /> : null}
          </div>
        </div>
      </button>

      <footer className="flex shrink-0 items-center justify-between gap-2 px-3 pb-2.5 pt-1">
        <code className="min-w-0 truncate font-mono text-[10px] text-[var(--muted)]">{entry.path}</code>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            title={pinned ? "Unpin" : "Pin"}
            onClick={() => onTogglePin(entry.id)}
            className={`grid h-7 w-7 place-items-center rounded-lg border transition-colors ${
              pinned
                ? "border-amber-400/40 bg-amber-500/20 text-amber-200"
                : "border-white/10 bg-white/[0.03] text-[var(--muted)] hover:text-amber-200"
            }`}
          >
            <Star size={compactIconSize(13)} className={pinned ? "fill-current" : ""} aria-hidden />
          </button>
          <button
            type="button"
            title="Preview"
            onClick={() => onPreview(entry)}
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-indigo-300 hover:bg-indigo-500/15"
          >
            <ArrowUpRight size={compactIconSize(13)} aria-hidden />
          </button>
          <button
            type="button"
            title="Open screen"
            onClick={() => onOpen(entry)}
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-2 text-[10px] font-semibold text-indigo-100 hover:bg-indigo-500/20"
          >
            Open
          </button>
        </div>
      </footer>
    </article>
  );
}
