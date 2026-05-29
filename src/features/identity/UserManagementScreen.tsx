import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Crown,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import {
  AppTabHeader,
  FilterBar,
  HubResultCount,
  KpiStrip,
  MiniBarChart,
  MiniDonut,
  ViewToggle,
  type BarItem,
  type DonutItem,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
  type KpiTileData,
  type TabHeaderStatItem,
} from "../../components/sales-shell";
import { APP_VERSION } from "../../lib/app-meta";
import { HubAuthGate } from "./HubAuthGate";
import { useHubAuth } from "./useHubAuth";
import { fetchUserManagementRows, type UserManagementRow } from "./userManagementRepository";

const USER_FILTERS: FilterDef[] = [
  {
    key: "role",
    label: "Role",
    showAllLabel: true,
    options: [
      { value: "admin", label: "Admin", color: "#818cf8" },
      { value: "manager", label: "Manager", color: "#a855f7" },
      { value: "employee", label: "Employee", color: "#22c55e" },
    ],
  },
  {
    key: "status",
    label: "Activity",
    showAllLabel: true,
    options: [
      { value: "online", label: "Online", color: "#22c55e" },
      { value: "active", label: "Active", color: "#06b6d4" },
      { value: "idle", label: "Idle", color: "#f59e0b" },
      { value: "offline", label: "Offline", color: "#64748b" },
    ],
  },
];

type SortKey = "fullName" | "email" | "role" | "createdAt" | "lastActiveAt" | "projectCount" | "activityCount";

