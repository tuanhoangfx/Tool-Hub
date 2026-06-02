import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Package, UserRound, X } from "lucide-react";
import { FilterBar } from "../../components/sales-shell";
import { resolveCategoryDisplayIcon } from "../../lib/badge-registry";
import { compactIconSize } from "../../lib/ui-scale";
import { HubRoleBadge } from "./HubRoleBadge";
import { HubUserAvatar } from "./HubUserAvatar";
import { countRegistryOnlyTools, fetchUserToolCodes, setUserToolAccess, type HubToolRow } from "./toolAccessRepository";
import { hubRoleLabel } from "./hubUserDisplay";
import { updateUserProfile, type UserManagementRow } from "./userManagementRepository";
import {
  buildToolCategoryFilterDef,
  matchesToolAccessFilters,
  TOOL_ACCESS_GRANT_FILTER,
  toolAccessFiltersWithCounts,
} from "./tool-access-filters";
import { useToolAccessFilterPrefs } from "./use-tool-access-filter-prefs";
import { UserAccessTocNav } from "./UserAccessTocNav";

export type UserAccessSavePayload = {
  fullName: string;
  email: string;
  role: UserManagementRow["role"];
  toolCodes: string[];
};

type UserAccessModalProps = {
  user: UserManagementRow | null;
  tools: HubToolRow[];
  canEdit: boolean;
  canEditProfile: boolean;
  actorId: string;
  onClose: () => void;
  onSaved: (userId: string, payload: UserAccessSavePayload) => void;
  onSyncCatalog?: () => Promise<{ ok: boolean; error: string | null }>;
};

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function DetailSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 rounded-xl border border-white/5 bg-white/[.02] p-3">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{title}</h3>
      {children}
    </section>
  );
}

const ROLE_OPTIONS: UserManagementRow["role"][] = ["admin", "manager", "user"];

