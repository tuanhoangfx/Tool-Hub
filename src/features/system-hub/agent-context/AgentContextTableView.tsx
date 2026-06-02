import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  CalendarDays,
  FileText,
  Layers,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { compactIconSize } from "../../../lib/ui-scale";
import { formatDate } from "../../../lib/tooling";
import { HubCardAvatar } from "../../../components/HubCardAvatar";
import { QuietChip } from "../../hub/hub-tool-ui";
import type { AgentContextItem } from "./types";
import { AgentKindBadge, AgentScopeBadge } from "./AgentContextBadges";
import { agentKindIcon, agentStatusDotColor } from "./agent-kind-icon";
import "../../identity/hub-users-table.css";

type AgentSortKey = "kind" | "name" | "scope" | "mode" | "updated";

type SortDir = "asc" | "desc";

type ColumnDef = {
  key: AgentSortKey;
  label: string;
  colClass: string;
  icon: typeof ScrollText;
  iconClass: string;
};

const COLUMNS: ColumnDef[] = [
  { key: "kind", label: "Kind", colClass: "hub-users-col--hub-code", icon: ScrollText, iconClass: "hub-users-th-icon--role" },
  { key: "name", label: "Name", colClass: "hub-users-col--hub-project", icon: FileText, iconClass: "hub-users-th-icon--name" },
  { key: "scope", label: "Scope", colClass: "hub-users-col--hub-version", icon: Layers, iconClass: "hub-users-th-icon--tools" },
  { key: "mode", label: "Mode", colClass: "hub-users-col--hub-status", icon: Sparkles, iconClass: "hub-users-th-icon--activity" },
  {
    key: "updated",
    label: "Updated",
    colClass: "hub-users-col--hub-updated",
    icon: CalendarDays,
    iconClass: "hub-users-th-icon--created",
  },
];

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return <Icon size={13} className={`hub-users-sort${active ? " is-active" : ""}`} aria-hidden />;
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

function sortableValue(item: AgentContextItem, key: AgentSortKey): string | number {
  switch (key) {
    case "kind":
      return item.kind;
    case "name":
      return item.name;
    case "scope":
      return item.scope;
    case "mode":
      return applyModeLabel(item);
    case "updated":
      return item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    default:
      return "";
  }
}

function sortItems(items: AgentContextItem[], sortKey: AgentSortKey, sortDir: SortDir) {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = sortableValue(a, sortKey);
    const bv = sortableValue(b, sortKey);
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
  });
}

type AgentContextTableViewProps = {
  items: AgentContextItem[];
  onOpen: (item: AgentContextItem) => void;
};

export function AgentContextTableView({ items, onOpen }: AgentContextTableViewProps) {
  const [sortKey, setSortKey] = useState<AgentSortKey>("kind");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => sortItems(items, sortKey, sortDir), [items, sortKey, sortDir]);

  const handleSort = (key: AgentSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="hub-users-table-wrap overflow-hidden rounded-2xl border border-white/5">
      <table className="hub-users-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const Icon = col.icon;
              return (
                <th key={col.key} className={col.colClass} scope="col">
                  <button
                    type="button"
                    className="hub-users-th-btn"
                    onClick={() => handleSort(col.key)}
                    aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    <span className="hub-users-th-label">
                      <Icon size={13} className={`hub-users-th-icon ${col.iconClass}`} aria-hidden />
                      <span className="hub-users-th-text">{col.label}</span>
                      <SortIndicator active={sortKey === col.key} dir={sortDir} />
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.id} className="hub-users-row" onClick={() => onOpen(item)}>
              <td className="hub-users-col--hub-code">
                <AgentKindBadge kind={item.kind} className="rounded-full px-2" />
              </td>
              <td className="hub-users-col--hub-project">
                <div className="flex min-w-0 items-start gap-2 text-left">
                  <HubCardAvatar
                    variant="agent"
                    icon={agentKindIcon(item.kind)}
                    size="xs"
                    statusColor={agentStatusDotColor(item)}
                    statusTitle={applyModeLabel(item)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                  <p className="hub-users-name-title">{item.name}</p>
                  <p className="hub-users-cell-sub mt-0.5 font-mono">{item.path}</p>
                  <p className="hub-users-cell-sub mt-0.5 line-clamp-1">{item.summary}</p>
                  </div>
                </div>
              </td>
              <td className="hub-users-col--hub-version">
                <div className="hub-users-role-cell">
                  <AgentScopeBadge scope={item.scope} />
                  <p className="hub-users-cell-sub mt-1 tabular-nums">{item.lines} lines</p>
                </div>
              </td>
              <td className="hub-users-col--hub-status">
                <div className="hub-users-role-cell flex-col gap-1">
                  <QuietChip label={applyModeLabel(item)} tone={applyModeTone(item)} />
                  {item.alwaysApply ? (
                    <div className="flex items-center justify-center gap-1 text-[10px] text-amber-200/80">
                      <BookOpen size={compactIconSize(10)} />
                      <span>Always on</span>
                    </div>
                  ) : null}
                </div>
              </td>
              <td className="hub-users-col--hub-updated hub-users-cell-muted">
                <div className="hub-users-cell-stack hub-users-cell-stack--center">
                  <CalendarDays size={compactIconSize(12)} className="mx-auto opacity-70" aria-hidden />
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
