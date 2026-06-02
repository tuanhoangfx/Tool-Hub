import type { ReactNode } from "react";
import { BookOpen, CalendarDays, FolderOpen, Pencil, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { QuietChip } from "../../hub/hub-tool-ui";
import { compactIconSize } from "../../../lib/ui-scale";
import { formatDate } from "../../../lib/tooling";
import type { AgentContextItem } from "./types";
import { AgentKindBadge, AgentScopeBadge } from "./AgentContextBadges";

const META: Record<string, { Icon: LucideIcon; tint: string }> = {
  summary: { Icon: BookOpen, tint: "#38bdf8" },
  path: { Icon: FolderOpen, tint: "#fbbf24" },
  lines: { Icon: Tag, tint: "#a78bfa" },
  updated: { Icon: CalendarDays, tint: "#f472b6" },
};

function applyModeLabel(item: AgentContextItem) {
  if (item.alwaysApply) return "Always apply";
  if (item.agentRequestable) return "Agent requestable";
  return "Manual";
}

function applyModeTone(item: AgentContextItem): "ok" | "warn" | "neutral" {
  if (item.alwaysApply) return "ok";
  if (item.agentRequestable) return "warn";
  return "neutral";
}

function fileName(path: string) {
  return path.split("\\").pop()?.split("/").pop() ?? path;
}

type AgentContextCardProps = {
  item: AgentContextItem;
  onOpen: (item: AgentContextItem) => void;
};

export function AgentContextCard({ item, onOpen }: AgentContextCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group flex h-full min-h-[var(--hub-card-min-h)] w-full flex-col rounded-xl border border-white/5 bg-[var(--panel)] p-4 text-left transition-[border-color,box-shadow,background-color] duration-200 hover:border-indigo-500/40 hover:bg-white/[0.02] hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]"
    >
      <div className="mb-3 flex shrink-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <AgentKindBadge kind={item.kind} className="mt-0.5 shrink-0 rounded-full px-2" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-[var(--text)]">{item.name}</p>
            <p className="mt-1 truncate font-mono text-[10px] text-indigo-200/75">{fileName(item.path)}</p>
          </div>
        </div>
        <Pencil size={compactIconSize(14)} className="mt-0.5 shrink-0 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="min-h-[var(--hub-card-meta-min-h)] shrink-0 space-y-1.5 text-xs text-[var(--muted)]">
        <MetaRow kind="summary">
          <span className="line-clamp-2">{item.summary || "—"}</span>
        </MetaRow>
        <MetaRow kind="scope">
          <AgentScopeBadge scope={item.scope} />
        </MetaRow>
        <MetaRow kind="lines">
          <span>{item.lines > 0 ? `${item.lines} lines` : "—"}</span>
        </MetaRow>
        <MetaRow kind="updated">
          {item.updatedAt ? <span>{formatDate(item.updatedAt)}</span> : <span>—</span>}
        </MetaRow>
      </div>

      <div className="mt-auto shrink-0 pt-3">
        <div className="flex min-h-[var(--hub-card-chip-row-min-h)] flex-wrap items-center gap-1.5">
          <QuietChip label={applyModeLabel(item)} tone={applyModeTone(item)} />
          {item.tags.slice(0, 2).map((tag) => (
            <QuietChip key={tag} label={tag} tone="neutral" />
          ))}
        </div>
      </div>
    </button>
  );
}

function MetaRow({ kind, children }: { kind: keyof typeof META; children: ReactNode }) {
  const { Icon, tint } = META[kind];
  return (
    <div className="flex items-center gap-2">
      <Icon size={compactIconSize(12)} className="shrink-0" strokeWidth={2} style={{ color: tint, opacity: 0.72 }} />
      <div className="min-w-0 flex-1 truncate">{children}</div>
    </div>
  );
}
