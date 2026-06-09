import { WorkspaceAuthGate, createWorkspaceAuthGate } from "@tool-workspace/hub-ui";
import { ToolAvatar } from "../../components/ToolAvatar";
import { toolIconName, toolSvgIcon } from "../../lib/visual";
import { supabase } from "../../lib/supabase";
import {
  hubSessionLabels,
  resolveHubLogin,
  signInWithHubPassword,
} from "@tool-workspace/hub-identity";

type Props = {
  onAuthed?: () => void;
  variant?: "hub" | "users";
};

export { hubSessionLabels };

export function HubAuthGate({ onAuthed, variant = "hub" }: Props) {
  return (
    <WorkspaceAuthGate
      {...createWorkspaceAuthGate({
        code: "P0004",
        variant,
        headerLeading: (
          <ToolAvatar
            code="P0004"
            iconName={toolIconName({ code: "P0004" })}
            svgSrc={toolSvgIcon({ code: "P0004" }) ?? undefined}
            size="sm"
          />
        ),
        onAuthed,
        onSubmit: async (login, password, mode) => {
          const resolved = resolveHubLogin(login);
          const attempt = (authEmail: string) =>
            mode === "signup"
              ? supabase.auth.signUp({
                  email: authEmail,
                  password,
                  options: {
                    data: {
                      full_name: resolved.loginId ?? authEmail.split("@")[0],
                      login_id: resolved.loginId ?? undefined,
                    },
                  },
                })
              : supabase.auth.signInWithPassword({ email: authEmail, password });

          const { data, error } = await signInWithHubPassword(login, attempt, mode);
          if (error) return { error: error.message };
          if (mode === "signup" && resolved.loginId && data?.user?.id) {
            await supabase
              .from("profiles")
              .update({
                login_id: resolved.loginId,
                updated_at: new Date().toISOString(),
              })
              .eq("id", data.user.id);
          }
        },
        forgotPassword: {
          isHubConfigured: () => true,
          resetPasswordForEmail: async (authEmail, redirectTo) =>
            supabase.auth.resetPasswordForEmail(authEmail, { redirectTo }),
        },
      })}
    />
  );
}
