import { BookOpen, Bot, CalendarDays, FileCode, Link2, ScrollText, Shield, Sparkles } from "lucide-react";
import { MetricBadge } from "../../../components/sales-shell/MetricBadge";
import { QuietChip } from "../../hub/hub-tool-ui";
import { compactIconSize } from "../../../lib/ui-scale";
import { formatDate } from "../../../lib/tooling";
import type { AgentContextItem, AgentContextKind } from "./types";

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

function kindCode(kind: AgentContextKind) {
  if (kind === "rule") return "RULE";
  if (kind === "skill") return "SKILL";
  if (kind === "contract") return "CNTR";
  return "FILE";
}

function kindIcon(kind: AgentContextKind) {
  if (kind === "rule") return Shield;
  if (kind === "skill") return Sparkles;
  if (kind === "contract") return Link2;
  return FileCode;
}

type AgentContextTableViewProps = {
  items: AgentContextItem[];
  onOpen: (item: AgentContextItem) => void;
};

export function AgentContextTableView({ items, onOpen }: AgentContextTableViewProps) {
  return (
    <div className="table-view">
      <table className="lib-table">
        <thead>
          <tr>
            <th className="col-code">Kind</th>
            <th className="col-name">Name</th>
            <th className="col-version">Scope</th>
            <th className="col-status">Mode</th>
            <th className="col-updated">Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const Icon = kindIcon(item.kind);
            return (
              <tr key={item.id} onClick={() => onOpen(item)}>
                <td className="col-code align-top">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-[var(--muted)]">
                      <Icon size={compactIconSize(14)} />
                    </span>
                    <MetricBadge label={kindCode(item.kind)} mono variantClass={kindBadgeClass(item.kind)} />
                  </div>
                </td>
                <td className="col-name align-top">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[12px] font-medium text-[var(--text)]">{item.name}</p>
                    <p className="mt-0.5 line-clamp-1 font-mono text-[10px] text-indigo-200/70">{item.path}</p>
                    <p className="mt-1 line-clamp-1 text-[10px] text-[var(--muted)]">{item.summary}</p>
                  </div>
                </td>
                <td className="col-version align-top">
                  <div className="space-y-1">
                    <QuietChip label={item.scope} tone="neutral" />
                    <div className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                      <Bot size={compactIconSize(10)} className="opacity-70" />
                      <span>{item.lines} lines</span>
                    </div>
                  </div>
                </td>
                <td className="col-status align-top">
                  <div className="space-y-1">
                    <QuietChip label={applyModeLabel(item)} tone={applyModeTone(item)} />
                    {item.alwaysApply ? (
                      <div className="flex items-center gap-1 text-[10px] text-amber-200/80">
                        <BookOpen size={compactIconSize(10)} />
                        <span>Always on</span>
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="col-updated align-top">
                  <div className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                    <CalendarDays size={compactIconSize(12)} className="opacity-70" />
                    <span>{item.updatedAt ? formatDate(item.updatedAt) : "—"}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