export function UserAccessModal({
  user,
  tools,
  canEdit,
  canEditProfile,
  actorId,
  onClose,
  onSaved,
  onSyncCatalog,
}: UserAccessModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserManagementRow["role"]>("user");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdminUser = user?.role === "admin";
  const idPrefix = user ? `ua-${user.id}-` : "";
  const registryOnlyCount = countRegistryOnlyTools(tools);

  const { query, setQuery, filterValues, setFilterValues } = useToolAccessFilterPrefs(user?.id ?? null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role);
    setError(null);
    if (isAdminUser) {
      setSelected(new Set(tools.map((t) => t.tool_code)));
      return;
    }
    setLoading(true);
    void fetchUserToolCodes(user.id).then((result) => {
      setLoading(false);
      if (result.error) {
        setError(result.error);
        setSelected(new Set(user.toolCodes));
        return;
      }
      setSelected(new Set(result.codes));
    });
  }, [user, isAdminUser, tools]);

  useEffect(() => {
    if (!user) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.classList.add("hub-modal-open");
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.classList.remove("hub-modal-open");
    };
  }, [user, onClose]);

  const filterDefsBase = useMemo(() => {
    const categoryDef = buildToolCategoryFilterDef(tools);
    return categoryDef.options.length ? [TOOL_ACCESS_GRANT_FILTER, categoryDef] : [TOOL_ACCESS_GRANT_FILTER];
  }, [tools]);

  const filters = useMemo(
    () => toolAccessFiltersWithCounts(tools, filterDefsBase, query, filterValues, selected),
    [tools, filterDefsBase, query, filterValues, selected],
  );

  const filteredTools = useMemo(
    () => tools.filter((tool) => matchesToolAccessFilters(tool, query, filterValues, selected)),
    [tools, query, filterValues, selected],
  );

  const toggle = useCallback(
    (code: string) => {
      if (!canEdit || isAdminUser) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        return next;
      });
    },
    [canEdit, isAdminUser],
  );

  const toggleAllFiltered = useCallback(() => {
    if (!canEdit || isAdminUser) return;
    const codes = filteredTools.map((t) => t.tool_code);
    const allOn = codes.every((c) => selected.has(c));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) codes.forEach((c) => next.delete(c));
      else codes.forEach((c) => next.add(c));
      return next;
    });
  }, [canEdit, filteredTools, isAdminUser, selected]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    if (!canEdit && !canEditProfile) return;

    setSaving(true);
    setError(null);

    if (canEditProfile) {
      const profileResult = await updateUserProfile(user.id, {
        fullName,
        email,
        role,
      });
      if (!profileResult.ok) {
        setSaving(false);
        setError(profileResult.error ?? "Unable to update profile");
        return;
      }
    }

    if (canEdit && !isAdminUser) {
      const grantCodes = [...selected];
      const needsCatalogSync = grantCodes.some((code) => tools.find((t) => t.tool_code === code)?.registryOnly);
      if (needsCatalogSync && onSyncCatalog) {
        const sync = await onSyncCatalog();
        if (!sync.ok) {
          setSaving(false);
          setError(sync.error ?? "Sync workspace tools before granting new codes.");
          return;
        }
      }
      const accessResult = await setUserToolAccess(user.id, grantCodes, actorId);
      if (!accessResult.ok) {
        setSaving(false);
        setError(accessResult.error ?? "Unable to save tool access");
        return;
      }
    }

    setSaving(false);
    onSaved(user.id, {
      fullName: fullName.trim(),
      email: email.trim(),
      role,
      toolCodes: isAdminUser ? tools.map((t) => t.tool_code) : [...selected],
    });
    onClose();
  }, [
    actorId,
    canEdit,
    canEditProfile,
    email,
    fullName,
    isAdminUser,
    onClose,
    onSaved,
    onSyncCatalog,
    role,
    selected,
    tools,
    user,
  ]);

  if (!user) return null;

  const allFilteredGranted = filteredTools.length > 0 && filteredTools.every((t) => selected.has(t.tool_code));

  return createPortal(
    <div className="modal-backdrop modal-backdrop--tool-detail" role="presentation" onClick={onClose}>
      <div
        className="modal-shell modal-shell--tool-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-access-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="user-access-modal__header">
          <div className="min-w-0 flex-1">
            <h2 id="user-access-modal-title" className="truncate text-sm font-semibold leading-tight">
              {user.fullName}
            </h2>
            <p className="truncate text-[10px] text-[var(--muted)]">{user.email}</p>
          </div>
          <div className="user-access-modal__header-actions">
            {canEdit || canEditProfile ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                <Package size={12} aria-hidden />
                Save changes
              </button>
            ) : null}
            <button type="button" className="modal-close modal-close--tool-detail-inline" onClick={onClose} aria-label="Close">
              <X size={compactIconSize(16)} />
            </button>
          </div>
        </header>
        <div className="modal-shell__scroll modal-shell__scroll--user-access">
          <div className="grid gap-4 lg:grid-cols-[var(--overview-detail-toc-col-w)_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-0 lg:self-start">
              <UserAccessTocNav idPrefix={idPrefix} />
            </aside>

            <div className="min-w-0 space-y-4 p-1 sm:p-2">
              <div className="flex items-center gap-3 pb-1">
                <HubUserAvatar user={user} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <HubRoleBadge role={user.role} />
                    <span className="text-[10px] text-[var(--muted)]">
                      {hubRoleLabel(user.role)}
                      {isAdminUser ? " · all tools (implicit)" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <DetailSection id={`${idPrefix}user`} title="User">
                {canEditProfile ? (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-medium text-[var(--muted)]">
                      Display name
                      <input
                        className="field mt-1 w-full text-xs"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                      />
                    </label>
                    <label className="block text-[10px] font-medium text-[var(--muted)]">
                      Email (profile)
                      <input
                        type="email"
                        className="field mt-1 w-full text-xs"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </label>
                    <label className="block text-[10px] font-medium text-[var(--muted)]">
                      Role
                      <select
                        className="hub-users-role-select mt-1 w-full max-w-none"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserManagementRow["role"])}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {hubRoleLabel(r)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="text-[10px] text-[var(--muted)]">
                      Auth login email is managed in Supabase; this updates the Hub profile directory.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <tbody>
                      {(
                        [
                          ["Full name", user.fullName],
                          ["Email", user.email],
                          ["Role", null],
                          ["Activity", user.status],
                          ["Last active", fmtDate(user.lastActiveAt)],
                          ["Member since", fmtDate(user.createdAt)],
                        ] as const
                      ).map(([label, value]) => (
                        <tr key={label} className="border-t border-white/5 first:border-0">
                          <th className="w-32 py-2 pr-3 font-medium text-[var(--muted)]">{label}</th>
                          <td className="py-2 text-[var(--text)]">
                            {label === "Role" ? <HubRoleBadge role={user.role} /> : value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </DetailSection>

              <DetailSection id={`${idPrefix}tools`} title="Tool access (Hub tools & extensions)">
                {registryOnlyCount > 0 ? (
                  <p className="mb-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-100">
                    {registryOnlyCount} item(s) from workspace scan are not in Hub DB yet. Use{" "}
                    <strong>Sync tools</strong> in the toolbar, then save grants.
                  </p>
                ) : null}
                {loading ? <p className="text-xs text-[var(--muted)]">Loading grants…</p> : null}
                {!loading && tools.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">
                    No tools in catalog. Admin: Refresh workspace on Hub, then Refresh users.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <FilterBar
                      layout="hub"
                      placeholder="Search tools by code, name, category…"
                      filters={filters}
                      query={query}
                      onQueryChange={setQuery}
                      values={filterValues}
                      onValuesChange={setFilterValues}
                      trailing={
                        <>
                          {canEdit && !isAdminUser && filteredTools.length > 0 ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[var(--panel-2)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-white/5"
                              onClick={toggleAllFiltered}
                            >
                              {allFilteredGranted ? "Clear filtered" : "Grant filtered"}
                            </button>
                          ) : null}
                          <span className="hidden text-[10px] text-[var(--muted)] sm:inline">
                            {filteredTools.length}/{tools.length}
                          </span>
                        </>
                      }
                    />

                    {filteredTools.length === 0 ? (
                      <p className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-6 text-center text-[12px] text-[var(--muted)]">
                        No tools match search or filters.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-white/5 bg-black/10">
                        <table className="w-full min-w-[480px] border-collapse text-left text-[12px]">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/[.02] text-[10px] uppercase tracking-wider text-[var(--muted)]">
                              {canEdit && !isAdminUser ? <th className="w-10 px-2 py-2" /> : null}
                              <th className="px-3 py-2 font-medium">Tool</th>
                              <th className="px-3 py-2 font-medium">Name</th>
                              <th className="px-3 py-2 font-medium">Category</th>
                              <th className="px-3 py-2 text-center font-medium">Access</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTools.map((tool) => {
                              const checked = selected.has(tool.tool_code);
                              const meta = resolveCategoryDisplayIcon(tool.category ?? undefined);
                              const Icon = meta.icon;
                              return (
                                <tr
                                  key={tool.tool_code}
                                  className={`border-b border-white/5 last:border-0 ${
                                    checked ? "bg-indigo-500/[.04]" : "hover:bg-white/[.02]"
                                  } ${canEdit && !isAdminUser ? "cursor-pointer" : ""}`}
                                  onClick={() => toggle(tool.tool_code)}
                                >
                                  {canEdit && !isAdminUser ? (
                                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggle(tool.tool_code)}
                                        className="hub-checkbox"
                                        aria-label={`Grant ${tool.tool_code}`}
                                      />
                                    </td>
                                  ) : null}
                                  <td className="px-3 py-2 font-mono text-indigo-200/90">
                                    {tool.tool_code}
                                    {tool.registryOnly ? (
                                      <span className="ml-1 rounded bg-amber-500/15 px-1 text-[9px] font-sans text-amber-200">
                                        unsynced
                                      </span>
                                    ) : null}
                                  </td>
                                  <td className="px-3 py-2 font-medium">{tool.name}</td>
                                  <td className="px-3 py-2">
                                    <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
                                      <Icon size={compactIconSize(12)} className={meta.className} aria-hidden />
                                      {tool.category ?? "—"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {checked ? (
                                      <Check size={14} className="inline text-emerald-400" aria-label="Granted" />
                                    ) : (
                                      <span className="text-[var(--muted)]">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </DetailSection>

              <DetailSection id={`${idPrefix}legacy`} title="Projects (legacy Todo)">
                {user.projectNames.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No legacy Todo projects linked.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[.03] text-[10px] uppercase text-[var(--muted)]">
                        <tr>
                          <th className="px-3 py-2 font-medium">Project name</th>
                          <th className="px-3 py-2 font-medium">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {user.projectNames.map((name) => (
                          <tr key={name}>
                            <td className="px-3 py-2">{name}</td>
                            <td className="px-3 py-2 text-[var(--muted)]">Legacy Todo</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DetailSection>

              <DetailSection id={`${idPrefix}summary`} title="Summary">
                <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-2">
                    <dt className="text-[10px] uppercase text-[var(--muted)]">Tools granted</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums text-indigo-200">
                      {isAdminUser ? tools.length : selected.size}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-2">
                    <dt className="text-[10px] uppercase text-[var(--muted)]">Catalog</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">{tools.length}</dd>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-2">
                    <dt className="text-[10px] uppercase text-[var(--muted)]">Legacy projects</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">{user.projectCount}</dd>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-2">
                    <dt className="text-[10px] uppercase text-[var(--muted)]">Activity events</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">{user.activityCount}</dd>
                  </div>
                </dl>
              </DetailSection>

              {error ? (
                <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p>
              ) : null}

              <footer className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                  <UserRound size={12} aria-hidden />
                  {selected.size} / {tools.length} tools
                  {!canEdit ? " · view only" : null}
                </span>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
