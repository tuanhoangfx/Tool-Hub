import {
  CalendarDays,
  FolderOpen,
  GitBranch,
  Pencil,
  Tag,
  User2,
  type LucideIcon,
} from "lucide-react";
import { auditManifestLinks } from "../overview/manifest-link-audit";
import { ToolAvatar } from "../../components/ToolAvatar";
import type { HealthState } from "../../hooks/useLocalHealth";
import { deployLabel, folderName, formatDate, freshnessLabel, freshnessLevel } from "../../lib/tooling";
import {
  resolveDeployTargetIcon,
  resolveDriftChipIcon,
  resolveHealthStatusIcon,
  resolveLinkGapChipIcon,
  resolveLocalPortIcon,
} from "../../lib/badge-registry";
import { toolIconName, toolSvgIcon } from "../../lib/visual";
import type { ResolvedTool } from "../../types";
import {
  LinkManifestFooter,
  QuietChip,
  ToolCodeBadge,
} from "./hub-tool-ui";
import { healthDotColor } from "./hub-tool-ui-utils";
import { HubSupabaseQuotaChip } from "./HubSupabaseQuotaChip";
import { HubSupabaseQuotaHint } from "./HubSupabaseQuotaHint";
import { compactIconSize } from "../../lib/ui-scale";

const META: Record<string, { Icon: LucideIcon; tint: string }> = {
  summary: { Icon: User2, tint: "#38bdf8" },
  repo: { Icon: Tag, tint: "#a78bfa" },
  version: { Icon: GitBranch, tint: "#34d399" },
  folder: { Icon: FolderOpen, tint: "#fbbf24" },
  updated: { Icon: CalendarDays, tint: "#f472b6" },
};

type HubToolCardProps = {
  tool: ResolvedTool;
  healthState?: HealthState;
  onOpen: (id: string) => void;
};

export function HubToolCard({ tool, healthState, onOpen }: HubToolCardProps) {
  const fresh = freshnessLevel(tool.updatedAt);
  const port = tool.localUrl ? tryPort(tool.localUrl) : null;
  const linkGaps = auditManifestLinks(tool);
  const statusDot = healthDotColor(tool, healthState, linkGaps.length);
  const healthLabel = tool.healthLabel || tool.status;

  return (
    <button
      type="button"
      onClick={() => onOpen(tool.id)}
      className="group flex h-full min-h-[var(--hub-card-min-h)] w-full flex-col rounded-xl border border-white/5 bg-[var(--panel)] p-4 text-left transition-[border-color,box-shadow,background-color] duration-200 hover:border-indigo-500/40 hover:bg-white/[0.02] hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]"
    >
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
              title={tool.healthLabel || tool.status}
            />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
              <ToolCodeBadge code={tool.code} category={tool.category} />
              <span className="min-w-0 line-clamp-2 text-sm font-medium leading-snug text-[var(--text)]">{tool.name}</span>
            </div>
          </div>
        </div>
        <Pencil size={compactIconSize(14)} className="shrink-0 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="min-h-[var(--hub-card-meta-min-h)] shrink-0 space-y-1.5 text-xs text-[var(--muted)]">
        <MetaRow kind="summary">
          <span className="line-clamp-2">{tool.summary || tool.category || "—"}</span>
        </MetaRow>
        <MetaRow kind="repo">
          <span className="truncate">{tool.repo?.split("/")[1] ?? "—"}</span>
        </MetaRow>
        <MetaRow kind="version">
          <span className="font-medium text-[var(--text)]">v{tool.version}</span>
          {tool.branch ? <span className="ml-1 text-[10px]">· {tool.branch}</span> : null}
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
          />
          {port ? (
            <QuietChip
              label={
                healthState === "online"
                  ? `:${port} live`
                  : healthState === "offline"
                    ? `:${port} down`
                    : healthState === "checking"
                      ? `:${port} …`
                      : `:${port}`
              }
              tone={healthState === "online" ? "ok" : healthState === "offline" ? "bad" : "neutral"}
              iconMeta={resolveLocalPortIcon(healthState === "online")}
            />
          ) : null}
          {tool.driftAlerts.length > 0 ? (
            <QuietChip
              label={`${tool.driftAlerts.length} drift`}
              tone="bad"
              iconMeta={resolveDriftChipIcon()}
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
          <HubSupabaseQuotaChip toolCode={tool.code} />
        </div>
        <HubSupabaseQuotaHint toolCode={tool.code} />
        <LinkManifestFooter linkGaps={linkGaps} />
      </div>
    </button>
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
