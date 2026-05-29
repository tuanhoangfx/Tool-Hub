import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ToolAvatar } from "../../components/ToolAvatar";
import { toolIconName, toolSvgIcon } from "../../lib/visual";
import { supabase } from "../../lib/supabase";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const normalizeAuthError = (raw: string) => {
    const msg = String(raw || "").trim();
    const lower = msg.toLowerCase();
    if (lower.includes("rate limit")) return "Temporary sign-in issue. Please try again in a moment.";
    if (lower.includes("invalid login credentials")) return "Incorrect email or password.";
    return msg || "Sign-in failed. Please try again.";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const action =
      mode === "signup"
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });
    const { error } = await action;
    setBusy(false);
    if (error) {
      setMessage(normalizeAuthError(error.message));
      return;
    }
    onAuthed?.();
  };

  const onForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setMessage("Enter your email address first.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/`,
    });
    setBusy(false);
    if (error) setMessage(error.message);
    else setMessage("Check your inbox for a reset link.");
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
            ? "Sign in to manage workspace users and tool access."
            : "Sign in with your workspace identity (x1z10 P01)."}
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
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
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
          sub: "User directory and roles are stored on the Tool Hub identity project (x1z10 P01).",
        }
      : {
          title: "Sign in to Tool Hub.",
          sub: "One workspace login for tools in this ecosystem.",
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
