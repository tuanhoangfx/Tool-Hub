import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  Fingerprint,
  Hash,
  Mail,
  Package,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { compactIconSize } from "../../lib/ui-scale";
import { HubCopyBadge } from "./HubCopyBadge";
import { HubRoleBadge } from "./HubRoleBadge";
import { HubUserAvatar } from "./HubUserAvatar";
import type { UserTableColumnKey } from "./user-table-prefs";
import type { UserManagementRow } from "./userManagementRepository";
import "./hub-users-table.css";

export type UserTableSortKey = UserTableColumnKey | "status";

type SortDir = "asc" | "desc";

type ColumnDef = {
  key: UserTableSortKey;
  label: string;
  colClass: string;
  icon: typeof UserRound;
  iconClass: string;
};

const COLUMNS: ColumnDef[] = [
  { key: "fullName", label: "Name", colClass: "hub-users-col--name", icon: UserRound, iconClass: "hub-users-th-icon--name" },
  { key: "id", label: "ID", colClass: "hub-users-col--id", icon: Fingerprint, iconClass: "hub-users-th-icon--id" },
  { key: "email", label: "Email", colClass: "hub-users-col--email", icon: Mail, iconClass: "hub-users-th-icon--email" },
  { key: "role", label: "Role", colClass: "hub-users-col--role", icon: ShieldCheck, iconClass: "hub-users-th-icon--role" },
  { key: "toolCount", label: "Tools", colClass: "hub-users-col--tools", icon: Package, iconClass: "hub-users-th-icon--tools" },
  { key: "createdAt", label: "Created", colClass: "hub-users-col--created", icon: CalendarClock, iconClass: "hub-users-th-icon--created" },
  { key: "lastActiveAt", label: "Latest activity", colClass: "hub-users-col--activity", icon: Activity, iconClass: "hub-users-th-icon--activity" },
  { key: "activityCount", label: "Actions", colClass: "hub-users-col--actions", icon: Hash, iconClass: "hub-users-th-icon--actions" },
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

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return <Icon size={13} className={`hub-users-sort${active ? " is-active" : ""}`} aria-hidden />;
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
          <span className="hub-users-cell-email" title={user.email || undefined}>
            <Mail size={12} className="hub-users-th-icon hub-users-th-icon--email shrink-0" aria-hidden />
            <span className="line-clamp-1">{user.email || "—"}</span>
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
}: {
  users: UserManagementRow[];
  sortKey: UserTableSortKey;
  sortDir: SortDir;
  onSort: (key: UserTableSortKey) => void;
  selectedIds: Set<string>;
  onToggleSelect: (userId: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  detailUserId: string | null;
  onOpenUser: (user: UserManagementRow) => void;
  visibleColumns: Set<UserTableColumnKey>;
}) {
  const visibleDefs = COLUMNS.filter((col) => visibleColumns.has(col.key as UserTableColumnKey));

  return (
    <div className="hub-users-table-wrap overflow-hidden rounded-2xl border border-white/5">
      <table className="hub-users-table">
        <thead>
          <tr>
            <th className="hub-users-col--select" scope="col">
              <label className="hub-users-select-all">
                <input
                  type="checkbox"
                  className="hub-checkbox"
                  checked={users.length > 0 && allVisibleSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all visible users"
                />
              </label>
            </th>
            {visibleDefs.map((col) => {
              const Icon = col.icon;
              return (
                <th key={col.key} className={col.colClass} scope="col">
                  <button
                    type="button"
                    className="hub-users-th-btn"
                    onClick={() => onSort(col.key)}
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
          {users.map((user) => {
            const selected = selectedIds.has(user.id);
            const isDetail = detailUserId === user.id;
            return (
              <tr
                key={user.id}
                className={`hub-users-row${selected ? " is-selected" : ""}${isDetail ? " is-detail" : ""}`}
                onClick={() => onOpenUser(user)}
              >
                <td className="hub-users-col--select" onClick={(e) => e.stopPropagation()}>
                  <label className="hub-users-select-row">
                    <input
                      type="checkbox"
                      className="hub-checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(user.id)}
                      aria-label={`Select ${user.fullName}`}
                    />
                  </label>
                </td>
                {visibleDefs.map((col) => renderBodyCell(col.key as UserTableColumnKey, user))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {users.length === 0 ? <div className="hub-users-empty">No users match the current filters.</div> : null}
    </div>
  );
}
