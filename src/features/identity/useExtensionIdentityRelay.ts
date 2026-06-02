import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import { broadcastExtensionIdentityAuth } from "./extensionBridgeMessages";

const HEARTBEAT_MS = 30 * 60 * 1000;

/** Push Tool Hub (x1z10) identity JWT to E0001 while Hub is open. */
export function useExtensionIdentityRelay(session: Session | null) {
  useEffect(() => {
    if (!session || !isSupabaseConfigured) return;

    const push = async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      if (!s) return;
      broadcastExtensionIdentityAuth({
        access_token: s.access_token,
        refresh_token: s.refresh_token,
        expires_at: s.expires_at,
        user: s.user,
      });
    };

    void push();
    const id = window.setInterval(() => void push(), HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [session]);
}
