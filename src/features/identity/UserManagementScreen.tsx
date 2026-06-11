/**
 * User directory — HubDirectoryScreen parity (read-only-directory, useDirectoryTableSort,
 * HubFormFieldLabel, hub-users-empty).
 */
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
  UsersLoadingView,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
  type KpiTileData,
} from "../../components/sales-shell";
import {
  HubDirectoryCardCheckbox,
  HubDirectoryInteractiveCard,
  HubDirectoryScreen,
  HubBulkActionButton,
  HubDirectoryBulkActionBar,
  HubPaginatedCardGrid,
  HubUsersDirectoryBulkActions,
  DirectorySearchToolbar,
  directoryChartBandNode,
  hubDirectoryListResetKey,
  matchesDirectoryTimeRange,
  resolveVisibleChartKeys,
  useHubPageShortcuts,
} from "@tool-workspace/hub-ui";
import { UserListChromeHeader } from "./UserListChromeHeader";
import {
  buildUserHeaderStats,
  DEFAULT_USER_HEADER_STAT_KEYS,
} from "./user-header-metrics";
import { readHubListPrefs } from "../../lib/url-prefs";
import { DEFAULT_USER_CHART_KEYS, DEFAULT_USER_KPI_KEYS, USER_CHART_DEFS } from "./user-display-prefs";
import { buildUserKpiItems } from "./user-kpi-items";
import { userCharts } from "./user-chart-aggregates";
import { pushUsersLog } from "../../lib/users-log";

function visibleKpiSet(set: Set<string> | null, defaults: Set<string>) {
  return set ?? defaults;
}
import { HubAuthGate } from "./HubAuthGate";
import { HubRoleBadge } from "./HubRoleBadge";
import { HubUserAvatar } from "./HubUserAvatar";
import { hubRoleLabel, resolveSessionActorRole } from "./hubUserDisplay";
import { UserDirectoryTable, type UserTableSortKey } from "./UserDirectoryTable";
import { readUserTableColumns, type UserTableColumnKey } from "./user-table-prefs";
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
  users: readonly UserManagementRow[];
  selectedIds: Set<string>;
  onToggleSelect: (userId: string) => void;
  detailUserId: string | null;
  onOpenUser: (user: UserManagementRow) => void;
}) {
  return (
    <>
      {users.map((user) => (
        <HubDirectoryInteractiveCard
          key={user.id}
          variant="panel"
          selected={selectedIds.has(user.id)}
          isDetail={detailUserId === user.id}
          detailRingClass="ring-emerald-500/40"
          ariaLabel={`Open ${user.fullName}`}
          onActivate={() => onOpenUser(user)}
        >
          <div className="flex items-start gap-3">
            <HubDirectoryCardCheckbox
              corner={false}
              className="hub-users-select-row shrink-0 pt-1"
              checked={selectedIds.has(user.id)}
              label={`Select ${user.fullName}`}
              onChange={() => onToggleSelect(user.id)}
            />
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
        </HubDirectoryInteractiveCard>
      ))}
    </>
  );
}

type UserManagementScreenProps = {
  versionReleaseDate: string;
  headerActions?: ReactNode;
};

