import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  cacheHubIdentity,
  clearHubIdentity,
  readHubIdentity,
  snapshotFromSupabaseSession,
  subscribeHubIdentity,
} from "@tool-workspace/hub-identity";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

const HUB_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
const HUB_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";

function syncHubIdentityCache(session: Session | null) {
  if (!HUB_URL || !HUB_ANON) return;
  if (session?.access_token) {
    cacheHubIdentity(snapshotFromSupabaseSession(session, HUB_URL, HUB_ANON), "p0004");
    return;
  }
  clearHubIdentity("p0004");
}

/** Restore P0004 session from shared x1z10 hub cache (e.g. signed in on P0016 first). */
async function restoreSessionFromHubCache(): Promise<Session | null> {
  const snap = readHubIdentity();
  if (!snap?.access_token?.trim()) return null;
  const snapUrl = snap.supabase_url?.trim().replace(/\/$/, "");
  if (snapUrl && HUB_URL && snapUrl !== HUB_URL.replace(/\/$/, "")) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token: snap.access_token,
    refresh_token: snap.refresh_token || "",
  });
  if (error || !data.session) return null;
  syncHubIdentityCache(data.session);
  return data.session;
}

export function useHubAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const { data: { session: live } } = await supabase.auth.getSession();
      let resolved = live;
      if (!resolved) {
        resolved = await restoreSessionFromHubCache();
      }
      if (!cancelled) {
        setSession(resolved);
        if (resolved) syncHubIdentityCache(resolved);
        setLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (cancelled) return;
      if (!s && event === "INITIAL_SESSION") return;
      setSession(s);
      syncHubIdentityCache(s);
    });

    const unsubCache = subscribeHubIdentity(() => {
      if (cancelled) return;
      void (async () => {
        const { data: { session: live } } = await supabase.auth.getSession();
        if (live) {
          if (!cancelled) setSession(live);
          return;
        }
        const restored = await restoreSessionFromHubCache();
        if (!cancelled) setSession(restored);
      })();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      unsubCache();
    };
  }, []);

  return { session, loading, isSupabaseConfigured };
}
