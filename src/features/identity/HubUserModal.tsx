import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, LogOut, Mail, RefreshCcw, ShieldCheck, User, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { fetchCurrentProfileRole } from "./userManagementRepository";

type Props = {
  open: boolean;
  onClose: () => void;
  session: Session | null;
};

function userDisplay(email: string | null | undefined) {
  return email?.trim() || "Not signed in";
}

function roleLabel(role: string) {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  if (role === "employee") return "Employee";
  return role;
}

export function HubUserModal({ open, onClose, session }: Props) {
  const [signingOut, setSigningOut] = useState(false);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const user = session?.user ?? null;
  const email = user?.email ?? null;
  const provider = String(user?.app_metadata?.provider ?? "email");
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleString("vi-VN") : "—";
  const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("vi-VN") : "—";
  const role =
    profileRole ??
    String(user?.app_metadata?.role ?? user?.user_metadata?.role ?? "authenticated");
  const initials = useMemo(() => {
    const base = email || user?.id || "U";
    return base.slice(0, 2).toUpperCase();
  }, [email, user?.id]);

  useEffect(() => {
    if (!open || !user?.id) {
      setProfileRole(null);
      return;
    }
    let cancelled = false;
    void fetchCurrentProfileRole(user.id).then((r) => {
      if (!cancelled && r) setProfileRole(r);
    });
    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] grid place-items-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Workspace user information"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel)] shadow-2xl shadow-black/45">
        <div className="relative border-b border-white/10 bg-gradient-to-br from-indigo-500/20 via-slate-900/10 to-emerald-500/10 p-5">
          <button
            type="button"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/20 text-[var(--muted)] hover:text-[var(--text)]"
            onClick={onClose}
            aria-label="Close user modal"
          >
            <X size={15} />
          </button>
          <div className="flex items-center gap-3 pr-10">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-indigo-300/25 bg-indigo-500/20 text-sm font-bold text-indigo-100 shadow-[0_0_28px_rgba(99,102,241,0.2)]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200/80">
                Workspace user
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold text-[var(--text)]">{userDisplay(email)}</h2>
              <p className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">{user?.id ?? "No active session"}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-2 p-4 text-sm">
          {[
            { label: "Email", value: userDisplay(email), icon: Mail },
            { label: "Role", value: roleLabel(role), icon: ShieldCheck },
            { label: "Provider", value: provider, icon: KeyRound },
            { label: "Created", value: createdAt, icon: User },
            { label: "Last sign in", value: lastSignIn, icon: RefreshCcw },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[.025] px-3 py-2.5"
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/[.04] text-indigo-200">
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{item.label}</div>
                  <div className="mt-0.5 truncate font-medium text-[var(--text)]" title={item.value}>
                    {item.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            className="btn-danger btn flex w-full items-center justify-center gap-2 text-[13px]"
            disabled={!session || signingOut}
            onClick={() => {
              void (async () => {
                setSigningOut(true);
                const { error } = await supabase.auth.signOut();
                setSigningOut(false);
                if (error) {
                  window.alert(error.message);
                  return;
                }
                onClose();
              })();
            }}
          >
            <LogOut size={15} />
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