function fmtDate(value: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleLabel(role: UserManagementRow["role"]) {
  return role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Employee";
}

function RoleBadge({ role }: { role: UserManagementRow["role"] }) {
  const cls =
    role === "admin"
      ? "border-indigo-400/25 bg-indigo-500/15 text-indigo-200"
      : role === "manager"
        ? "border-purple-400/25 bg-purple-500/15 text-purple-200"
        : "border-emerald-400/25 bg-emerald-500/15 text-emerald-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{roleLabel(role)}</span>;
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

function DataSectionRule() {
  return (
    <div role="separator" className="relative py-5" aria-label="Users list">
      <div
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-emerald-400/45 to-transparent shadow-[0_0_10px_rgba(52,211,153,0.2)]"
        aria-hidden
      />
      <div className="relative flex justify-center" aria-hidden>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-[var(--bg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/90 shadow-[0_0_16px_rgba(52,211,153,0.12)]">
          <span className="h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
          Users
          <span className="h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
        </span>
      </div>
    </div>
  );
}

function UserAvatar({ user }: { user: UserManagementRow }) {
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/10" />
  ) : (
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-indigo-500/15 text-xs font-bold text-emerald-100 ring-1 ring-white/10">
      {initials(user.fullName)}
    </span>
  );
}

function sortableValue(user: UserManagementRow, key: SortKey) {
  if (key === "createdAt" || key === "lastActiveAt") return user[key] ? new Date(user[key]!).getTime() : 0;
  return user[key];
}

function UserTable({
  users,
  sortKey,
  sortDir,
  onSort,
}: {
  users: UserManagementRow[];
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const headers: { key: SortKey; label: string; align?: string }[] = [
    { key: "fullName", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Position", align: "text-center" },
    { key: "projectCount", label: "Projects", align: "text-center" },
    { key: "createdAt", label: "Created", align: "text-center" },
    { key: "lastActiveAt", label: "Latest activity", align: "text-center" },
    { key: "activityCount", label: "Actions", align: "text-center" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[var(--panel)]">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-white/[.035] text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            <tr>
              {headers.map((header) => (
                <th key={header.key} className={`px-4 py-3 font-semibold ${header.align ?? ""}`}>
                  <button
                    type="button"
                    onClick={() => onSort(header.key)}
                    className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:bg-white/5 hover:text-[var(--text)]"
                  >
                    {header.label}
                    {sortKey === header.key ? <span className="text-emerald-300">{sortDir === "asc" ? "^" : "v"}</span> : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.055]">
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-white/[.035]">
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar user={user} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[var(--text)]">{user.fullName}</div>
                      <div className="truncate font-mono text-[10px] text-[var(--muted)]">{user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex max-w-[220px] items-center gap-1.5 truncate text-[var(--muted)]">
                    <Mail size={13} className="shrink-0 text-indigo-300/80" />
                    <span className="truncate">{user.email || "N/A"}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold tabular-nums text-[var(--text)]">{user.projectCount}</span>
                  {user.projectNames.length ? (
                    <div className="mx-auto mt-1 max-w-[150px] truncate text-[10px] text-[var(--muted)]" title={user.projectNames.join(", ")}>
                      {user.projectNames.join(", ")}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-center text-xs tabular-nums text-[var(--muted)]">{fmtDate(user.createdAt)}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <StatusBadge status={user.status} />
                    <span className="text-xs tabular-nums text-[var(--muted)]">{fmtDate(user.lastActiveAt)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono text-xs tabular-nums text-[var(--text)]/90">{user.activityCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 ? <div className="py-10 text-center text-sm text-[var(--muted)]">No users found.</div> : null}
      </div>
    </div>
  );
}

function UserCards({ users }: { users: UserManagementRow[] }) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {users.map((user) => (
        <article key={user.id} className="anim-slide rounded-2xl border border-white/5 bg-[var(--panel)] p-4 transition-all hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-500/25">
          <div className="flex items-start gap-3">
            <UserAvatar user={user} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{user.fullName}</div>
              <div className="truncate text-xs text-[var(--muted)]">{user.email || "N/A"}</div>
            </div>
            <RoleBadge role={user.role} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <span className="rounded-xl border border-white/5 bg-white/[.03] p-2">
              <small className="block text-[10px] uppercase tracking-wider text-[var(--muted)]">Projects</small>
              <strong className="text-base tabular-nums">{user.projectCount}</strong>
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
  const [rows, setRows] = useState<UserManagementRow[]>([]);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<HubViewMode>("table");
  const [sortKey, setSortKey] = useState<SortKey>("lastActiveAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await fetchUserManagementRows(session);
      setRows(result.rows);
      setDataWarning(result.warning);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load users";
      setDataWarning(message);
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) void refresh();
  }, [refresh, session]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selectedRoles = filterValues.role ?? [];
    const selectedStatuses = filterValues.status ?? [];
    return rows.filter((row) => {
      if (selectedRoles.length && !selectedRoles.includes(row.role)) return false;
      if (selectedStatuses.length && !selectedStatuses.includes(row.status)) return false;
      if (!q) return true;
      const haystack = [
        row.fullName,
        row.email,
        row.id,
        row.role,
        row.status,
        ...row.projectNames,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [filterValues.role, filterValues.status, query, rows]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const av = sortableValue(a, sortKey);
      const bv = sortableValue(b, sortKey);
      const result = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? result : -result;
    });
  }, [filteredRows, sortDir, sortKey]);

  const stats = useMemo(() => {
    const total = filteredRows.length;
    const admins = filteredRows.filter((row) => row.role === "admin").length;
    const managers = filteredRows.filter((row) => row.role === "manager").length;
    const active = filteredRows.filter((row) => row.status === "online" || row.status === "active").length;
    const projects = filteredRows.reduce((sum, row) => sum + row.projectCount, 0);
    const actions = filteredRows.reduce((sum, row) => sum + row.activityCount, 0);
    return { total, admins, managers, active, projects, actions };
  }, [filteredRows]);

  const kpis = useMemo<KpiTileData[]>(
    () => [
      { label: "Users (shown)", value: stats.total, icon: Users, tone: "indigo" },
      { label: "Active now", value: stats.active, icon: Activity, tone: "emerald" },
      { label: "Admins", value: stats.admins, icon: Crown, tone: "amber" },
      { label: "Project seats", value: stats.projects, icon: BriefcaseBusiness, tone: "purple" },
    ],
    [stats],
  );

  const charts = useMemo<{ roleItems: BarItem[]; statusItems: BarItem[]; projectItems: BarItem[]; activityItems: DonutItem[] }>(() => {
    const roleItems = [
      { label: "Admin", value: filteredRows.filter((row) => row.role === "admin").length, color: "#818cf8" },
      { label: "Manager", value: filteredRows.filter((row) => row.role === "manager").length, color: "#a855f7" },
      { label: "Employee", value: filteredRows.filter((row) => row.role === "employee").length, color: "#22c55e" },
    ];
    const statusItems = ["online", "active", "idle", "offline"].map((status, index) => ({
      label: status,
      value: filteredRows.filter((row) => row.status === status).length,
      color: ["#22c55e", "#06b6d4", "#f59e0b", "#64748b"][index],
    }));
    const projectItems = [...filteredRows]
      .sort((a, b) => b.projectCount - a.projectCount)
      .slice(0, 6)
      .map((row) => ({ label: row.fullName, value: row.projectCount, color: "#10b981" }));
    const activityItems = [
      { label: "Has activity", value: filteredRows.filter((row) => row.activityCount > 0).length, color: "#818cf8" },
      { label: "No activity", value: filteredRows.filter((row) => row.activityCount === 0).length, color: "#64748b" },
    ];
    return { roleItems, statusItems, projectItems, activityItems };
  }, [filteredRows]);

  const centerStats = useMemo<TabHeaderStatItem[]>(
    () => [
      { key: "active", icon: CheckCircle2, label: "active", value: stats.active, toneClass: "text-emerald-300" },
      { key: "admins", icon: ShieldCheck, label: "admins", value: stats.admins, toneClass: "text-indigo-300" },
      { key: "managers", icon: UserRound, label: "managers", value: stats.managers, toneClass: "text-purple-300" },
      { key: "projects", icon: BriefcaseBusiness, label: "seats", value: stats.projects, toneClass: "text-amber-300" },
    ],
    [stats],
  );

  function handleSort(next: SortKey) {
    if (next === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(next);
    setSortDir(next === "fullName" || next === "email" ? "asc" : "desc");
  }

  if (!isSupabaseConfigured) {
    return <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">Supabase is not configured.</div>;
  }

  if (authLoading) {
    return <div className="rounded-2xl border border-white/5 bg-[var(--panel)] p-6 text-sm text-[var(--muted)]">Loading session...</div>;
  }

  if (!session) {
    return (
      <div className="anim-fade space-y-4">
        <AppTabHeader
          ariaLabel="Users header"
          titleIcon={Users}
          titleIconClass="text-emerald-300"
          title="Users"
          metaItems={[
            { icon: Users, title: "Build", value: `v${APP_VERSION}` },
          ]}
          centerStats={[]}
          actions={headerActions}
          pinSticky={false}
          dividerBelow
        />
        <HubAuthGate variant="users" />
      </div>
    );
  }

  return (
    <div className="anim-fade space-y-0">
      <div className="hub-chrome-sticky sticky top-0 z-40 -mx-6 border-b border-white/5 bg-[var(--bg)]">
        <AppTabHeader
          ariaLabel="Users header"
          titleIcon={Users}
          titleIconClass="text-emerald-300"
          title="Users"
          metaItems={[
            { icon: Users, title: "Build", value: `v${APP_VERSION}` },
            { icon: ShieldCheck, title: "Project", value: "x1z10 P01" },
          ]}
          centerStats={centerStats}
          actions={headerActions}
          embedded
          dividerBelow={false}
        />
        <FilterBar
          layout="hub"
          pinSticky
          headerPinned
          embedded
          placeholder="Search users…"
          filters={USER_FILTERS}
          query={query}
          onQueryChange={setQuery}
          values={filterValues}
          onValuesChange={setFilterValues}
          toolbar={
            <>
              <ViewToggle value={viewMode} onChange={setViewMode} />
              <HubResultCount icon={Users} shown={filteredRows.length} total={rows.length} />
            </>
          }
          trailing={
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading || !session}
              className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          }
        />
      </div>
      <div className="space-y-5 pt-5">
        <KpiStrip items={kpis} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MiniBarChart title="By Role" items={charts.roleItems} />
          <MiniBarChart title="By Activity" items={charts.statusItems} />
          <MiniBarChart title="Project Seats" items={charts.projectItems} />
          <MiniDonut title="Activity Distribution" items={charts.activityItems} />
        </div>
      </div>

      <DataSectionRule />

      {dataWarning ? (
        <div className="mb-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          User data source warning: {dataWarning}
        </div>
      ) : null}

      {viewMode === "card" ? (
        <UserCards users={sortedRows} />
      ) : (
        <UserTable users={sortedRows} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
      )}

      {loading && rows.length === 0 ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-white/5 bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
          <RefreshCw size={14} className="animate-spin text-emerald-300" />
          Loading users...
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--muted)]">
        <CalendarClock size={13} className="text-emerald-300/80" />
        Identity project x1z10 P01 (`fmnrafpzctuhxjaaomzt`) — `auth.users` + `profiles`; optional tool/project joins when present.
      </div>
    </div>
  );
}
