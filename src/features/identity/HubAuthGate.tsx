import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ToolAvatar } from "../../components/ToolAvatar";
import { toolIconName, toolSvgIcon } from "../../lib/visual";
import { supabase } from "../../lib/supabase";
import {
  canUseEmailPasswordRecovery,
  hubDisplayEmail,
  hubDisplayLoginId,
  isHubSyntheticEmail,
  resolveHubLogin,
} from "@tool-workspace/hub-identity";

type Props = {
  onAuthed?: () => void;
  variant?: "hub" | "users";
};

type ModalProps = {
  onAuthed?: () => void;
  onClose: () => void;
  variant: NonNullable<Props["variant"]>;
};

function AuthGateModal({ onAuthed, onClose, variant }: ModalProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const normalizeAuthError = (raw: string) => {
    const msg = String(raw || "").trim();
    const lower = msg.toLowerCase();
    if (lower.includes("rate limit")) return "Temporary sign-in issue. Please try again in a moment.";
    if (lower.includes("invalid login credentials")) return "Incorrect user ID/email or password.";
    if (lower.includes("user already registered")) return "This user ID or email is already registered.";
    return msg || "Sign-in failed. Please try again.";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const resolved = resolveHubLogin(login);
      const action =
        mode === "signup"
          ? supabase.auth.signUp({
              email: resolved.authEmail,
              password,
              options: {
                data: {
                  full_name: resolved.loginId ?? resolved.authEmail.split("@")[0],
                  login_id: resolved.loginId ?? undefined,
                },
              },
            })
          : supabase.auth.signInWithPassword({ email: resolved.authEmail, password });
      const { data, error } = await action;
      if (error) {
        setMessage(normalizeAuthError(error.message));
        setBusy(false);
        return;
      }
      if (mode === "signup" && resolved.loginId && data.user?.id) {
        await supabase
          .from("profiles")
          .update({
            login_id: resolved.loginId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.user.id);
      }
      setBusy(false);
      onAuthed?.();
    } catch (err) {
      setBusy(false);
      setMessage(err instanceof Error ? err.message : "Invalid input");
    }
  };

  const onForgotPassword = async () => {
    setBusy(true);
    setMessage("");
    try {
      const resolved = resolveHubLogin(login);
      if (!resolved.isEmailLogin || !canUseEmailPasswordRecovery(resolved.authEmail)) {
        setMessage("Link your email in Account after sign-in, or ask an admin to reset your password.");
        setBusy(false);
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(resolved.authEmail, {
        redirectTo: `${window.location.origin}/`,
      });
      setBusy(false);
      if (error) setMessage(error.message);
      else setMessage("Check your inbox for a reset link.");
    } catch (err) {
      setBusy(false);
      setMessage(err instanceof Error ? err.message : "Enter your linked email first.");
    }
  };

  return createPortal(
    <div className="auth-gate-root" role="presentation">
      <div className="auth-gate-backdrop" aria-hidden onClick={onClose} />
      <div className="auth-gate-modal" role="dialog" aria-modal="true" aria-labelledby="auth-gate-title">
        <button type="button" className="auth-gate-close" onClick={onClose} aria-label="Close sign in">
          <X size={16} />
        </button>
        <div className="auth-gate-brand">
          <ToolAvatar
            code="P0004"
            iconName={toolIconName({ code: "P0004" })}
            svgSrc={toolSvgIcon({ code: "P0004" }) ?? undefined}
            size="lg"
          />
        </div>
        <h2 id="auth-gate-title" className="auth-gate-title">
          Welcome to Tool Hub
        </h2>
        <p className="auth-gate-subtitle">
          {variant === "users"
            ? "Sign in with User ID or email. Link email later for password recovery."
            : "Sign in with User ID or email (x1z10 P01)."}
        </p>

        <div className="auth-gate-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            className={`auth-gate-tab${mode === "signin" ? " auth-gate-tab--active" : ""}`}
            onClick={() => {
              setMode("signin");
              setMessage("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={`auth-gate-tab${mode === "signup" ? " auth-gate-tab--active" : ""}`}
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-gate-form" onSubmit={(e) => void submit(e)}>
          <input
            className="field auth-gate-field w-full"
            type="text"
            placeholder="User ID or email"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
          <p className="auth-gate-hint">
            {mode === "signup"
              ? "User ID: 3–32 characters (a–z, 0–9, . _ -). You can link a real email after sign-in."
              : "Use your User ID or the email you linked to this account."}
          </p>
          <div className="auth-gate-password-wrap">
            <input
              className="field auth-gate-field w-full"
              type="password"
              placeholder="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {mode === "signin" ? (
              <button
                type="button"
                className="auth-gate-forgot"
                disabled={busy}
                onClick={() => void onForgotPassword()}
              >
                Forgot Password?
              </button>
            ) : null}
          </div>
          {message ? <p className="auth-gate-message">{message}</p> : null}
          <button type="submit" className="auth-gate-submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export function HubAuthGate({ onAuthed, variant = "hub" }: Props) {
  const [showModal, setShowModal] = useState(false);

  const copy =
    variant === "users"
      ? {
          title: "Sign in to manage workspace users.",
          sub: "User ID + password, or email if linked. Admins can add users and reset passwords.",
        }
      : {
          title: "Sign in to Tool Hub.",
          sub: "User ID or email — one workspace login for tools in this ecosystem.",
        };

  return (
    <>
      <div className="auth-inline anim-fade">
        <div className="auth-inline-card">
          <div className="auth-inline-title">{copy.title}</div>
          <div className="auth-inline-sub">{copy.sub}</div>
          <button type="button" className="auth-inline-btn" onClick={() => setShowModal(true)}>
            Login
          </button>
        </div>
      </div>
      {showModal ? (
        <AuthGateModal
          onAuthed={() => {
            setShowModal(false);
            onAuthed?.();
          }}
          onClose={() => setShowModal(false)}
          variant={variant}
        />
      ) : null}
    </>
  );
}

/** Labels for account modal from session */
export function hubSessionLabels(session: { user: { email?: string | null; user_metadata?: Record<string, unknown> } } | null) {
  const authEmail = session?.user.email ?? "";
  const loginId = hubDisplayLoginId({
    loginId: String(session?.user.user_metadata?.login_id ?? ""),
    authEmail,
  });
  const email = hubDisplayEmail({ authEmail });
  return { authEmail, loginId, email, hasSyntheticAuth: isHubSyntheticEmail(authEmail) };
}
