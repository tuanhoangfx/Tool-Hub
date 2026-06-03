import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Package, UserRound, X } from "lucide-react";
import { FilterBar } from "../../components/sales-shell";
import { HubSingleFilterDropdown } from "../../components/sales-shell/FilterBar";
import { HubEmailBadge } from "./HubEmailBadge";
import { HubUserAvatar } from "./HubUserAvatar";
import { resolveCategoryDisplayIcon } from "../../lib/badge-registry";
import { compactIconSize } from "../../lib/ui-scale";
import { HubRoleBadge } from "./HubRoleBadge";
import { countRegistryOnlyTools, fetchUserToolCodes, setUserToolAccess, type HubToolRow } from "./toolAccessRepository";
import { hubRoleLabel } from "./hubUserDisplay";
import {
  resetHubUserPassword,
  updateUserProfile,
  type UserManagementRow,
} from "./userManagementRepository";
import {
  buildToolCategoryFilterDef,
  matchesToolAccessFilters,
  TOOL_ACCESS_GRANT_FILTER,
  toolAccessFiltersWithCounts,
} from "./tool-access-filters";
import { useToolAccessFilterPrefs } from "./use-tool-access-filter-prefs";
import { TocHighlightContent, TocSectionHighlightProvider } from "../overview/toc-section-highlight-context";
import { USER_ACCESS_TOC, userAccessSectionTitle } from "./user-access-toc";
import { UserAccessTocNav } from "./UserAccessTocNav";

export type UserAccessSavePayload = {
  fullName: string;
  email: string;
  loginId: string;
  role: UserManagementRow["role"];
  toolCodes: string[];
};

