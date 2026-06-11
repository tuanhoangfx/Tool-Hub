import { Database, Radio } from "lucide-react";
import { compactIconSize } from "@tool-workspace/hub-ui";
import {
  metricsSourceTitle,
  type ProjectMetricsSource,
} from "./supabase-project-metrics-source";

type SupabaseMetricsSourceBadgeProps = {
  source: ProjectMetricsSource;
  /** Table cells use compact pill without QuietChip wrapper. */
  variant?: "chip" | "pill";
  className?: string;
};

export function SupabaseMetricsSourceBadge({
  source,
  variant = "chip",
  className = "",
}: SupabaseMetricsSourceBadgeProps) {
  const label = source === "live" ? "Live" : "Catalog";
  const title = metricsSourceTitle(source);
  const Icon = source === "live" ? Radio : Database;

  if (variant === "pill") {
    const tone =
      source === "live"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
        : "border-slate-500/30 bg-slate-500/10 text-slate-300";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone} ${className}`}
        title={title}
      >
        <Icon size={compactIconSize(10)} className="shrink-0 opacity-80" aria-hidden />
        {label}
      </span>
    );
  }

  const tone =
    source === "live"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
      : "border-slate-500/25 bg-slate-500/10 text-slate-300";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone} ${className}`}
      title={title}
    >
      <Icon size={compactIconSize(10)} className="shrink-0 opacity-75" aria-hidden />
      {label}
    </span>
  );
}
