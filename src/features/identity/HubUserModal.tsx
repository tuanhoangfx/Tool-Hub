import { useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { canUseEmailPasswordRecovery, hubSessionLabels } from "@tool-workspace/hub-identity";
import { HubFullUserAccountModal } from "@tool-workspace/hub-ui";
import { HubAlertDialog } from "../../components/HubAlertDialog";
import { supabase } from "../../lib/supabase";
import { hubRoleLabel, hubUserInitials, parseHubRole } from "./hubUserDisplay";
import { fetchCurrentProfileRole } from "./userManagementRepository";

type Props = {
  open: boolean;
  onClose: () => void;
  session: Session | null;
};

/** P0004 user menu — golden shell via HubFullUserAccountModal (HubToolDetailModal · hub-header-panel-modal · TOC). */
export function HubUserModal({ open, onClose, session }: Props) {
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const labels = hubSessionLabels(session);
  const user = session?.user ?? null;
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

  const fallbackRole = String(user?.app_metadata?.role ?? user?.user_metadata?.role ?? "authenticated");

  return (
    <>
      <HubFullUserAccountModal
        open={open}
        onClose={onClose}
        session={session}
        initials={initials}
        roleLabel={hubRoleLabel(parseHubRole(fallbackRole))}
        onResolveRole={async (userId) => {
          const role = await fetchCurrentProfileRole(userId);
          return role ? hubRoleLabel(parseHubRole(role)) : null;
        }}
        onLinkEmail={async (email) => {
          if (!email || !email.includes("@")) {
            return { ok: false, message: "Enter a valid email address." };
          }
          const { error } = await supabase.auth.updateUser({ email });
          if (!error) {
            await supabase
              .from("profiles")
              .update({ contact_email: email, email, updated_at: new Date().toISOString() })
              .eq("id", user?.id ?? "");
          }
          if (error) return { ok: false, message: error.message };
          return {
            ok: true,
            message: labels.hasSyntheticAuth
              ? "Confirmation sent to that address. Open the link, then sign in with email + password."
              : "Confirmation sent. Check your inbox to confirm the new address.",
          };
        }}
        onSendOtp={async (email) => {
          if (!canUseEmailPasswordRecovery(email)) {
            return { ok: false, message: "Link an email first, then use it here." };
          }
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false },
          });
          if (error) return { ok: false, message: error.message };
          return { ok: true, message: "Enter the 6-digit code from your email." };
        }}
        onConfirmPassword={async (email, code, password) => {
          if (!code || password.length < 6) {
            return { ok: false, message: "Enter the email code and a password (min 6 characters)." };
          }
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: "email",
          });
          if (verifyErr) return { ok: false, message: verifyErr.message };
          const { error: pwdErr } = await supabase.auth.updateUser({ password });
          if (pwdErr) return { ok: false, message: pwdErr.message };
          return { ok: true, message: "Password updated." };
        }}
        onSignOut={async () => {
          const { error } = await supabase.auth.signOut();
          if (error) return { ok: false, message: error.message };
          return { ok: true, message: "" };
        }}
        onSignOutError={(title, message) => {
          setAlertTitle(title);
          setAlertMessage(message);
          setAlertOpen(true);
        }}
      />
      <HubAlertDialog
        open={alertOpen}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />
    </>
  );
}
