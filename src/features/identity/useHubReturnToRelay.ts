import type { Session } from "@supabase/supabase-js";
import { useHubReturnToRelay as relayHubSessionToOpener } from "@tool-workspace/hub-identity";
import { isSupabaseConfigured } from "../../lib/supabase";

const HUB_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
const HUB_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";

/** After Hub login, relay identity to workspace opener when `?returnTo=` is set. */
export function useHubReturnToRelay(session: Session | null) {
  relayHubSessionToOpener({
    session,
    enabled: isSupabaseConfigured,
    supabaseUrl: HUB_URL,
    supabaseAnonKey: HUB_ANON,
  });
}
