import { useEffect, useState } from "react";
import {
  SUPABASE_QUOTA_REFRESH_EVENT,
  SUPABASE_QUOTA_UPDATED_EVENT,
} from "../features/system-hub/supabase-quota-events";

/** Single Hub-wide subscription for quota cache updates (avoids per-card listeners). */
export function useSupabaseQuotaVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((n) => n + 1);
    window.addEventListener(SUPABASE_QUOTA_UPDATED_EVENT, bump);
    window.addEventListener(SUPABASE_QUOTA_REFRESH_EVENT, bump);
    return () => {
      window.removeEventListener(SUPABASE_QUOTA_UPDATED_EVENT, bump);
      window.removeEventListener(SUPABASE_QUOTA_REFRESH_EVENT, bump);
    };
  }, []);
  return version;
}
