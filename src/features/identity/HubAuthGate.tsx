import { HubAuthGate as HubAuthGateShell } from "@tool-workspace/hub-ui";
import { ToolAvatar } from "../../components/ToolAvatar";
import { toolIconName, toolSvgIcon } from "../../lib/visual";
import { supabase } from "../../lib/supabase";
import {
  canUseEmailPasswordRecovery,
  hubSessionLabels,
  resolveHubLogin,
} from "@tool-workspace/hub-identity";

type Props = {
  onAuthed?: () => void;
  variant?: "hub" | "users";
};

export { hubSessionLabels };

export function HubAuthGate({ onAuthed, variant = "hub" }: Props) {
  const copy =
    variant === "users"
      ? {
          title: "Sign in to manage workspace users.",
          sub: "User ID + password, or email if linked. Admins can add users and reset passwords.",
          modalSubtitle:
            "Sign in with User ID or email. Link email later for password recovery.",
        }
      : {
          title: "Sign in to Tool Hub.",
          sub: "User ID or email — one workspace login for tools in this ecosystem.",
          modalSubtitle: "Sign in with User ID or email (x1z10 P01).",
        };

  return (
    <HubAuthGateShell
      inlineTitle={copy.title}
      inlineSub={copy.sub}
      loginButtonLabel="Login"
      onAuthed={onAuthed}
      modal={{
        title: "Welcome to Tool Hub",
        subtitle: copy.modalSubtitle,
        showFieldHints: true,
        submitPlacement: "form",
        headerLeading: (
          <ToolAvatar
            code="P0004"
            iconName={toolIconName({ code: "P0004" })}
            svgSrc={toolSvgIcon({ code: "P0004" }) ?? undefined}
            size="md"
          />
        ),
        onSubmit: async (login, password, mode) => {
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
          if (error) return { error: error.message };
          if (mode === "signup" && resolved.loginId && data.user?.id) {
            await supabase
              .from("profiles")
              .update({
                login_id: resolved.loginId,
                updated_at: new Date().toISOString(),
              })
              .eq("id", data.user.id);
          }
        },
        onForgotPassword: async (login) => {
          const resolved = resolveHubLogin(login);
          if (!resolved.isEmailLogin || !canUseEmailPasswordRecovery(resolved.authEmail)) {
            return "Link your email in Account after sign-in, or ask an admin to reset your password.";
          }
          const { error } = await supabase.auth.resetPasswordForEmail(resolved.authEmail, {
            redirectTo: `${window.location.origin}/`,
          });
          if (error) return error.message;
          return "Check your inbox for a reset link.";
        },
      }}
    />
  );
}
