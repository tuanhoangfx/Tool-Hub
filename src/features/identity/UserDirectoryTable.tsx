import { Mail, Package } from "lucide-react";
import {
  HubDirectoryTableShell,
  type HubSortDir,
  type HubTableColumnRole,
  compactIconSize,
  HubCopyBadge,
} from "@tool-workspace/hub-ui";

import { HubRoleBadge } from "./HubRoleBadge";
import { HubUserAvatar } from "./HubUserAvatar";
import type { UserTableColumnKey } from "./user-table-prefs";
import type { UserManagementRow } from "./userManagementRepository";

export type UserTableSortKey = UserTableColumnKey | "status";

type ColumnDef = {
  key: UserTableSortKey;
  label: string;
  colClass: string;
  role: HubTableColumnRole;
};

const COLUMNS: ColumnDef[] = [
  { key: "fullName", label: "Name", colClass: "hub-users-col--name", role: "name" },
  { key: "id", label: "ID", colClass: "hub-users-col--id", role: "id" },
  { key: "email", label: "Email", colClass: "hub-users-col--email", role: "email" },
  { key: "role", label: "Role", colClass: "hub-users-col--role", role: "role" },
  { key: "toolCount", label: "Tools", colClass: "hub-users-col--tools", role: "tools" },
  { key: "createdAt", label: "Created", colClass: "hub-users-col--created", role: "created" },
  { key: "lastActiveAt", label: "Latest activity", colClass: "hub-users-col--activity", role: "activity" },
  { key: "activityCount", label: "Actions", colClass: "hub-users-col--actions", role: "actions" },
];

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function RoleCell({ user }: { user: UserManagementRow }) {
  return (
    <div className="hub-users-role-cell">
      <HubRoleBadge role={user.role} />
    </div>
  );
}

function StatusCell({ status }: { status: UserManagementRow["status"] }) {
  return (
    <span className="hub-users-status">
      <span className={`hub-users-status-dot hub-users-status-dot--${status}`} aria-hidden />
      {status}
    </span>
  );
}

function UserNameCell({ user }: { user: UserManagementRow }) {
  return (
    <div className="hub-users-cell-name">
      <HubUserAvatar user={user} size="sm" />
      <span className="hub-users-name-title" title={user.fullName}>
        {user.fullName}
      </span>
    </div>
  );
}

function IdCell({ user }: { user: UserManagementRow }) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <HubCopyBadge value={user.id} />
    </div>
  );
}

function ToolsCell({ user }: { user: UserManagementRow }) {
  const count = user.toolCount;
  const title =
    count === 0
      ? "No tools granted"
      : `${count} tool${count === 1 ? "" : "s"}${user.role === "admin" ? " (full catalog)" : ""}`;
  return (
    <span
      className={`hub-users-tool-badge${count === 0 ? " hub-users-tool-badge--empty" : ""}${
        user.role === "admin" ? " hub-users-tool-badge--admin" : ""
      }`}
      title={title}
    >
      <Package size={compactIconSize(11)} className="hub-users-tool-badge__icon" aria-hidden />
      <span className="hub-users-tool-badge__count tabular-nums">{count}</span>
    </span>
  );
}

function renderBodyCell(key: UserTableSortKey, user: UserManagementRow) {
  switch (key) {
    case "fullName":
      return (
        <td key={key} className="hub-users-col--name">
          <UserNameCell user={user} />
        </td>
      );
    case "id":
      return (
        <td key={key} className="hub-users-col--id">
          <IdCell user={user} />
        </td>
      );
    case "email":
      return (
        <td key={key} className="hub-users-col--email">
          <span
            className="hub-users-cell-email"
            title={[user.loginId ? `@${user.loginId}` : "", user.email].filter(Boolean).join(" · ") || undefined}
          >
            <Mail size={12} className="hub-users-th-icon hub-users-th-icon--email shrink-0" aria-hidden />
            <span className="line-clamp-1">
              {user.loginId ? <span className="text-indigo-200/90">@{user.loginId}</span> : null}
              {user.loginId && user.email ? " · " : null}
              {user.email || (!user.loginId ? "—" : "")}
            </span>
          </span>
        </td>
      );
    case "role":
      return (
        <td key={key} className="hub-users-col--role">
          <RoleCell user={user} />
        </td>
      );
    case "toolCount":
      return (
        <td key={key} className="hub-users-col--tools">
          <ToolsCell user={user} />
        </td>
      );
    case "createdAt":
      return (
        <td key={key} className="hub-users-cell-muted hub-users-col--created">
          <span className="line-clamp-2">{fmtDate(user.createdAt)}</span>
        </td>
      );
    case "lastActiveAt":
      return (
        <td key={key} className="hub-users-col--activity">
          <div className="hub-users-cell-stack hub-users-cell-stack--center">
            <StatusCell status={user.status} />
            <span className="hub-users-cell-muted line-clamp-1">{fmtDate(user.lastActiveAt)}</span>
          </div>
        </td>
      );
    case "activityCount":
      return (
        <td key={key} className="hub-users-cell-num hub-users-col--actions">
          {user.activityCount}
        </td>
      );
    default:
      return null;
  }
}

export function UserDirectoryTable({
  users,
  sortKey,
  sortDir,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allVisibleSelected,
  detailUserId,
  onOpenUser,
  visibleColumns,
  resetKey,
}: {
  users: UserManagementRow[];
  sortKey: UserTableSortKey;
  sortDir: HubSortDir;
  onSort: (key: UserTableSortKey) => void;
  selectedIds: Set<string>;
  onToggleSelect: (userId: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  detailUserId: string | null;
  onOpenUser: (user: UserManagementRow) => void;
  visibleColumns: Set<UserTableColumnKey>;
  resetKey?: string | number | boolean | null;
}) {
  const visibleDefs = COLUMNS.filter((col) => visibleColumns.has(col.key as UserTableColumnKey));

  return (
    <HubDirectoryTableShell
      items={users}
      ariaLabel="Users table pages"
      wrapClassName="overflow-hidden"
      columns={visibleDefs}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      getRowKey={(user) => user.id}
      onRowClick={onOpenUser}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      onToggleSelectAll={onToggleSelectAll}
      allVisibleSelected={allVisibleSelected}
      selectAllLabel="Select all visible users"
      emptyMessage="No users match the current filters."
      resetKey={resetKey}
      getRowClassName={(user) => (detailUserId === user.id ? " is-detail" : "")}
      renderRowCells={(user) => (
        <>{visibleDefs.map((col) => renderBodyCell(col.key as UserTableColumnKey, user))}</>
      )}
    />
  );
}
