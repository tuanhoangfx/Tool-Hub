import { resolveQuotaHeadlineStatus } from "../system-hub/supabase-quota-budget";
import { resolveHealthStatusIcon } from "../../lib/badge-registry";
import { resolveProjectMetricsSource } from "../system-hub/supabase-project-metrics-source";
import { QuietChip } from "./hub-tool-ui";
import { findQuotaContextForTool } from "./hub-quota-lookup";

type HubSupabaseQuotaChipProps = {
  toolCode: string;
  /** Bump when quota client cache changes (one Hub-level listener). */
  quotaVersion: number;
};

/** Alert-only chip on Hub cards — full metrics live in System → Supabase Quota. */
export function HubSupabaseQuotaChip({ toolCode, quotaVersion }: HubSupabaseQuotaChipProps) {
  void quotaVersion;
  const ctx = findQuotaContextForTool(toolCode);
  if (!ctx) return null;

  const { project, org } = ctx;
  if (resolveProjectMetricsSource(project) !== "live") return null;

  const headline = resolveQuotaHeadlineStatus(project, org);
  if (headline.status === "unknown" || headline.status === "ok") return null;

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