type UserAccessModalProps = {
  user: UserManagementRow | null;
  tools: HubToolRow[];
  canEdit: boolean;
  canEditProfile: boolean;
  actorId: string;
  accessToken: string | null;
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
    <section id={id} className="scroll-mt-4 space-y-3 rounded-xl border border-white/5 bg-white/[.02] p-3">
      <h3 className="border-b border-white/5 pb-2 text-[15px] font-semibold leading-snug text-[var(--text)]">{title}</h3>
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
  accessToken,
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
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const isAdminUser = user?.role === "admin";
  const idPrefix = user ? `ua-${user.id}-` : "";
  const tocSectionIds = useMemo(
    () => USER_ACCESS_TOC.map(({ id }) => `${idPrefix}${id}`),
    [idPrefix],
  );
  const registryOnlyCount = countRegistryOnlyTools(tools);

  const { query, setQuery, filterValues, setFilterValues } = useToolAccessFilterPrefs(user?.id ?? null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role);
    setError(null);
    setResetMsg(null);
    setNewPassword("");
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
      loginId: user.loginId,
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

  const onAdminResetPassword = useCallback(async () => {
    if (!user || !accessToken) return;
    const pwd = newPassword.trim();
    const ok = window.confirm(
      pwd
        ? `Set a new password for ${user.fullName || user.loginId}?`
        : `Generate a new temporary password for ${user.fullName || user.loginId}?`,
    );
    if (!ok) return;
    setResetBusy(true);
    setResetMsg(null);
    const result = await resetHubUserPassword(accessToken, user.id, pwd || undefined);
    setResetBusy(false);
    if (!result.ok) {
      setResetMsg(result.error ?? "Could not reset password");
      return;
    }
    const shown = result.password ?? pwd;
    setResetMsg(shown ? `New password: ${shown} — share securely with the user.` : "Password updated.");
    setNewPassword("");
  }, [accessToken, newPassword, user]);

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
          <div className="user-access-modal__header-main min-w-0 flex-1">
            <HubRoleBadge role={canEditProfile ? role : user.role} />
            <HubUserAvatar user={user} size="sm" className="user-access-modal__avatar" />
            <h2
              id="user-access-modal-title"
              className="user-access-modal__header-name min-w-0 truncate text-sm font-semibold text-[var(--text)]"
            >
              {canEditProfile ? fullName || user.fullName : user.fullName}
            </h2>
            <HubEmailBadge email={canEditProfile ? email || user.email : user.email} className="min-w-0 shrink" />
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
          <TocSectionHighlightProvider sectionIds={tocSectionIds}>
            <div className="grid gap-4 lg:grid-cols-[var(--overview-toc-w)_minmax(0,1fr)]">
              <aside className="lg:sticky lg:top-0 lg:self-start">
                <UserAccessTocNav idPrefix={idPrefix} />
              </aside>

              <TocHighlightContent className="min-w-0 space-y-4 p-1 sm:p-2">
              <DetailSection id={`${idPrefix}user`} title={userAccessSectionTitle("user")}>
                {canEditProfile ? (
                  <div className="user-access-modal__profile-row">
                    <label className="user-access-modal__profile-field min-w-0 flex-1">
                      <span className="user-access-modal__profile-label">Display name</span>
                      <input
                        className="field w-full text-xs"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                      />
                    </label>
                    <label className="user-access-modal__profile-field min-w-0 flex-1">
                      <span className="user-access-modal__profile-label">Email (profile)</span>
                      <input
                        type="email"
                        className="field w-full text-xs"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </label>
                    <label className="user-access-modal__profile-field user-access-modal__profile-field--role shrink-0">
                      <span className="user-access-modal__profile-label">Role</span>
                      <HubSingleFilterDropdown
                        filterKey="role"
                        label="Role"
                        value={role}
                        onChange={(v) => setRole(v as UserManagementRow["role"])}
                        options={ROLE_OPTIONS.map((r) => ({
                          value: r,
                          label: hubRoleLabel(r),
                        }))}
                      />
                    </label>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <tbody>
                      {(
                        [
                          ["Full name", user.fullName],
                          ["User ID", user.loginId || "—"],
                          ["Email", user.email || "—"],
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
                {canEditProfile ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-[11px] font-medium text-amber-100">Reset password (admin)</p>
                    <p className="text-[10px] text-[var(--muted)]">
                      If the user forgot their password, set a new one here (auto-generated if left empty).
                    </p>
                    <input
                      className="field w-full text-xs"
                      type="password"
                      placeholder="New password (optional)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      disabled={resetBusy || !accessToken}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/25 disabled:opacity-50"
                      onClick={() => void onAdminResetPassword()}
                    >
                      {resetBusy ? "Resetting…" : "Reset password"}
                    </button>
                    {resetMsg ? <p className="text-[10px] text-amber-100">{resetMsg}</p> : null}
                  </div>
                ) : null}
              </DetailSection>

              <DetailSection id={`${idPrefix}tools`} title={userAccessSectionTitle("tools")}>
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
                      layout="inline"
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
                            <tr className="border-b border-white/5 bg-white/[.02] text-[10px] font-medium text-[var(--muted)]">
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

              <DetailSection id={`${idPrefix}legacy`} title={userAccessSectionTitle("legacy")}>
                {user.projectNames.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No legacy Todo projects linked.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[.03] text-[10px] font-medium text-[var(--muted)]">
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

              <DetailSection id={`${idPrefix}summary`} title={userAccessSectionTitle("summary")}>
                <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-2">
                    <dt className="text-[10px] text-[var(--muted)]">Tools granted</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums text-indigo-200">
                      {isAdminUser ? tools.length : selected.size}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-2">
                    <dt className="text-[10px] text-[var(--muted)]">Catalog</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">{tools.length}</dd>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-2">
                    <dt className="text-[10px] text-[var(--muted)]">Legacy projects</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">{user.projectCount}</dd>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-2">
                    <dt className="text-[10px] text-[var(--muted)]">Activity events</dt>
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
              </TocHighlightContent>
            </div>
          </TocSectionHighlightProvider>
        </div>
      </div>
    </div>,
    document.body,
  );
}
