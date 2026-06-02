import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  FileCode,
  FolderOpen,
  Link2,
  Pencil,
  Shield,
  ScrollText,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { MetricBadge } from "../../../components/sales-shell/MetricBadge";
import { ToolAvatar } from "../../../components/ToolAvatar";
import { QuietChip } from "../../hub/hub-tool-ui";
import { compactIconSize } from "../../../lib/ui-scale";
import { formatDate } from "../../../lib/tooling";
import type { AgentContextItem, AgentContextKind } from "./types";

const KIND_META: Record<
  AgentContextKind,
  { code: string; Icon: LucideIcon; tint: string; avatarIcon: string }
> = {
  rule: { code: "RULE", Icon: Shield, tint: "#34d399", avatarIcon: "scroll" },
  skill: { code: "SKILL", Icon: Sparkles, tint: "#a855f7", avatarIcon: "sparkles" },
  file: { code: "FILE", Icon: FileCode, tint: "#38bdf8", avatarIcon: "file" },
  contract: { code: "CNTR", Icon: Link2, tint: "#fbbf24", avatarIcon: "link" },
};

const META: Record<string, { Icon: LucideIcon; tint: string }> = {
  summary: { Icon: BookOpen, tint: "#38bdf8" },
  path: { Icon: FolderOpen, tint: "#fbbf24" },
  scope: { Icon: Tag, tint: "#a78bfa" },
  updated: { Icon: CalendarDays, tint: "#f472b6" },
};

function kindBadgeClass(kind: AgentContextKind) {
  if (kind === "rule") return "border-emerald-400/35 bg-emerald-500/12 text-emerald-200";
  if (kind === "skill") return "border-purple-400/35 bg-purple-500/12 text-purple-200";
  if (kind === "contract") return "border-amber-400/35 bg-amber-500/12 text-amber-200";
  return "border-sky-400/35 bg-sky-500/12 text-sky-200";
}

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
  const meta = KIND_META[item.kind];

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group flex h-full min-h-[var(--hub-card-min-h)] w-full flex-col rounded-xl border border-white/5 bg-[var(--panel)] p-4 text-left transition-[border-color,box-shadow,background-color] duration-200 hover:border-indigo-500/40 hover:bg-white/[0.02] hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]"
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative shrink-0">
            <ToolAvatar code={meta.code.slice(0, 2)} iconName={meta.avatarIcon} size="sm" />
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-[var(--panel)]"
              style={{ background: meta.tint }}
              title={item.kind}
            />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
              <MetricBadge label={meta.code} mono variantClass={kindBadgeClass(item.kind)} />
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02]"
                title={item.kind}
                aria-hidden
              >
                <meta.Icon size={compactIconSize(14)} style={{ color: meta.tint }} />
              </span>
              <span className="min-w-0 line-clamp-2 text-sm font-medium leading-snug text-[var(--text)]">{item.name}</span>
            </div>
          </div>
        </div>
        <Pencil size={compactIconSize(14)} className="shrink-0 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="min-h-[var(--hub-card-meta-min-h)] shrink-0 space-y-1.5 text-xs text-[var(--muted)]">
        <MetaRow kind="summary">
          <span className="line-clamp-2">{item.summary || "—"}</span>
        </MetaRow>
        <MetaRow kind="path">
          <span className="truncate font-mono text-[11px] text-indigo-200/80">{fileName(item.path)}</span>
        </MetaRow>
        <MetaRow kind="scope">
          <span className="capitalize">{item.scope}</span>
          {item.lines > 0 ? <span className="ml-1 text-[10px]">· {item.lines} lines</span> : null}
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
