import { useMemo, useState } from "react";
import { BookOpen, CalendarDays } from "lucide-react";
import {
  HubDirectoryTableShell,
  hubDirectoryListResetKey,
  type HubSortDir,
  type HubTableColumnRole,
  compactIconSize,
} from "@tool-workspace/hub-ui";

import { formatDate } from "../../../lib/tooling";
import { HubCardAvatar } from "../../../components/HubCardAvatar";
import { QuietChip } from "../../hub/hub-tool-ui";
import type { AgentContextItem } from "./types";
import { agentKeywordGroupLabel } from "./agent-context-search";
import { AgentKindBadge, AgentScopeBadge } from "./AgentContextBadges";
import { agentKindIcon, agentStatusDotColor } from "./agent-kind-icon";

type AgentSortKey =
  | "kind"
  | "layer"
  | "name"
  | "kwGroup"
  | "golden"
  | "clone"
  | "path"
  | "scope"
  | "lines"
  | "mode"
  | "updated";

type ColumnDef = {
  key: AgentSortKey;
  label: string;
  colClass: string;
  role: HubTableColumnRole;
};

const COLUMNS: ColumnDef[] = [
  { key: "kind", label: "Kind", colClass: "hub-users-col--hub-code", role: "kind" },
  { key: "layer", label: "Layer", colClass: "hub-users-col--agent-layer", role: "layer" },
  { key: "name", label: "Name", colClass: "hub-users-col--hub-project", role: "name" },
  { key: "kwGroup", label: "Kw group", colClass: "hub-users-col--hub-version", role: "scope" },
  { key: "golden", label: "Golden", colClass: "hub-users-col--agent-golden", role: "golden" },
  { key: "clone", label: "Clone", colClass: "hub-users-col--agent-clone", role: "clone" },
  { key: "path", label: "Path", colClass: "hub-users-col--agent-path", role: "path" },
  { key: "scope", label: "Scope", colClass: "hub-users-col--hub-version", role: "scope" },
  { key: "lines", label: "Lines", colClass: "hub-users-col--agent-lines", role: "lines" },
  { key: "mode", label: "Mode", colClass: "hub-users-col--hub-status", role: "mode" },
  { key: "updated", label: "Updated", colClass: "hub-users-col--hub-updated", role: "updated" },
];

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

function layerLabel(layer?: AgentContextItem["layer"]): string {
  if (!layer) return "—";
  return layer === "screen" ? "Screen" : "Modal";
}

function layerTone(layer?: AgentContextItem["layer"]): "ok" | "warn" | "neutral" {
  if (layer === "screen") return "ok";
  if (layer === "modal") return "warn";
  return "neutral";
}

function sortableValue(item: AgentContextItem, key: AgentSortKey): string | number {
  switch (key) {
    case "kind":
      return item.kind;
    case "layer":
      return item.layer ?? "";
    case "name":
      return item.name;
    case "kwGroup":
      return item.keywordGroup ?? "";
    case "golden":
      return item.golden ?? "";
    case "clone":
      return item.clone ?? "";
    case "path":
      return item.path;
    case "scope":
      return item.scope;
    case "lines":
      return item.lines;
    case "mode":
      return applyModeLabel(item);
    case "updated":
      return item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    default:
      return "";
  }
}

function sortItems(items: AgentContextItem[], sortKey: AgentSortKey, sortDir: HubSortDir) {
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
  highlightId?: string | null;
  resetKey?: string | number | boolean | null;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (item: AgentContextItem) => void;
};

export function AgentContextTableView({
  items,
  highlightId,
  resetKey,
  selectedIds,
  onToggleSelect,
  onOpen,
}: AgentContextTableViewProps) {
  const [sortKey, setSortKey] = useState<AgentSortKey>("kind");
  const [sortDir, setSortDir] = useState<HubSortDir>("asc");

  const sorted = useMemo(() => sortItems(items, sortKey, sortDir), [items, sortKey, sortDir]);
  const pagerResetKey = useMemo(
    () => hubDirectoryListResetKey(resetKey, sortKey, sortDir, items.length),
    [items.length, resetKey, sortDir, sortKey],
  );

  const handleSort = (key: AgentSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <HubDirectoryTableShell
      items={sorted}
      resetKey={pagerResetKey}
      ariaLabel="Agent context table pages"
      tableClassName="hub-users-table hub-users-table--directory"
      columns={COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={handleSort}
      getRowKey={(item) => item.id}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      selectAllLabel="Select all items on this page"
      onRowClick={onOpen}
      emptyMessage="No agent context items match search or filters."
      getRowClassName={(item) =>
        `${highlightId === item.id ? " is-highlighted" : ""}${selectedIds.has(item.id) ? " is-selected" : ""}`
      }
      renderRowCells={(item) => (
        <>
          <td className="hub-users-col--hub-code">
            <AgentKindBadge kind={item.kind} className="rounded-full px-2" />
          </td>
          <td className="hub-users-col--agent-layer">
            {item.kind === "pattern" && item.layer ? (
              <QuietChip label={layerLabel(item.layer)} tone={layerTone(item.layer)} />
            ) : (
              <span className="hub-users-cell-muted text-[11px]">—</span>
            )}
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
                {item.summary ? (
                  <p className="hub-users-cell-sub mt-0.5 line-clamp-2">{item.summary}</p>
                ) : null}
              </div>
            </div>
          </td>
          <td className="hub-users-col--hub-version">
            {item.keywordGroup ? (
              <QuietChip label={agentKeywordGroupLabel(item.keywordGroup)} tone="neutral" />
            ) : (
              <span className="hub-users-cell-muted text-[11px]">—</span>
            )}
          </td>
          <td className="hub-users-col--agent-golden">
            {item.golden && item.golden !== "—" ? (
              <span
                className="inline-block max-w-full truncate rounded-md border border-emerald-400/35 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-100"
                title={item.golden}
              >
                {item.golden}
              </span>
            ) : (
              <span className="hub-users-cell-muted text-[11px]">—</span>
            )}
          </td>
          <td className="hub-users-col--agent-clone">
            {item.clone && item.clone !== "—" ? (
              <p
                className="line-clamp-2 font-mono text-[10px] leading-snug text-sky-200/85"
                title={item.cloneTooltip ?? item.clone}
              >
                {item.clone}
              </p>
            ) : (
              <span className="hub-users-cell-muted text-[11px]">—</span>
            )}
          </td>
          <td className="hub-users-col--agent-path">
            <p className="font-mono text-[10px] leading-snug text-indigo-200/85 break-all" title={item.path}>
              {item.path}
            </p>
          </td>
          <td className="hub-users-col--hub-version">
            <AgentScopeBadge scope={item.scope} />
          </td>
          <td className="hub-users-col--agent-lines hub-users-cell-muted">
            <span className="tabular-nums font-medium text-[var(--text)]">{item.lines > 0 ? item.lines : "—"}</span>
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
        </>
      )}
    />
  );
}
