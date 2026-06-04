import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  CheckCircle2,
  Crown,
  Package,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import {
  HubResultCount,
  MiniBarChart,
  MiniDonut,
  ViewToggle,
  UsersLoadingView,
  type BarItem,
  type DonutItem,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
  type KpiTileData,
  type TabHeaderStatItem,
} from "../../components/sales-shell";
import { AppTabHeader, HubDirectoryScreen, useHubPageShortcuts } from "@tool-workspace/hub-ui";
import { UserListChromeHeader } from "./UserListChromeHeader";
import { APP_VERSION } from "../../lib/app-meta";
import { HubAuthGate } from "./HubAuthGate";
import { HubRoleBadge } from "./HubRoleBadge";
import { HubUserAvatar } from "./HubUserAvatar";
import { hubRoleLabel, resolveSessionActorRole } from "./hubUserDisplay";
import { UserDirectoryTable, type UserTableSortKey } from "./UserDirectoryTable";
import { readUserTableColumns, type UserTableColumnKey } from "./user-table-prefs";
import { UserBulkActionBar } from "./UserBulkActionBar";
import { UserAccessModal } from "./UserAccessModal";
import { UserAddModal } from "./UserAddModal";
import { HubConfirmDialog } from "../../components/HubConfirmDialog";
import { useHubAuth } from "./useHubAuth";
import {
  createHubUsers,
  fetchCurrentProfileRole,
  fetchUserManagementRows,
  type HubUserCreatePayload,
  type UserManagementRow,
} from "./userManagementRepository";
import {
  readUserManagementClientCache,
  readUserManagementStaleCache,
  writeUserManagementClientCache,
} from "./user-management-client-cache";
import type { UserAccessSavePayload } from "./UserAccessModal";
import {
  countRegistryOnlyTools,
  fetchHubTools,
  loadWorkspaceToolCatalog,
  mergeHubToolCatalog,
  revokeAllToolAccessForUsers,
  syncHubToolsCatalog,
  type HubToolRow,
} from "./toolAccessRepository";
import { matchesUserFilters, TOOL_NONE, userFiltersWithCounts } from "./user-filter-counts";

const BASE_USER_FILTERS: FilterDef[] = [
  {
    key: "role",
    label: "Role",
    showAllLabel: true,
    options: [
      { value: "admin", label: "Admin" },
      { value: "manager", label: "Manager" },
      { value: "user", label: "User" },
    ],
  },
  {
    key: "status",
    label: "Activity",
    showAllLabel: true,
    options: [
      { value: "online", label: "Online" },
      { value: "active", label: "Active" },
      { value: "idle", label: "Idle" },
      { value: "offline", label: "Offline" },
    ],
  },
];

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function StatusBadge({ status }: { status: UserManagementRow["status"] }) {
  const cls =
    status === "online"
      ? "bg-emerald-400"
      : status === "active"
        ? "bg-cyan-400"
        : status === "idle"
          ? "bg-amber-400"
          : "bg-slate-500";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs capitalize text-[var(--muted)]">
      <span className={`h-2 w-2 rounded-full ${cls} shadow-[0_0_10px_currentColor]`} />
      {status}
    </span>
  );
}

function sortableValue(user: UserManagementRow, key: UserTableSortKey) {
  if (key === "createdAt" || key === "lastActiveAt") return user[key] ? new Date(user[key]!).getTime() : 0;
  if (key === "status") return user.status;
  if (key === "id") return user.id;
  return user[key];
}