export function UserManagementScreen({ versionReleaseDate, headerActions }: UserManagementScreenProps) {
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
  const [hubPrefs, setHubPrefs] = useState(readHubListPrefs);
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
        let mergedTools = mergeHubToolCatalog(toolsResult.tools, catalog);
        const warnParts = [result.warning, toolsResult.error].filter(Boolean);
        let pending = countRegistryOnlyTools(mergedTools);
        if (pending > 0 && effectiveRole === "admin" && catalog.length > 0) {
          const sync = await syncHubToolsCatalog(catalog);
          if (sync.error) {
            warnParts.push(sync.error);
          } else {
            const toolsAfter = await fetchHubTools();
            mergedTools = mergeHubToolCatalog(toolsAfter.tools, catalog);
            pending = countRegistryOnlyTools(mergedTools);
          }
        }
        setRows(result.rows);
        setHubTools(mergedTools);
        writeUserManagementClientCache(result.rows, mergedTools);
        if (pending > 0 && effectiveRole === "admin") {
          warnParts.push(
            `${pending} tool(s)/extension(s) could not be registered in Hub DB — grant save may fail until catalog sync succeeds.`,
          );
        }
        setDataWarning(warnParts.join(" · ") || null);
        pushUsersLog("Refresh", `Loaded ${result.rows.length} user(s), ${mergedTools.length} tool(s)`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load users";
        if (rows.length === 0 && !readUserManagementStaleCache()) setDataWarning(message);
        pushUsersLog("Refresh", message);
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
    const label = payload.loginId || payload.fullName || userId.slice(0, 8);
    pushUsersLog("Access", `Updated ${label} · role ${payload.role} · ${payload.toolCodes.length} tool(s)`);
  }, []);

  const handleAddUserOpen = useCallback(() => {
    setRoleMessage(null);
    setAddUserOpen(true);
    pushUsersLog("Users", "Opened add user dialog");
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
        pushUsersLog("Users", `Created ${result.created} user(s)`);
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
    pushUsersLog(
      "Catalog",
      sync.ok ? `Synced ${sync.count} workspace tool(s) into Hub DB` : (sync.error ?? "Catalog sync failed"),
    );
    return { ok: sync.ok, error: sync.error };
  }, [syncWorkspaceTools]);

  const userFilters = useMemo(
    () => userFiltersWithCounts(rows, userFiltersBase, query, filterValues),
    [rows, userFiltersBase, query, filterValues],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          matchesUserFilters(row, query, filterValues) &&
          matchesDirectoryTimeRange(row.lastActiveAt ?? row.updatedAt ?? row.createdAt, hubPrefs.range),
      ),
    [filterValues, query, rows, hubPrefs.range],
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

  const listResetKey = useMemo(
    () => hubDirectoryListResetKey(query, filterValues, sortKey, sortDir, hubPrefs.range),
    [query, filterValues, sortKey, sortDir, hubPrefs.range],
  );
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
    if (target) {
      setAccessUser(target);
      pushUsersLog("Access", `Opened access editor for ${target.loginId || target.fullName || target.id.slice(0, 8)}`);
    }
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
    pushUsersLog("Access", `Cleared tool access for ${nonAdmins.length} user(s)`);
  }, [pendingClearUsers]);

  const stats = useMemo(() => {
    const total = filteredRows.length;
    const admins = filteredRows.filter((row) => row.role === "admin").length;
    const managers = filteredRows.filter((row) => row.role === "manager").length;
    const members = filteredRows.filter((row) => row.role === "user").length;
    const active = filteredRows.filter((row) => row.status === "online" || row.status === "active").length;
    const idle = filteredRows.filter((row) => row.status === "idle" || row.status === "offline").length;
    const toolGrants = filteredRows.reduce((sum, row) => sum + row.toolCount, 0);
    const withTools = filteredRows.filter((row) => row.toolCount > 0).length;
    return { total, admins, managers, members, active, idle, toolGrants, withTools };
  }, [filteredRows]);

  const visKpi = useMemo(() => visibleKpiSet(hubPrefs.kpi, DEFAULT_USER_KPI_KEYS), [hubPrefs.kpi]);
  const visCharts = useMemo(
    () => resolveVisibleChartKeys(hubPrefs.charts, DEFAULT_USER_CHART_KEYS, USER_CHART_DEFS),
    [hubPrefs.charts],
  );

  const kpis = useMemo(
    () => buildUserKpiItems(stats).filter((item) => !item.prefKey || visKpi.has(item.prefKey)),
    [stats, visKpi],
  );

  const charts = useMemo(() => userCharts(filteredRows), [filteredRows]);

  useEffect(() => {
    const sync = () => setHubPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const visHeaderStats = useMemo(
    () => hubPrefs.headerStats ?? DEFAULT_USER_HEADER_STAT_KEYS,
    [hubPrefs.headerStats],
  );

  const centerStats = useMemo(
    () =>
      buildUserHeaderStats(visHeaderStats, {
        active: stats.active,
        admins: stats.admins,
        managers: stats.managers,
        toolGrants: stats.toolGrants,
      }),
    [visHeaderStats, stats],
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
        header={
          <UserListChromeHeader
            versionReleaseDate={versionReleaseDate}
            centerStats={[]}
            actions={headerActions}
          />
        }
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
        <HubDirectoryScreen
          header={
            <UserListChromeHeader
              versionReleaseDate={versionReleaseDate}
              centerStats={[]}
              actions={headerActions}
            />
          }
        >
          <HubAuthGate variant="users" />
        </HubDirectoryScreen>
      );
    }
  }

  const chartsBand = directoryChartBandNode({
    visCharts,
    defs: USER_CHART_DEFS,
    data: {
      role_bar: charts.role,
      activity_bar: charts.activity,
      tool_bar: charts.tool,
      distribution_bar: charts.distribution,
    },
  });

  return (
    <>
      <HubDirectoryScreen
        header={
          <UserListChromeHeader
            versionReleaseDate={versionReleaseDate}
            centerStats={centerStats}
            actions={headerActions}
          />
        }
        filters={userFilters}
        query={query}
        onQueryChange={setQuery}
        filterValues={filterValues}
        onFilterValuesChange={setFilterValues}
        filterPlaceholder="Search users…"
        filterShortcutScope="users"
        filterToolbar={
          <DirectorySearchToolbar
            viewMode={viewMode}
            onViewModeChange={(next) => {
              pushUsersLog("View", `Switched to ${next === "card" ? "Cards" : "Table"}`);
              setViewMode(next);
            }}
            countIcon={Users}
            shown={filteredRows.length}
            total={rows.length}
            countLabel="users"
            refreshing={refreshing}
            onRefresh={() => void refresh({ silent: true })}
            showRefresh={false}
            showTablePageSize
            trailing={
              <HubBulkActionButton
                icon={<RefreshCw size={14} aria-hidden />}
                label={refreshing && rows.length > 0 ? "Updating…" : "Refresh"}
                title="Refresh user directory"
                tone="emerald"
                disabled={refreshing && !session}
                iconSpinning={loading || refreshing}
                onClick={() => void refresh({ silent: true })}
              />
            }
          />
        }
        filterRowActions={
          session ? (
            <HubDirectoryBulkActionBar
              selectAll={
                viewMode === "card"
                  ? {
                      visibleCount: sortedRows.length,
                      selectedCount: selectedIds.size,
                      allVisibleSelected,
                      onToggleSelectAll: toggleSelectAll,
                      noun: "users",
                    }
                  : null
              }
            >
              <HubUsersDirectoryBulkActions
                hasSelection={hasSelection}
                selectedCount={selectedIds.size}
                isAdmin={isAdmin}
                isManager={isManager}
                roleLoading={roleLoading}
                onAdd={handleAddUserOpen}
                onEdit={handleBulkEdit}
                onDelete={() => void handleBulkDelete()}
              />
            </HubDirectoryBulkActionBar>
          ) : null
        }
        kpis={kpis.length > 0 ? kpis : undefined}
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

          <div className="relative min-h-[200px]">
            {rows.length === 0 && (loading || refreshing) ? (
              <p className="py-10 text-center text-sm text-[var(--muted)]">Loading users in background…</p>
            ) : null}
            {rows.length > 0 && viewMode === "card" ? (
              <HubPaginatedCardGrid
                items={sortedRows}
                resetKey={listResetKey}
                ariaLabel="Users card pages"
              >
                {(pageUsers) => (
                  <UserCards
                    users={pageUsers}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    detailUserId={accessUser?.id ?? null}
                    onOpenUser={(user) => {
                      setAccessUser(user);
                      pushUsersLog("Access", `Opened ${user.loginId || user.fullName || user.id.slice(0, 8)}`);
                    }}
                  />
                )}
              </HubPaginatedCardGrid>
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
                onOpenUser={(user) => {
                  setAccessUser(user);
                  pushUsersLog("Access", `Opened ${user.loginId || user.fullName || user.id.slice(0, 8)}`);
                }}
                visibleColumns={visibleColumns}
                resetKey={listResetKey}
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
