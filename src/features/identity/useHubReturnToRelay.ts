import { useEffect, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../../lib/supabase";

function readReturnTo(): string | null {
  const value = new URLSearchParams(window.location.search).get("returnTo");
  return value?.trim() || null;
}

/** After Hub login, relay identity to P0020 opener when `?returnTo=` is set. */
export function useHubReturnToRelay(session: Session | null) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (!session || !isSupabaseConfigured || sentRef.current) return;

    const returnTo = readReturnTo();
    if (!returnTo) return;

    let target: URL;
    try {
      target = new URL(returnTo);
    } catch {
      return;
    }

    if (!window.opener || window.opener === window) return;

    const payload = {
      type: "P0004_HUB_IDENTITY_SESSION",
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user_id: session.user?.id ?? null,
      user_email: session.user?.email ?? null,
      supabase_url: import.meta.env.VITE_SUPABASE_URL as string,
      supabase_anon_key: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    };

    try {
      window.opener.postMessage(payload, target.origin);
      sentRef.current = true;
      const p = new URLSearchParams(window.location.search);
      p.delete("returnTo");
      const qs = p.toString();
      const path = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState(null, "", path);
    } catch {
      /* cross-origin or closed opener */
    }
  }, [session]);
}
