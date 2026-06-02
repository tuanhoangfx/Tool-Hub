/** Browser-extension postMessage contract for E0001-cookie-bridge (Tool Hub identity). */

export function broadcastExtensionIdentityAuth(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user?: { id?: string | null; email?: string | null };
}) {
  const supabase_url = import.meta.env.VITE_SUPABASE_URL as string;
  const supabase_anon_key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const detail = {
    type: "E0001_HUB_IDENTITY_AUTH",
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user_id: session.user?.id ?? null,
    user_email: session.user?.email ?? null,
    supabase_url,
    supabase_anon_key,
  };
  window.postMessage(detail, window.location.origin);
  document.dispatchEvent(new CustomEvent("e0001-hub-identity-auth", { detail }));
}
