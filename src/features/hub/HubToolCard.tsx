import {
  CalendarDays,
  FolderOpen,
  GitBranch,
  Tag,
  User2,
  type LucideIcon,
} from "lucide-react";
import {
  HubDirectoryCardCheckbox,
  HubDirectoryCardCornerRail,
  HubDirectoryCardPinButton,
  HubDirectoryInteractiveCard,
  compactIconSize,
} from "@tool-workspace/hub-ui";
import { auditManifestLinks } from "../overview/manifest-link-audit";
import { ToolAvatar } from "../../components/ToolAvatar";
import { deployLabel, folderName, formatDate, freshnessLabel, freshnessLevel } from "../../lib/tooling";
import {
  resolveDeployTargetIcon,
  resolveDriftChipIcon,
  resolveHealthStatusIcon,
  resolveLinkGapChipIcon,
} from "../../lib/badge-registry";
import { toolIconName, toolSvgIcon } from "../../lib/visual";
import type { ResolvedTool } from "../../types";
import type { HealthState } from "../../hooks/useLocalHealth";
import {
  CatalogVersionMeta,
  LinkManifestFooter,
  QuietChip,
  StaticPortChip,
  ToolCatalogLinkStrip,
  ToolCodeBadge,
  VersionSyncChip,
} from "./hub-tool-ui";
import { healthDotColor } from "./hub-tool-ui-utils";
import { resolveCatalogVersionSync } from "./tool-catalog-status";
import { HubSupabaseQuotaChip } from "./HubSupabaseQuotaChip";

const META: Record<string, { Icon: LucideIcon; tint: string }> = {
  summary: { Icon: User2, tint: "#38bdf8" },
  repo: { Icon: Tag, tint: "#a78bfa" },
  version: { Icon: GitBranch, tint: "#34d399" },
  folder: { Icon: FolderOpen, tint: "#fbbf24" },
  updated: { Icon: CalendarDays, tint: "#f472b6" },
};

type HubToolCardProps = {
  tool: ResolvedTool;
  quotaVersion: number;
  pinned: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOpen: (id: string) => void;
  linkHealth?: Record<string, HealthState>;
};

export function HubToolCard({
  tool,
  quotaVersion,
  pinned,
  selected,
  onToggleSelect,
  onTogglePin,
  onOpen,
  linkHealth,
}: HubToolCardProps) {
  const fresh = freshnessLevel(tool.updatedAt);
  const port = tool.localUrl ? tryPort(tool.localUrl) : null;
  const linkGaps = auditManifestLinks(tool);
  const versionSync = resolveCatalogVersionSync(tool);
  const statusDot = healthDotColor(tool, linkGaps.length);
  const healthLabel = tool.healthLabel || tool.status;

  return (
    <HubDirectoryInteractiveCard
      variant="grid"
      selected={selected}
      pinned={pinned}
      ariaLabel={`Open ${tool.name}`}
      onActivate={() => onOpen(tool.id)}
      className="group"
    >
      <HubDirectoryCardCornerRail>
        <HubDirectoryCardPinButton
          pinned={pinned}
          label={tool.name}
          onClick={() => onTogglePin(tool.id)}
        />
        <HubDirectoryCardCheckbox
          corner={false}
          checked={selected}
          label={`Select ${tool.name}`}
          onChange={() => onToggleSelect(tool.id)}
        />
      </HubDirectoryCardCornerRail>
      <div className="flex flex-1 flex-col p-4 pr-14">
        <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative shrink-0">
              <ToolAvatar
                code={tool.code}
                iconName={toolIconName(tool)}
                svgSrc={toolSvgIcon(tool) ?? undefined}
                size="sm"
              />
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-[var(--panel)]"
                style={{ background: statusDot }}
                title={
                  tool.driftAlerts[0] ??
                  (linkGaps.length > 0 ? linkGaps.map((g) => g.label).join(", ") : versionSync.syncNote)
                }
              />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                <ToolCodeBadge code={tool.code} category={tool.category} />
                <span className="min-w-0 line-clamp-2 text-sm font-medium leading-snug text-[var(--text)]">{tool.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-[var(--hub-card-meta-min-h)] shrink-0 space-y-1.5 text-xs text-[var(--muted)]">
          <MetaRow kind="summary">
            <span className="line-clamp-2">{tool.summary || tool.category || "—"}</span>
          </MetaRow>
          <MetaRow kind="repo">
            <span className="truncate">{tool.repo?.split("/")[1] ?? "—"}</span>
          </MetaRow>
          <MetaRow kind="version">
            <CatalogVersionMeta tool={tool} />
          </MetaRow>
          <MetaRow kind="folder">
            <span className="truncate">{tool.localPath ? folderName(tool.localPath) : "—"}</span>
          </MetaRow>
          <MetaRow kind="updated">
            {tool.updatedAt ? (
              <>
                <span>{formatDate(tool.updatedAt)}</span>
                <span className={`ml-1 text-[10px] font-medium freshness-${fresh}`}>
                  ({freshnessLabel(fresh, tool.updatedAt)})
                </span>
              </>
            ) : (
              <span>—</span>
            )}
          </MetaRow>
        </div>

        <div className="mt-auto shrink-0 pt-3">
          <div className="flex min-h-[var(--hub-card-chip-row-min-h)] flex-wrap items-center gap-1.5">
            <QuietChip label={healthLabel} tone="ok" iconMeta={resolveHealthStatusIcon(healthLabel)} />
            <QuietChip
              label={deployLabel(tool.deployTarget)}
              tone="neutral"
              iconMeta={resolveDeployTargetIcon(tool.deployTarget)}
              title={tool.appUrl ? `Deploy: ${deployLabel(tool.deployTarget)} · ${tool.appUrl}` : deployLabel(tool.deployTarget)}
            />
            {port ? <StaticPortChip port={port} localUrl={tool.localUrl} /> : null}
            <VersionSyncChip
              syncStatus={versionSync.syncStatus}
              title={versionSync.syncNote}
              showAligned={tool.remoteEnabled !== false && Boolean(tool.remote)}
            />
            {tool.driftAlerts.length > 0 ? (
              <QuietChip
                label={`${tool.driftAlerts.length} drift`}
                tone="bad"
                iconMeta={resolveDriftChipIcon()}
                title={tool.driftAlerts.join("\n")}
              />
            ) : null}
            {linkGaps.length > 0 ? (
              <QuietChip
                label={`${linkGaps.length} link gap${linkGaps.length > 1 ? "s" : ""}`}
                tone="warn"
                title={linkGaps.map((g) => g.label).join(", ")}
                iconMeta={resolveLinkGapChipIcon()}
              />
            ) : null}
            <HubSupabaseQuotaChip toolCode={tool.code} quotaVersion={quotaVersion} />
          </div>
          <div className="mt-2 shrink-0">
            <ToolCatalogLinkStrip tool={tool} linkGaps={linkGaps} size="sm" linkHealth={linkHealth} />
          </div>
          <LinkManifestFooter linkGaps={linkGaps} />
        </div>
      </div>
    </HubDirectoryInteractiveCard>
  );
}

function MetaRow({ kind, children }: { kind: keyof typeof META; children: React.ReactNode }) {
  const { Icon, tint } = META[kind];
  return (
    <div className="flex items-center gap-2">
      <Icon size={compactIconSize(12)} className="shrink-0" strokeWidth={2} style={{ color: tint, opacity: 0.72 }} />
      <div className="min-w-0 flex-1 truncate">{children}</div>
    </div>
  );
}

function tryPort(url: string) {
  try {
    return new URL(url).port || null;
  } catch {
    return null;
  }
}
