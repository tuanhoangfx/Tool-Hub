import { useEffect, useState } from "react";
import {
  SUPABASE_QUOTA_REFRESH_EVENT,
  SUPABASE_QUOTA_UPDATED_EVENT,
} from "../system-hub/supabase-quota-events";
import { resolveQuotaHeadlineStatus } from "../system-hub/supabase-quota-budget";
import { resolveHealthStatusIcon } from "../../lib/badge-registry";
import { resolveProjectMetricsSource } from "../system-hub/supabase-project-metrics-source";
import { QuietChip } from "./hub-tool-ui";
import { findQuotaContextForTool } from "./hub-quota-lookup";

type HubSupabaseQuotaChipProps = {
  toolCode: string;
};

/** Tier C — quota status chip on Hub tool cards (Restricted / DB % / Quota OK). */
export function HubSupabaseQuotaChip({ toolCode }: HubSupabaseQuotaChipProps) {
  const [, bump] = useState(0);
  useEffect(() => {
    const onUpdate = () => bump((n) => n + 1);
    window.addEventListener(SUPABASE_QUOTA_UPDATED_EVENT, onUpdate);
    window.addEventListener(SUPABASE_QUOTA_REFRESH_EVENT, onUpdate);
    return () => {
      window.removeEventListener(SUPABASE_QUOTA_UPDATED_EVENT, onUpdate);
      window.removeEventListener(SUPABASE_QUOTA_REFRESH_EVENT, onUpdate);
    };
  }, []);

  const ctx = findQuotaContextForTool(toolCode);
  if (!ctx) return null;

  const { project, org } = ctx;
  if (resolveProjectMetricsSource(project) !== "live") return null;

  const headline = resolveQuotaHeadlineStatus(project, org);
  if (headline.status === "unknown") return null;

  const tone =
    headline.status === "restricted" || headline.status === "critical"
      ? "bad"
      : headline.status === "warn"
        ? "warn"
        : "ok";

  return (
    <QuietChip
      label={headline.label}
      tone={tone}
      title={headline.title}
      iconMeta={resolveHealthStatusIcon(headline.status === "restricted" ? "Restricted" : headline.label)}
    />
  );
}
