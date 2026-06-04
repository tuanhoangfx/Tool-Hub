import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, Link2, LogOut, Mail, RefreshCcw, ShieldCheck, User, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { hubRoleLabel, hubUserInitials, parseHubRole } from "./hubUserDisplay";
import { fetchCurrentProfileRole } from "./userManagementRepository";
import { HubAlertDialog } from "../../components/HubAlertDialog";
import { hubSessionLabels } from "./HubAuthGate";
import { canUseEmailPasswordRecovery } from "@tool-workspace/hub-identity";

type Props = {
  open: boolean;
  onClose: () => void;
  session: Session | null;
};

export function HubUserModal({ open, onClose, session }: Props) {
  const [signingOut, setSigningOut] = useState(false);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpStep, setOtpStep] = useState<"idle" | "sent">("idle");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMsg, setOtpMsg] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const user = session?.user ?? null;
  const labels = hubSessionLabels(session);
  const provider = String(user?.app_metadata?.provider ?? "email");
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleString("vi-VN") : "—";
  const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("vi-VN") : "—";
  const role =
    profileRole ??
    String(user?.app_metadata?.role ?? user?.user_metadata?.role ?? "authenticated");
  const displayName = labels.loginId || labels.email || user?.id?.slice(0, 8) || "User";
  const initials = useMemo(
    () =>
      hubUserInitials({
        email: labels.email || labels.authEmail,
        fullName: displayName,
        id: user?.id ?? "",
      }),
    [displayName, labels.authEmail, labels.email, user?.id],
  );

  const recoveryEmail = useMemo(() => {
    if (labels.email) return labels.email;
    if (canUseEmailPasswordRecovery(labels.authEmail)) return labels.authEmail;
    return "";
  }, [labels.authEmail, labels.email]);

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

  useEffect(() => {
    if (!open) return;
    setLinkEmail(labels.email);
    setOtpEmail(recoveryEmail);
    setLinkMsg(null);
    setOtpMsg(null);
    setOtpStep("idle");
    setOtpCode("");
    setNewPassword("");
  }, [open, labels.email, recoveryEmail]);

  const onLinkEmail = async () => {
    const mail = linkEmail.trim().toLowerCase();
    if (!mail || !mail.includes("@")) {
      setLinkMsg("Enter a valid email address.");
      return;
    }
    setLinkBusy(true);
    setLinkMsg(null);
    const { error } = await supabase.auth.updateUser({ email: mail });
    if (!error) {
      await supabase
        .from("profiles")
        .update({ contact_email: mail, email: mail, updated_at: new Date().toISOString() })
        .eq("id", user?.id ?? "");
    }
    setLinkBusy(false);
    if (error) setLinkMsg(error.message);
    else
      setLinkMsg(
        labels.hasSyntheticAuth
          ? "Confirmation sent to that address. Open the link, then sign in with email + password."
          : "Confirmation sent. Check your inbox to confirm the new address.",
      );
  };

  const onSendOtp = async () => {
    const mail = otpEmail.trim().toLowerCase();
    if (!canUseEmailPasswordRecovery(mail)) {
      setOtpMsg("Link an email first, then use it here.");
      return;
    }
    setOtpBusy(true);
    setOtpMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: mail,
      options: { shouldCreateUser: false },
    });
    setOtpBusy(false);
    if (error) setOtpMsg(error.message);
    else {
      setOtpStep("sent");
      setOtpMsg("Enter the 6-digit code from your email.");
    }
  };

  const onConfirmPasswordChange = async () => {
    const mail = otpEmail.trim().toLowerCase();
    const token = otpCode.trim();
    const pwd = newPassword;
    if (!token || pwd.length < 6) {
      setOtpMsg("Enter the email code and a password (min 6 characters).");
      return;
    }
    setOtpBusy(true);
    setOtpMsg(null);
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: mail,
      token,
      type: "email",
    });
    if (verifyErr) {
      setOtpBusy(false);
      setOtpMsg(verifyErr.message);
      return;
    }
    const { error: pwdErr } = await supabase.auth.updateUser({ password: pwd });
    setOtpBusy(false);
    if (pwdErr) setOtpMsg(pwdErr.message);
    else {
      setOtpMsg("Password updated.");
      setOtpStep("idle");
      setOtpCode("");
      setNewPassword("");
    }
  };

  if (!open || typeof document === "undefined") return null;

  const modal = createPortal(
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
              <h2 className="mt-1 truncate text-lg font-semibold text-[var(--text)]">{displayName}</h2>
              <p className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">
                {labels.loginId ? `ID: ${labels.loginId}` : user?.id ?? "No active session"}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-2 p-4 text-sm">
          {[
            { label: "User ID", value: labels.loginId || "—", icon: User },
            {
              label: "Email",
              value: labels.email || (labels.hasSyntheticAuth ? "Not linked" : labels.authEmail) || "—",
              icon: Mail,
            },
            { label: "Role", value: hubRoleLabel(parseHubRole(profileRole ?? role)), icon: ShieldCheck },
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

        {session ? (
          <div className="space-y-3 border-t border-white/10 px-4 py-3">
            <div className="rounded-2xl border border-white/5 bg-white/[.02] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
                <Link2 size={14} className="text-sky-300" />
                Link email
              </div>
              <p className="mb-2 text-[10px] text-[var(--muted)]">
                Add or change your contact email. A confirmation link is sent before it becomes active.
              </p>
              <input
                className="field mb-2 w-full text-xs"
                type="email"
                placeholder="you@company.com"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                autoComplete="email"
              />
              <button
                type="button"
                className="btn w-full text-xs"
                disabled={linkBusy}
                onClick={() => void onLinkEmail()}
              >
                {linkBusy ? "Sending…" : labels.email ? "Update linked email" : "Link email"}
              </button>
              {linkMsg ? <p className="mt-2 text-[10px] text-indigo-200">{linkMsg}</p> : null}
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[.02] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
                <KeyRound size={14} className="text-amber-300" />
                Change password (email code)
              </div>
              <p className="mb-2 text-[10px] text-[var(--muted)]">
                We send a 6-digit code to your linked email. Works after email is confirmed.
              </p>
              <input
                className="field mb-2 w-full text-xs"
                type="email"
                placeholder="Linked email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                disabled={otpStep === "sent"}
              />
              {otpStep === "sent" ? (
                <>
                  <input
                    className="field mb-2 w-full text-xs"
                    placeholder="6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                  <input
                    className="field mb-2 w-full text-xs"
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </>
              ) : null}
              <div className="flex gap-2">
                {otpStep === "idle" ? (
                  <button
                    type="button"
                    className="btn flex-1 text-xs"
                    disabled={otpBusy || !recoveryEmail}
                    onClick={() => void onSendOtp()}
                  >
                    {otpBusy ? "Sending…" : "Send code"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn flex-1 text-xs"
                    disabled={otpBusy}
                    onClick={() => void onConfirmPasswordChange()}
                  >
                    {otpBusy ? "Saving…" : "Set new password"}
                  </button>
                )}
              </div>
              {otpMsg ? <p className="mt-2 text-[10px] text-amber-100">{otpMsg}</p> : null}
            </div>
          </div>
        ) : null}

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
                  setAlertTitle("Sign out failed");
                  setAlertMessage(error.message);
                  setAlertOpen(true);
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

  return (
    <>
      {modal}
      <HubAlertDialog
        open={alertOpen}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />
    </>
  );
}
