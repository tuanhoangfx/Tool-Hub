import { useMemo, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { MaterialIcon } from "../../components";
import { MetricBadge, RegistryMetricBadge } from "../../components/sales-shell";
import type { FilterIconMeta } from "../../lib/badge-registry";
import { resolveCategoryDisplayIcon, resolveLinkGapChipIcon, resolveLocalPortIcon } from "../../lib/badge-registry";
import { resolveVersionSyncBadge } from "../../lib/version-badges";
import { compactIconSize } from "@tool-workspace/hub-ui";
import { folderName } from "../../lib/tooling";
import type { HealthState } from "../../hooks/useLocalHealth";
import type { ManifestLinkGap } from "../overview/manifest-link-audit";
import type { ResolvedTool } from "../../types";
import { resolveCatalogVersionSync, resolveToolLinkSlots, type ToolLinkSlot } from "./tool-catalog-status";
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

/** Static local port badge — manifest port only (no live/down probe on catalog cards). */
export function StaticPortChip({ port, localUrl }: { port: string; localUrl?: string }) {
  return (
    <QuietChip
      label={`:${port}`}
      tone="neutral"
      title={localUrl ? `Local dev: ${localUrl}` : `Port :${port}`}
      iconMeta={resolveLocalPortIcon(false)}
    />
  );
}

const LINK_ICON: Record<ToolLinkSlot, string> = {
  app: "public",
  local: "dns",
  github: "hub",
  folder: "folder",
};

const LINK_TONE: Record<ToolLinkSlot, string> = {
  app: "tone-app",
  local: "tone-local",
  github: "",
  folder: "",
};

function LinkReachabilityWrap({
  href,
  health,
  children,
}: {
  href?: string;
  health?: Record<string, HealthState>;
  children: ReactNode;
}) {
  const state = href ? health?.[href] : undefined;
  if (!state || state === "unknown") return <>{children}</>;

  const label =
    state === "online" ? "Reachable" : state === "offline" ? "Unreachable" : "Checking…";
  const toneClass =
    state === "online"
      ? "link-health-online"
      : state === "offline"
        ? "link-health-offline"
        : "link-health-checking";

  return (
    <span className={`link-health-wrap ${toneClass}`} title={href ? `${label}: ${href}` : label}>
      {children}
      <span className="link-health-dot" aria-hidden />
    </span>
  );
}

/** Catalog version line — registry, GitHub, local drift (no port probe). */
export function CatalogVersionMeta({ tool }: { tool: ResolvedTool }) {
  const versionSync = resolveCatalogVersionSync(tool);
  const showGithub =
    versionSync.githubVersion &&
    versionSync.syncStatus !== "current" &&
    versionSync.githubVersion !== versionSync.displayVersion;
  const showLocalDrift =
    versionSync.localVersion &&
    versionSync.syncStatus !== "synced" &&
    versionSync.syncStatus !== "current";

  return (
    <>
      <span className="font-medium text-[var(--text)]">v{versionSync.displayVersion}</span>
      {tool.branch ? <span className="ml-1 text-[10px]">· {tool.branch}</span> : null}
      {showGithub ? (
        <span className="ml-1 text-[10px] text-violet-200/85" title="GitHub registry version">
          · GH v{versionSync.githubVersion}
        </span>
      ) : null}
      {showLocalDrift ? (
        <span className="ml-1 text-[10px] text-amber-200/90" title={versionSync.syncNote}>
          · local v{versionSync.localVersion}
        </span>
      ) : null}
    </>
  );
}

/** Catalog link strip — VPS/local/GitHub/folder configured vs gap; optional reachability overlay. */
export function ToolCatalogLinkStrip({
  tool,
  linkGaps,
  onCopyPath,
  size = "md",
  linkHealth,
}: {
  tool: ResolvedTool;
  linkGaps: ManifestLinkGap[];
  onCopyPath?: (path: string) => void;
  size?: "sm" | "md";
  linkHealth?: Record<string, HealthState>;
}) {
  const gapKeys = useMemo(() => new Set(linkGaps.map((g) => g.key)), [linkGaps]);
  const slots = useMemo(() => resolveToolLinkSlots(tool, gapKeys), [tool, gapKeys]);
  const iconSize = size === "sm" ? compactIconSize(14) : compactIconSize(16);

  return (
    <div
      className="link-row flex flex-wrap items-center gap-0.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {slots.map((slot) => {
        const tone = LINK_TONE[slot.key];
        const gapClass = slot.configured ? "link-configured" : "link-gap";
        const className = `icon-link ${tone} ${gapClass}`.trim();

        if (slot.key === "folder") {
          if (!tool.localPath) {
            return (
              <span key={slot.key} className={className} title={slot.title} aria-hidden>
                <MaterialIcon name={LINK_ICON.folder} size={iconSize} />
              </span>
            );
          }
          return (
            <button
              key={slot.key}
              type="button"
              className={className}
              title={`${folderName(tool.localPath)} — copy path`}
              onClick={() => onCopyPath?.(tool.localPath)}
            >
              <MaterialIcon name={LINK_ICON.folder} size={iconSize} />
            </button>
          );
        }

        if (slot.href && slot.configured) {
          const probeable = slot.key === "app" || slot.key === "local";
          const linkNode = (
            <a className={className} href={slot.href} target="_blank" rel="noreferrer" title={slot.title}>
              <MaterialIcon name={LINK_ICON[slot.key]} size={iconSize} />
            </a>
          );
          return (
            <span key={slot.key} className="inline-flex">
              {probeable ? (
                <LinkReachabilityWrap href={slot.href} health={linkHealth}>
                  {linkNode}
                </LinkReachabilityWrap>
              ) : (
                linkNode
              )}
            </span>
          );
        }

        return (
          <span key={slot.key} className={className} title={slot.title} aria-label={slot.gapLabel}>
            <MaterialIcon name={LINK_ICON[slot.key]} size={iconSize} />
          </span>
        );
      })}
    </div>
  );
}

export function VersionSyncChip({
  syncStatus,
  title,
  showAligned = false,
}: {
  syncStatus: import("../overview/tool-versions").VersionSyncStatus;
  title?: string;
  /** When true, show Synced/Current badge — not only drift states. */
  showAligned?: boolean;
}) {
  if (!showAligned && (syncStatus === "synced" || syncStatus === "current" || syncStatus === "history")) {
    return null;
  }
  return (
    <span title={title}>
      <RegistryMetricBadge spec={resolveVersionSyncBadge(syncStatus)} className="text-[9px]" />
    </span>
  );
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
