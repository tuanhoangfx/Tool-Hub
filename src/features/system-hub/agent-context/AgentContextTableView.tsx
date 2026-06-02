import { BookOpen, CalendarDays } from "lucide-react";
import { QuietChip } from "../../hub/hub-tool-ui";
import { compactIconSize } from "../../../lib/ui-scale";
import { formatDate } from "../../../lib/tooling";
import type { AgentContextItem } from "./types";
import { AgentKindBadge, AgentScopeBadge } from "./AgentContextBadges";

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
          {items.map((item) => (
            <tr key={item.id} onClick={() => onOpen(item)}>
              <td className="col-code align-top">
                <AgentKindBadge kind={item.kind} className="rounded-full px-2" />
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
                  <AgentScopeBadge scope={item.scope} />
                  <p className="text-[10px] tabular-nums text-[var(--muted)]">{item.lines} lines</p>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
