import type { ReactNode } from "react";
import { BookOpen, CalendarDays, Layers, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  HubDirectoryCardCheckbox,
  HubDirectoryInteractiveCard,
  compactIconSize,
} from "@tool-workspace/hub-ui";
import { HubCardAvatar } from "../../../components/HubCardAvatar";
import { QuietChip } from "../../hub/hub-tool-ui";

import { formatDate } from "../../../lib/tooling";
import type { AgentContextItem } from "./types";
import { AgentKindBadge, AgentScopeBadge } from "./AgentContextBadges";
import { agentKindIcon, agentStatusDotColor } from "./agent-kind-icon";

const META = {
  summary: { Icon: BookOpen, tint: "#38bdf8" },
  scope: { Icon: Layers, tint: "#22d3ee" },
  lines: { Icon: Tag, tint: "#a78bfa" },
  updated: { Icon: CalendarDays, tint: "#f472b6" },
} as const satisfies Record<string, { Icon: LucideIcon; tint: string }>;

type MetaRowKind = keyof typeof META;

const META_FALLBACK = { Icon: BookOpen, tint: "#94a3b8" };

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
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (item: AgentContextItem) => void;
};

export function AgentContextCard({ item, selected, onToggleSelect, onOpen }: AgentContextCardProps) {
  return (
    <HubDirectoryInteractiveCard
      variant="grid"
      selected={selected}
      ariaLabel={`Open ${item.name}`}
      onActivate={() => onOpen(item)}
    >
      <HubDirectoryCardCheckbox
        checked={selected}
        label={`Select ${item.name}`}
        onChange={() => onToggleSelect(item.id)}
      />
      <div className="flex flex-1 flex-col p-4 pr-10">
        <div className="mb-3 flex shrink-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <HubCardAvatar
              variant="agent"
              icon={agentKindIcon(item.kind)}
              size="sm"
              statusColor={agentStatusDotColor(item)}
              statusTitle={applyModeLabel(item)}
            />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <AgentKindBadge kind={item.kind} className="shrink-0 rounded-full px-2" />
                <p className="min-w-0 line-clamp-2 text-sm font-medium leading-snug text-[var(--text)]">{item.name}</p>
              </div>
              <p className="mt-1 truncate font-mono text-[10px] text-indigo-200/75">{fileName(item.path)}</p>
            </div>
          </div>
        </div>

        <div className="min-h-[var(--hub-card-meta-min-h)] shrink-0 space-y-1.5 text-xs text-[var(--muted)]">
          <MetaRow kind="summary">
            <span className="line-clamp-2">{item.summary || "—"}</span>
          </MetaRow>
          {item.golden || (item.clone && item.clone !== "—") ? (
            <MetaRow kind="scope">
              <span className="line-clamp-2 font-mono text-[10px] text-indigo-200/90">
                {item.golden && item.golden !== "—" ? `Golden: ${item.golden}` : null}
                {item.golden && item.clone && item.clone !== "—" ? " · " : null}
                {item.clone && item.clone !== "—" ? `Clone: ${item.clone}` : null}
              </span>
            </MetaRow>
          ) : null}
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
      </div>
    </HubDirectoryInteractiveCard>
  );
}

function MetaRow({ kind, children }: { kind: MetaRowKind; children: ReactNode }) {
  const { Icon, tint } = META[kind] ?? META_FALLBACK;
  return (
    <div className="flex items-center gap-2">
      <Icon size={compactIconSize(12)} className="shrink-0" strokeWidth={2} style={{ color: tint, opacity: 0.72 }} />
      <div className="min-w-0 flex-1 truncate">{children}</div>
    </div>
  );
}
