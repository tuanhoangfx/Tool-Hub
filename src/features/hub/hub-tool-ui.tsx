import { CheckCircle2 } from "lucide-react";
import { MetricBadge } from "../../components/sales-shell/MetricBadge";
import type { FilterIconMeta } from "../../lib/badge-registry";
import { resolveCategoryDisplayIcon, resolveLinkGapChipIcon } from "../../lib/badge-registry";
import type { HealthState } from "../../hooks/useLocalHealth";
import type { ResolvedTool } from "../../types";
import type { ManifestLinkGap } from "../overview/manifest-link-audit";

export type ToolCategoryKind = "web" | "bot" | "desktop" | "other";

const CATEGORY_BADGE: Record<ToolCategoryKind, string> = {
  web: "border-cyan-400/35 bg-cyan-500/12 text-cyan-200",
  bot: "border-violet-400/35 bg-violet-500/12 text-violet-200",
  desktop: "border-amber-400/35 bg-amber-500/12 text-amber-200",
  other: "border-slate-400/30 bg-slate-500/10 text-slate-300",
};

export function normalizeToolCategory(category: string): ToolCategoryKind {
  const c = category.trim().toLowerCase();
  if (c === "bot" || c.startsWith("bot")) return "bot";
  if (c === "desktop" || c.includes("desktop") || c.includes("electron")) return "desktop";
  if (c === "web" || c.startsWith("web")) return "web";
  return "other";
}

export function toolCodeBadgeClass(category: string): string {
  return CATEGORY_BADGE[normalizeToolCategory(category)];
}

export function ToolCodeBadge({ code, category }: { code: string; category: string }) {
  return (
    <MetricBadge
      label={code}
      iconMeta={resolveCategoryDisplayIcon(category)}
      mono
      variantClass={toolCodeBadgeClass(category)}
    />
  );
}

export type QuietChipTone = import("../../components/sales-shell/MetricBadge").MetricBadgeTone;

export function QuietChip({
  label,
  tone,
  title,
  iconMeta,
}: {
  label: string;
  tone: QuietChipTone;
  title?: string;
  iconMeta?: FilterIconMeta | null;
}) {
  return <MetricBadge label={label} tone={tone} title={title} iconMeta={iconMeta} />;
}

export function healthDotColor(
  tool: Pick<ResolvedTool, "driftAlerts">,
  healthState: HealthState | undefined,
  linkGapCount: number,
): string {
  if (tool.driftAlerts.length > 0) return "#f43f5e";
  if (linkGapCount > 0) return "#f59e0b";
  if (healthState === "online") return "#22c55e";
  return "#64748b";
}

/** Fixed-height footer row so cards align with or without link gaps. */
export function LinkManifestFooter({ linkGaps }: { linkGaps: ManifestLinkGap[] }) {
  const linkGapIcon = resolveLinkGapChipIcon();
  const LinkGapIcon = linkGapIcon.icon;

  return (
    <div className="mt-2 h-8 shrink-0 overflow-hidden">
      {linkGaps.length > 0 ? (
        <p className="flex items-start gap-1 text-[10px] leading-snug text-amber-200/90">
          <LinkGapIcon size={10} className={`mt-0.5 shrink-0 ${linkGapIcon.className}`} aria-hidden />
          <span className="line-clamp-2 min-w-0">
            Missing: {linkGaps.map((g) => g.label).join(", ")}
          </span>
        </p>
      ) : (
        <p className="flex items-center gap-1 text-[10px] leading-snug text-emerald-200/65">
          <CheckCircle2 size={10} className="shrink-0 text-emerald-400" aria-hidden />
          <span className="truncate">Full manifest links</span>
        </p>
      )}
    </div>
  );
}