function UserCards({
  users,
  selectedIds,
  onToggleSelect,
  detailUserId,
  onOpenUser,
}: {
  users: UserManagementRow[];
  selectedIds: Set<string>;
  onToggleSelect: (userId: string) => void;
  detailUserId: string | null;
  onOpenUser: (user: UserManagementRow) => void;
}) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {users.map((user) => (
        <article
          key={user.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpenUser(user)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenUser(user);
            }
          }}
          className={`anim-slide cursor-pointer rounded-2xl border border-white/5 bg-[var(--panel)] p-4 transition-all hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-500/25 ${
            detailUserId === user.id ? "ring-2 ring-emerald-500/40" : ""
          } ${selectedIds.has(user.id) ? "border-indigo-400/30 bg-indigo-500/5" : ""}`}
        >
          <div className="flex items-start gap-3">
            <label
              className="hub-users-select-row shrink-0 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                className="hub-checkbox"
                checked={selectedIds.has(user.id)}
                onChange={() => onToggleSelect(user.id)}
                aria-label={`Select ${user.fullName}`}
              />
            </label>
            <HubUserAvatar user={user} size="md" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user.fullName}</div>
              <div className="truncate text-[11px] text-[var(--muted)]">
                {user.loginId ? `@${user.loginId}` : user.email || "N/A"}
                {user.loginId && user.email ? ` · ${user.email}` : ""}
              </div>
            </div>
            <HubRoleBadge role={user.role} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <span className="rounded-xl border border-white/5 bg-white/[.03] p-2">
              <small className="block text-[10px] uppercase tracking-wider text-[var(--muted)]">Tools</small>
              <strong className="mt-1 inline-flex text-base tabular-nums">
                <span
                  className={`hub-users-tool-badge hub-users-tool-badge--card${
                    user.toolCount === 0 ? " hub-users-tool-badge--empty" : ""
                  }${user.role === "admin" ? " hub-users-tool-badge--admin" : ""}`}
                >
                  {user.toolCount}
                </span>
              </strong>
            </span>
            <span className="rounded-xl border border-white/5 bg-white/[.03] p-2">
              <small className="block text-[10px] uppercase tracking-wider text-[var(--muted)]">Actions</small>
              <strong className="text-base tabular-nums">{user.activityCount}</strong>
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
            <StatusBadge status={user.status} />
            <span className="text-[11px] text-[var(--muted)]">{fmtDate(user.lastActiveAt)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

type UserManagementScreenProps = {
  headerActions?: ReactNode;
};

export function UserManagementScreen({ headerActions }: UserManagementScreenProps) {
  const { session, loading: authLoading, isSupabaseConfigured } = useHubAuth();
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const initialCache = readUserManagementStaleCache();
  const [rows, setRows] = useState<UserManagementRow[]>(() => initialCache?.rows ?? []);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<HubViewMode>("table");
  const [hubTools, setHubTools] = useState<HubToolRow[]>(() => initialCache?.hubTools ?? []);
  const [accessUser, setAccessUser] = useState<UserManagementRow | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<UserTableColumnKey>>(() => readUserTableColumns());
  const [sortKey, setSortKey] = useState<UserTableSortKey>("lastActiveAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [myRole, setMyRole] = useState<UserManagementRow["role"] | null>(null);
  const [roleMessage, setRoleMessage] = useState<string | null>(null);
  const [pendingClearUsers, setPendingClearUsers] = useState<UserManagementRow[] | null>(null);
  const [clearBusy, setClearBusy] = useState(false);

  const actorRole = useMemo(
    () => resolveSessionActorRole(myRole, session?.user.id, rows),
    [myRole, session?.user.id, rows],
  );

  const canManageRoles = actorRole === "admin";
  const canManageTools = actorRole === "admin";

  const syncWorkspaceTools = useCallback(async (): Promise<{ ok: boolean; error: string | null; count: number }> => {
    const catalog = await loadWorkspaceToolCatalog();
    if (!catalog.length) return { ok: true, error: null, count: 0 };
    const sync = await syncHubToolsCatalog(catalog);
    return { ok: !sync.error, error: sync.error, count: sync.count };
  }, []);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!session) return;
      const silent = opts?.silent !== false;
      if (silent) setRefreshing(true);
      else if (rows.length === 0) setLoading(true);
      else setRefreshing(true);
      try {
        const [profileRole, catalog, result, toolsResult] = await Promise.all([
          myRole ? Promise.resolve(myRole) : fetchCurrentProfileRole(session.user.id),
          loadWorkspaceToolCatalog(),
          fetchUserManagementRows(session),
          fetchHubTools(),
        ]);
        if (profileRole) setMyRole(profileRole);
        const effectiveRole = profileRole ?? resolveSessionActorRole(null, session.user.id, result.rows);
        const mergedTools = mergeHubToolCatalog(toolsResult.tools, catalog);
        setRows(result.rows);
        setHubTools(mergedTools);
        writeUserManagementClientCache(result.rows, mergedTools);
        const pending = countRegistryOnlyTools(mergedTools);
        const warnParts = [result.warning, toolsResult.error].filter(Boolean);
        if (pending > 0 && effectiveRole === "admin") {
          warnParts.push(`${pending} tool(s)/extension(s) need Sync tools before grants can be saved.`);
        }
        setDataWarning(warnParts.join(" · ") || null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load users";
        if (rows.length === 0 && !readUserManagementStaleCache()) setDataWarning(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [myRole, session, rows.length],
  );

  useEffect(() => {
    if (!session?.user.id) {
      setMyRole(null);
      return;
    }
    void fetchCurrentProfileRole(session.user.id).then(setMyRole);
  }, [session?.user.id]);

  useEffect(() => {
    const sync = () => setVisibleColumns(readUserTableColumns());
    window.addEventListener("user-table-columns-change", sync);
    return () => window.removeEventListener("user-table-columns-change", sync);
  }, []);

  useEffect(() => {
    if (visibleColumns.has(sortKey as UserTableColumnKey)) return;
    setSortKey("lastActiveAt");
  }, [sortKey, visibleColumns]);

  useEffect(() => {
    if (!session) return;
    void refresh({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when session identity changes only
  }, [session?.user.id]);

  const toolFilterOptions = useMemo(() => {
    const byCode = new Map<string, string>();
    hubTools.forEach((t) => byCode.set(t.tool_code, t.name));
    rows.forEach((row) => row.toolCodes.forEach((code) => {
      if (!byCode.has(code)) byCode.set(code, code);
    }));
    const options = [...byCode.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], "vi"))
      .map(([value, label]) => ({ value, label }));
    if (rows.some((row) => row.toolCount === 0)) {
      options.unshift({ value: TOOL_NONE, label: "No tool access" });
    }
    return options;
  }, [hubTools, rows]);

  const userFiltersBase = useMemo<FilterDef[]>(
    () => [
      ...BASE_USER_FILTERS,
      {
        key: "tool",
        label: "Tool",
        showAllLabel: true,
        options: toolFilterOptions,
      },
    ],
    [toolFilterOptions],
  );

  const handleUserSaved = useCallback((userId: string, payload: UserAccessSavePayload) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === userId
          ? {
              ...row,
              fullName: payload.fullName,
              email: payload.email,
              loginId: payload.loginId,
              role: payload.role,
              toolCodes: payload.toolCodes,
              toolCount: payload.role === "admin" ? row.toolCount : payload.toolCodes.length,
            }
          : row,
      ),
    );
    setRoleMessage("User updated.");
  }, []);

  const handleSyncToolsClick = useCallback(async () => {
    if (!canManageTools) return;
    setLoading(true);
    setRoleMessage(null);
    const sync = await syncWorkspaceTools();
    await refresh();
    setLoading(false);
    if (sync.error) {
      setRoleMessage(sync.error);
      return;
    }
    setRoleMessage(`Synced ${sync.count} tools and extensions from workspace.`);
  }, [canManageTools, refresh, syncWorkspaceTools]);

  const handleAddUserOpen = useCallback(() => {
    setRoleMessage(null);
    setAddUserOpen(true);
  }, []);

  const handleCreateUsers = useCallback(
    async (users: HubUserCreatePayload[]) => {
      if (!session?.access_token) {
        return { ok: false, created: 0, error: "Sign in required" };
      }
      const result = await createHubUsers(session.access_token, users);
      if (result.created > 0) {
        await refresh();
        setRoleMessage(`Created ${result.created} user(s).`);
      }
      const firstFail = result.results.find((r) => !r.ok);
      return {
        ok: result.ok,
        created: result.created,
        error: result.error ?? firstFail?.error ?? null,
      };
    },
    [refresh, session?.access_token],
  );

  const handleCreateSingleUser = useCallback(
    async (draft: HubUserCreatePayload) => {
      const result = await handleCreateUsers([draft]);
      return { ok: result.created > 0, error: result.error };
    },
    [handleCreateUsers],
  );

  const handleSyncCatalogForModal = useCallback(async () => {
    const sync = await syncWorkspaceTools();
    const catalog = await loadWorkspaceToolCatalog();
    const { tools } = await fetchHubTools();
    setHubTools(mergeHubToolCatalog(tools, catalog));
    return { ok: sync.ok, error: sync.error };
  }, [syncWorkspaceTools]);

  const userFilters = useMemo(
    () => userFiltersWithCounts(rows, userFiltersBase, query, filterValues),
    [rows, userFiltersBase, query, filterValues],
  );

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesUserFilters(row, query, filterValues)),
    [filterValues, query, rows],
  );

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const av = sortableValue(a, sortKey);
      const bv = sortableValue(b, sortKey);
      const result = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? result : -result;
    });
  }, [filteredRows, sortDir, sortKey]);

  const selectedUsers = useMemo(
    () => sortedRows.filter((row) => selectedIds.has(row.id)),
    [sortedRows, selectedIds],
  );

  const allVisibleSelected = sortedRows.length > 0 && sortedRows.every((row) => selectedIds.has(row.id));
  const hasSelection = selectedIds.size > 0;
  const isAdmin = actorRole === "admin";
  const isManager = actorRole === "manager";
  const roleLoading = Boolean(session) && rows.length > 0 && actorRole === null && !authLoading;

  useEffect(() => {
    const visible = new Set(sortedRows.map((row) => row.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [sortedRows]);

  const toggleSelect = useCallback((userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (sortedRows.every((row) => prev.has(row.id))) {
        const next = new Set(prev);
        sortedRows.forEach((row) => next.delete(row.id));
        return next;
      }
      const next = new Set(prev);
      sortedRows.forEach((row) => next.add(row.id));
      return next;
    });
  }, [sortedRows]);

  const handleBulkEdit = useCallback(() => {
    const target = selectedUsers[0] ?? null;
    if (target) setAccessUser(target);
  }, [selectedUsers]);

  useHubPageShortcuts("users", {
    onNew: handleAddUserOpen,
    onEdit: handleBulkEdit,
    canNew: () => isAdmin && !roleLoading,
    canEdit: () => (isAdmin || isManager) && hasSelection && !roleLoading,
  });

  const handleBulkDelete = useCallback(() => {
    if (!canManageTools || selectedUsers.length === 0) return;
    const nonAdmins = selectedUsers.filter((u) => u.role !== "admin");
    if (!nonAdmins.length) {
      setRoleMessage("Admin accounts keep implicit tool access and cannot be bulk-cleared.");
      return;
    }
    setPendingClearUsers(nonAdmins);
  }, [canManageTools, selectedUsers]);

  const confirmBulkClear = useCallback(async () => {
    const nonAdmins = pendingClearUsers;
    if (!nonAdmins?.length) return;
    setClearBusy(true);
    setLoading(true);
    const result = await revokeAllToolAccessForUsers(nonAdmins.map((u) => u.id));
    setClearBusy(false);
    setLoading(false);
    setPendingClearUsers(null);
    if (!result.ok) {
      setRoleMessage(result.error ?? "Unable to clear tool access");
      return;
    }
    const cleared = new Set(nonAdmins.map((u) => u.id));
    setRows((prev) =>
      prev.map((row) => (cleared.has(row.id) ? { ...row, toolCodes: [], toolCount: 0 } : row)),
    );
    setSelectedIds(new Set());
    setRoleMessage(`Cleared tool access for ${nonAdmins.length} user(s).`);
  }, [pendingClearUsers]);

  const stats = useMemo(() => {
    const total = filteredRows.length;
    const admins = filteredRows.filter((row) => row.role === "admin").length;
    const managers = filteredRows.filter((row) => row.role === "manager").length;
    const active = filteredRows.filter((row) => row.status === "online" || row.status === "active").length;
    const toolGrants = filteredRows.reduce((sum, row) => sum + row.toolCount, 0);
    return { total, admins, managers, active, toolGrants };
  }, [filteredRows]);

  const kpis = useMemo<KpiTileData[]>(
    () => [
      { label: "Users (shown)", value: stats.total, icon: Users, tone: "indigo" },
      { label: "Active now", value: stats.active, icon: Activity, tone: "emerald" },
      { label: "Admins", value: stats.admins, icon: Crown, tone: "amber" },
      { label: "Tool grants", value: stats.toolGrants, icon: Package, tone: "purple" },
    ],
    [stats],
  );

  const charts = useMemo<{
    roleItems: BarItem[];
    statusItems: BarItem[];
    toolItems: BarItem[];
    activityItems: DonutItem[];
  }>(() => {
    const roleItems = [
      { label: "Admin", value: filteredRows.filter((row) => row.role === "admin").length, color: "#818cf8" },
      { label: "Manager", value: filteredRows.filter((row) => row.role === "manager").length, color: "#a855f7" },
      { label: "User", value: filteredRows.filter((row) => row.role === "user").length, color: "#22c55e" },
    ];
    const statusItems = ["online", "active", "idle", "offline"].map((status, index) => ({
      label: status,
      value: filteredRows.filter((row) => row.status === status).length,
      color: ["#22c55e", "#06b6d4", "#f59e0b", "#64748b"][index],
    }));
    const toolItems = [...filteredRows]
      .sort((a, b) => b.toolCount - a.toolCount)
      .slice(0, 6)
      .map((row) => ({ label: row.fullName, value: row.toolCount, color: "#10b981" }));
    const activityItems = [
      { label: "Has activity", value: filteredRows.filter((row) => row.activityCount > 0).length, color: "#818cf8" },
      { label: "No activity", value: filteredRows.filter((row) => row.activityCount === 0).length, color: "#64748b" },
    ];
    return { roleItems, statusItems, toolItems, activityItems };
  }, [filteredRows]);

  const centerStats = useMemo<TabHeaderStatItem[]>(
    () => [
      { key: "active", icon: CheckCircle2, label: "active", value: stats.active, toneClass: "text-emerald-300" },
      { key: "admins", icon: ShieldCheck, label: "admins", value: stats.admins, toneClass: "text-indigo-300" },
      { key: "managers", icon: UserRound, label: "managers", value: stats.managers, toneClass: "text-purple-300" },
      { key: "tools", icon: Package, label: "grants", value: stats.toolGrants, toneClass: "text-amber-300" },
    ],
    [stats],
  );

  function handleSort(next: UserTableSortKey) {
    if (next === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(next);
    setSortDir(next === "fullName" || next === "email" ? "asc" : "desc");
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
        Supabase is not configured.
      </div>
    );
  }

  if (authLoading && rows.length === 0 && !readUserManagementStaleCache()) {
    return (
      <HubDirectoryScreen
        header={<UserListChromeHeader centerStats={[]} actions={headerActions} />}
        sectionRuleLabel="Users"
      >
        <div className="relative min-h-[320px]">
          <UsersLoadingView variant="overlay" />
        </div>
      </HubDirectoryScreen>
    );
  }

  if (!session) {
    const hasStale = rows.length > 0 || readUserManagementStaleCache() != null;
    if (authLoading && hasStale) {
      /* paint cached users while session resolves */
    } else {
      return (
        <div className="anim-fade space-y-4">
          <AppTabHeader
            ariaLabel="Users header"
            titleIcon={Users}
            titleIconClass="text-emerald-300"
            title="Users"
            metaItems={[{ icon: Users, title: "Build", value: `v${APP_VERSION}` }]}
            centerStats={[]}
            actions={headerActions}
            pinSticky={false}
            dividerBelow
          />
          <HubAuthGate variant="users" />
        </div>
      );
    }
  }

  const chartsBand = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MiniBarChart title="By Role" items={charts.roleItems} />
      <MiniBarChart title="By Activity" items={charts.statusItems} />
      <MiniBarChart title="Tool access" items={charts.toolItems} />
      <MiniDonut title="Activity Distribution" items={charts.activityItems} />
    </div>
  );

  return (
    <>
      <HubDirectoryScreen
        header={<UserListChromeHeader centerStats={centerStats} actions={headerActions} />}
        filters={userFilters}
        query={query}
        onQueryChange={setQuery}
        filterValues={filterValues}
        onFilterValuesChange={setFilterValues}
        filterPlaceholder="Search users…"
        filterShortcutScope="users"
        filterToolbar={
          <>
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <HubResultCount icon={Users} shown={filteredRows.length} total={rows.length} />
            <button
              type="button"
              onClick={() => void refresh({ silent: true })}
              disabled={refreshing && !session}
              className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} className={loading || refreshing ? "animate-spin" : ""} />
              {refreshing && rows.length > 0 ? "Updating…" : "Refresh"}
            </button>
          </>
        }
        filterRowActions={
          session ? (
            <UserBulkActionBar
              hasSelection={hasSelection}
              selectedCount={selectedIds.size}
              loading={loading}
              isAdmin={isAdmin}
              isManager={isManager}
              roleLoading={roleLoading}
              onAdd={handleAddUserOpen}
              onSyncTools={() => void handleSyncToolsClick()}
              onEdit={handleBulkEdit}
              onDelete={() => void handleBulkDelete()}
            />
          ) : null
        }
        kpis={kpis}
        charts={chartsBand}
        sectionRuleLabel="Users"
      >
        {!session && authLoading ? (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-xs text-[var(--muted)]">
            Checking sign-in… showing cached users. Data will refresh when connected.
          </div>
        ) : null}

        <div className={`transition-opacity ${refreshing ? "opacity-80" : ""}`}>
          {dataWarning ? (
            <div className="mb-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              User data source warning: {dataWarning}
            </div>
          ) : null}

          {roleMessage ? (
            <div className="mb-3 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100">
              {roleMessage}
            </div>
          ) : null}

          <div className="relative mt-3 min-h-[200px]">
            {rows.length === 0 && (loading || refreshing) ? (
              <p className="py-10 text-center text-sm text-[var(--muted)]">Loading users in background…</p>
            ) : null}
            {rows.length > 0 && viewMode === "card" ? (
              <UserCards
                users={sortedRows}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                detailUserId={accessUser?.id ?? null}
                onOpenUser={setAccessUser}
              />
            ) : null}
            {rows.length > 0 && viewMode === "table" ? (
              <UserDirectoryTable
                users={sortedRows}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                allVisibleSelected={allVisibleSelected}
                detailUserId={accessUser?.id ?? null}
                onOpenUser={setAccessUser}
                visibleColumns={visibleColumns}
              />
            ) : null}
          </div>
        </div>
      </HubDirectoryScreen>

      {accessUser && session ? (
        <UserAccessModal
          user={accessUser}
          tools={hubTools}
          canEdit={canManageTools}
          canEditProfile={canManageRoles}
          actorId={session.user.id}
          accessToken={session.access_token}
          onClose={() => setAccessUser(null)}
          onSaved={handleUserSaved}
          onSyncCatalog={canManageTools ? handleSyncCatalogForModal : undefined}
        />
      ) : null}

      <UserAddModal
        open={addUserOpen && isAdmin}
        onClose={() => setAddUserOpen(false)}
        onCreateSingle={handleCreateSingleUser}
        onCreateMany={handleCreateUsers}
      />

      <HubConfirmDialog
        open={pendingClearUsers !== null}
        title="Clear tool access?"
        message={
          pendingClearUsers ? (
            <>
              Clear Hub tool access for <strong className="text-[var(--text)]">{pendingClearUsers.length}</strong>{" "}
              user(s)? Profiles and auth accounts are kept.
            </>
          ) : null
        }
        confirmLabel={
          pendingClearUsers?.length === 1 ? "Clear access" : `Clear ${pendingClearUsers?.length ?? 0} users`
        }
        tone="danger"
        confirmBusy={clearBusy}
        onClose={() => {
          if (!clearBusy) setPendingClearUsers(null);
        }}
        onConfirm={() => void confirmBulkClear()}
      />
    </>
  );
}
