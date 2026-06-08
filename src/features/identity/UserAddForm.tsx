import { useEffect, useMemo, useState } from "react";
import { HubSingleFilterDropdown } from "../../components/sales-shell/FilterBar";
import { hubRoleLabel } from "./hubUserDisplay";
import type { UserManagementRow } from "./userManagementRepository";
import {
  formatUserBulkLine,
  parseUserBulkText,
  validateUserBulkRows,
  type UserCreateDraft,
} from "./parse-user-bulk";

type Tab = "single" | "bulk";

const ROLE_OPTIONS: UserManagementRow["role"][] = ["admin", "manager", "user"];

export type UserAddFormProps = {
  active: boolean;
  /** Body-only — shell via HubToolDetailModal in UserAddModal. */
  variant: "embedded";
  onClose: () => void;
  onCreateSingle: (draft: UserCreateDraft) => Promise<{ ok: boolean; error: string | null }>;
  onCreateMany: (drafts: UserCreateDraft[]) => Promise<{
    ok: boolean;
    created: number;
    error: string | null;
  }>;
};

export function UserAddForm({
  active,
  variant,
  onClose,
  onCreateSingle,
  onCreateMany,
}: UserAddFormProps) {
  const [tab, setTab] = useState<Tab>("single");
  const [fullName, setFullName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserManagementRow["role"]>("user");
  const [password, setPassword] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!active) return;
    setError(null);
    setTab("single");
    setFullName("");
    setLoginId("");
    setEmail("");
    setRole("user");
    setPassword("");
    setBulkText("");
  }, [active]);

  const parsed = useMemo(() => parseUserBulkText(bulkText), [bulkText]);
  const previewCount = useMemo(
    () => validateUserBulkRows(parsed.rows).valid.length,
    [parsed.rows],
  );

  const onSubmitSingle = async () => {
    setBusy(true);
    setError(null);
    const draft: UserCreateDraft = {
      loginId: loginId.trim().toLowerCase() || undefined,
      email: email.trim().toLowerCase() || undefined,
      fullName: fullName.trim() || loginId.trim() || email.trim(),
      role,
      password: password.trim() || undefined,
    };
    if (!draft.loginId && !draft.email) {
      setError("User ID or email is required.");
      setBusy(false);
      return;
    }
    const result = await onCreateSingle(draft);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not create user.");
      return;
    }
    onClose();
  };

  const onImportBulk = async () => {
    setBusy(true);
    setError(null);
    try {
      const { valid, invalid } = validateUserBulkRows(parsed.rows);
      const allErrors = [...parsed.errors, ...invalid];
      if (!valid.length) {
        setError(allErrors[0]?.message ?? "No valid rows to import.");
        return;
      }
      const result = await onCreateMany(valid);
      if (!result.ok && result.created === 0) {
        setError(result.error ?? "Import failed.");
        return;
      }
      if (allErrors.length) {
        setError(
          `Created ${result.created} user(s). Skipped ${allErrors.length} line(s).${result.error ? ` ${result.error}` : ""}`,
        );
        if (result.created > 0) onClose();
        return;
      }
      if (result.created > 0) onClose();
      else setError(result.error ?? "No users created.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 px-1">
      <p className="text-center text-xs text-[var(--muted)]">
        User ID + password, or email. Optional contact email. Admin only (service role on dev server).
      </p>

      <div className="auth-gate-tabs" role="tablist" aria-label="Add mode">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "single"}
          className={`auth-gate-tab${tab === "single" ? " auth-gate-tab--active" : ""}`}
          onClick={() => setTab("single")}
        >
          Single
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "bulk"}
          className={`auth-gate-tab${tab === "bulk" ? " auth-gate-tab--active" : ""}`}
          onClick={() => setTab("bulk")}
        >
          Bulk
        </button>
      </div>

      <div className="auth-gate-form">
        {tab === "single" ? (
          <>
            <input
              className="field auth-gate-field w-full"
              placeholder="Display name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              className="field auth-gate-field w-full"
              placeholder="User ID (required if no email)"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoComplete="off"
            />
            <input
              className="field auth-gate-field w-full"
              type="email"
              placeholder="Email (optional — for recovery / notifications)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-[var(--muted)]">Role</span>
              <HubSingleFilterDropdown
                filterKey="role"
                label="Role"
                value={role}
                onChange={(v) => setRole(v as UserManagementRow["role"])}
                options={ROLE_OPTIONS.map((r) => ({ value: r, label: hubRoleLabel(r) }))}
              />
            </div>
            <input
              className="field auth-gate-field w-full"
              type="password"
              autoComplete="new-password"
              placeholder="Password (optional — auto-generated if empty)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        ) : (
          <>
            <p className="auth-gate-hint">
              One line per user:{" "}
              <span className="auth-gate-mono">login_id|display_name|role</span> or{" "}
              <span className="auth-gate-mono">email|display_name|role</span> (role optional).
            </p>
            <textarea
              className="field auth-gate-field w-full min-h-[120px] font-mono text-[11px] leading-relaxed"
              placeholder="Paste rows here"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <p className="auth-gate-hint">
              Example:{" "}
              <span className="auth-gate-mono">
                {formatUserBulkLine({ loginId: "dev01", fullName: "Dev User", role: "user" })}
              </span>
            </p>
            {previewCount > 0 ? (
              <p className="auth-gate-ok">{previewCount} valid row(s) ready to import.</p>
            ) : null}
          </>
        )}

        {error ? <p className="auth-gate-message">{error}</p> : null}

        <div className="auth-gate-actions">
          <button type="button" className="auth-gate-secondary" onClick={onClose}>
            Cancel
          </button>
          {tab === "bulk" ? (
            <button
              type="button"
              disabled={busy || !bulkText.trim()}
              className="auth-gate-submit"
              onClick={() => void onImportBulk()}
            >
              {busy ? "Please wait…" : previewCount > 0 ? `Create (${previewCount})` : "Create"}
            </button>
          ) : (
            <button
              type="button"
              className="auth-gate-submit"
              disabled={busy}
              onClick={() => void onSubmitSingle()}
            >
              {busy ? "Please wait…" : "Add user"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
