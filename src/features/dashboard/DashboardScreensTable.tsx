import {
  HubAppTabGroupBadge,
  HubDirectoryTableShell,
  HubUiTemplateBadge,
  navIconClass,
  navMetaTextClass,
  type HubSortDir,
  type HubTableColumnRole,
} from "@tool-workspace/hub-ui";
import { compactIconSize } from "../../lib/ui-scale";
import type { DashboardTabEntry } from "./dashboard-tab-registry";
import { DashboardStatusBadge } from "./DashboardStatusBadge";

export type DashboardTableSortKey = "label" | "group" | "template" | "status" | "path";

type ColumnDef = {
  key: DashboardTableSortKey;
  label: string;
  colClass: string;
  role: HubTableColumnRole;
};

const COLUMNS: ColumnDef[] = [
  { key: "label", label: "Screen", colClass: "hub-users-col--dash-screen", role: "name" },
  { key: "group", label: "Group", colClass: "hub-users-col--dash-group", role: "category" },
  { key: "template", label: "Template", colClass: "hub-users-col--dash-template", role: "type" },
  { key: "status", label: "Status", colClass: "hub-users-col--dash-status", role: "status" },
  { key: "path", label: "Path", colClass: "hub-users-col--dash-path", role: "path" },
];

export function sortableDashboardValue(entry: DashboardTabEntry, key: DashboardTableSortKey): string {
  switch (key) {
    case "label":
      return entry.label;
    case "group":
      return entry.groupLabel;
    case "template":
      return entry.template;
    case "status":
      return entry.status?.label ?? "";
    case "path":
      return entry.path;
    default:
      return "";
  }
}

export function sortDashboardEntries(
  entries: DashboardTabEntry[],
  sortKey: DashboardTableSortKey,
  sortDir: HubSortDir,
): DashboardTabEntry[] {
  return [...entries].sort((a, b) => {
    const av = sortableDashboardValue(a, sortKey).toLowerCase();
    const bv = sortableDashboardValue(b, sortKey).toLowerCase();
    const cmp = av.localeCompare(bv);
    return sortDir === "asc" ? cmp : -cmp;
  });
}

type DashboardScreensTableProps = {
  entries: DashboardTabEntry[];
  sortKey: DashboardTableSortKey;
  sortDir: HubSortDir;
  onSort: (key: DashboardTableSortKey) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  onPreview: (entry: DashboardTabEntry) => void;
};

export function DashboardScreensTable({
  entries,
  sortKey,
  sortDir,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allVisibleSelected,
  onPreview,
}: DashboardScreensTableProps) {
  const sorted = sortDashboardEntries(entries, sortKey, sortDir);

  return (
    <HubDirectoryTableShell
      items={sorted}
      ariaLabel="Dashboard screens table pages"
      tableClassName="hub-users-table hub-users-table--dashboard-screens"
      columns={COLUMNS}
      staticColumns={[{ label: "Summary", role: "name", colClass: "hub-users-col--dash-summary" }]}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      getRowKey={(entry) => entry.id}
      onRowClick={onPreview}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      onToggleSelectAll={onToggleSelectAll}
      allVisibleSelected={allVisibleSelected}
      selectAllLabel="Select all visible screens"
      emptyMessage="No screens match the current filters."
      renderRowCells={(entry) => {
        const Icon = entry.icon;
        return (
          <>
            <td className="hub-users-col--dash-screen">
              <div className="hub-users-cell-name">
                <Icon size={compactIconSize(15)} className={`shrink-0 ${navIconClass(entry.iconTone, true)}`} aria-hidden />
                <span className="hub-users-name-title">{entry.label}</span>
              </div>
            </td>
            <td className="hub-users-col--dash-group">
              <HubAppTabGroupBadge group={entry.group} />
            </td>
            <td className="hub-users-col--dash-template">
              <HubUiTemplateBadge template={entry.template} />
            </td>
            <td className="hub-users-col--dash-status">
              {entry.status ? <DashboardStatusBadge status={entry.status} /> : <span className="text-[var(--muted)]">—</span>}
            </td>
            <td className="hub-users-col--dash-path">
              <code className="font-mono text-[11px] text-[var(--muted)]">{entry.path}</code>
            </td>
          </>
        );
      }}
      renderStaticCells={(entry) => (
        <td className="hub-users-col--dash-summary">
          <span className="line-clamp-2 text-[var(--muted)]">{entry.description}</span>
          {entry.meta ? (
            <div className={`mt-1 text-[11px] font-medium ${navMetaTextClass(entry.iconTone)}`}>{entry.meta}</div>
          ) : null}
        </td>
      )}
    />
  );
}
