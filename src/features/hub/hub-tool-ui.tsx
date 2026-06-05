import { CheckCircle2 } from "lucide-react";
import { MetricBadge } from "../../components/sales-shell/MetricBadge";
import type { FilterIconMeta } from "../../lib/badge-registry";
import { resolveCategoryDisplayIcon, resolveLinkGapChipIcon } from "../../lib/badge-registry";
import { compactIconSize } from "../../lib/ui-scale";
import type { ManifestLinkGap } from "../overview/manifest-link-audit";
import { toolCodeBadgeClass } from "./hub-tool-ui-utils";

export function ToolCodeBadge({
  code,
  category,
  title,
}: {
  code: string;
  category: string;
  title?: string;
}) {
  return (
    <MetricBadge
      label={code}
      iconMeta={resolveCategoryDisplayIcon(category)}
      mono
      variantClass={toolCodeBadgeClass(category)}
      title={title}
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

/** Manifest link audit — table cell or card footer. */
export function LinkManifestFooter({
  linkGaps,
  variant = "card",
}: {
  linkGaps: ManifestLinkGap[];
  variant?: "card" | "table";
}) {
  const linkGapIcon = resolveLinkGapChipIcon();
  const LinkGapIcon = linkGapIcon.icon;
  const wrapClass =
    variant === "table" ? "min-w-0 text-left" : "mt-2 h-8 shrink-0 overflow-hidden";

  return (
    <div className={wrapClass}>
      {linkGaps.length > 0 ? (
        <p className="flex items-start gap-1 text-[10px] leading-snug text-amber-200/90">
          <LinkGapIcon size={compactIconSize(10)} className={`mt-0.5 shrink-0 ${linkGapIcon.className}`} aria-hidden />
          <span className="line-clamp-2 min-w-0">
            Missing: {linkGaps.map((g) => g.label).join(", ")}
          </span>
        </p>
      ) : (
        <p className="flex items-center gap-1 text-[10px] leading-snug text-emerald-200/65">
          <CheckCircle2 size={compactIconSize(10)} className="shrink-0 text-emerald-400" aria-hidden />
          <span className="truncate">Full manifest links</span>
        </p>
      )}
    </div>
  );
}
