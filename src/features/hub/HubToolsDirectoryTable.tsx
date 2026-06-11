import {
  HubDirectoryTableShell,
  type HubSortDir,
  type HubTableColumnRole,
  compactIconSize,
} from "@tool-workspace/hub-ui";
import { ToolAvatar } from "../../components/ToolAvatar";
import { auditManifestLinks } from "../overview/manifest-link-audit";
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
import { resolveCatalogVersionSync } from "./tool-catalog-status";
import { healthDotColor } from "./hub-tool-ui-utils";
import { formatDate, freshnessLabel, freshnessLevel } from "../../lib/tooling";
import {
  resolveDriftChipIcon,
  resolveDriftCleanIcon,
  resolveHealthStatusIcon,
  resolveLocalOnlyIcon,
} from "../../lib/badge-registry";

import { toolIconName, toolSvgIcon } from "../../lib/visual";
import type { ResolvedTool } from "../../types";

export type HubTableSortKey = "code" | "name" | "version" | "status" | "drift" | "updated";

type ColumnDef = {
  key: HubTableSortKey;
  label: string;
  colClass: string;
  role: HubTableColumnRole;
};

const COLUMNS: ColumnDef[] = [
  { key: "code", label: "Code", colClass: "hub-users-col--hub-code", role: "code" },
  { key: "name", label: "Project", colClass: "hub-users-col--hub-project", role: "name" },
  { key: "version", label: "Version", colClass: "hub-users-col--hub-version", role: "version" },
  { key: "status", label: "Status", colClass: "hub-users-col--hub-status", role: "status" },
  { key: "drift", label: "Drift", colClass: "hub-users-col--hub-drift", role: "drift" },
  { key: "updated", label: "Updated", colClass: "hub-users-col--hub-updated", role: "updated" },
];

const HUB_TOOLS_COLGROUP = (
  <colgroup>
    <col className="hub-users-col--select" />
    <col className="hub-users-col--hub-code" />
    <col className="hub-users-col--hub-project" />
    <col className="hub-users-col--hub-version" />
    <col className="hub-users-col--hub-status" />
    <col className="hub-users-col--hub-drift" />
    <col className="hub-users-col--hub-updated" />
    <col className="hub-users-col--hub-manifest" />
    <col className="hub-users-col--hub-links" />
  </colgroup>
);

function tryPort(url: string) {
  try {
    return new URL(url).port || null;
  } catch {
    return null;
  }
}

export function sortableHubToolValue(tool: ResolvedTool, key: HubTableSortKey): string | number {
  switch (key) {
    case "code":
      return tool.code;
    case "name":
      return tool.name;
    case "version":
      return tool.version;
    case "status":
      return tool.healthLabel || tool.status;
    case "drift":
      return tool.driftAlerts.length;
    case "updated":
      return tool.updatedAt ? new Date(tool.updatedAt).getTime() : 0;
    default:
      return "";
  }
}

export function HubToolsDirectoryTable({
  tools,
  sortKey,
  sortDir,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allVisibleSelected,
  detailToolId,
  onSelect,
  onCopyPath,
  linkHealth,
  resetKey,
}: {
  tools: ResolvedTool[];
  sortKey: HubTableSortKey;
  sortDir: HubSortDir;
  onSort: (key: HubTableSortKey) => void;
  selectedIds: Set<string>;
  onToggleSelect: (toolId: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  detailToolId: string | null;
  onSelect: (id: string) => void;
  onCopyPath: (path: string) => void;
  linkHealth?: Record<string, HealthState>;
  resetKey?: string | number | boolean | null;
}) {
  const driftWarn = resolveDriftChipIcon();
  const driftOk = resolveDriftCleanIcon();
  const DriftWarnIcon = driftWarn.icon;
  const DriftOkIcon = driftOk.icon;

  return (
    <HubDirectoryTableShell
      items={tools}
      ariaLabel="Tools table pages"
      tableClassName="hub-users-table hub-users-table--hub-tools"
      colgroup={HUB_TOOLS_COLGROUP}
      columns={COLUMNS}
      staticColumns={[
        { label: "Manifest", role: "manifest", colClass: "hub-users-col--hub-manifest" },
        { label: "Links", role: "links", colClass: "hub-users-col--hub-links" },
      ]}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      getRowKey={(tool) => tool.id}
      onRowClick={(tool) => onSelect(tool.id)}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      onToggleSelectAll={onToggleSelectAll}
      allVisibleSelected={allVisibleSelected}
      selectAllLabel="Select all visible tools"
      resetKey={resetKey}
      getRowClassName={(tool) => (detailToolId === tool.id ? " is-detail" : "")}
      renderRowCells={(tool) => {
        const fresh = freshnessLevel(tool.updatedAt);
        const linkGaps = auditManifestLinks(tool);
        const versionSync = resolveCatalogVersionSync(tool);
        const dot = healthDotColor(tool, linkGaps.length);
        const healthLabel = tool.healthLabel || tool.status;

        return (
          <>
            <td className="hub-users-col--hub-code">
              <ToolCodeBadge code={tool.code} category={tool.category} />
            </td>
            <td className="hub-users-col--hub-project">
              <div className="hub-users-cell-name">
                <div className="relative shrink-0">
                  <ToolAvatar
                    code={tool.code}
                    iconName={toolIconName(tool)}
                    svgSrc={toolSvgIcon(tool) ?? undefined}
                    size="sm"
                  />
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-[var(--panel)]"
                    style={{ background: dot }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="hub-users-name-title" title={tool.name}>
                    {tool.name}
                  </span>
                  <span className="hub-users-cell-sub block truncate">
                    {tool.category} · {tool.audience}
                  </span>
                </div>
              </div>
            </td>
            <td className="hub-users-col--hub-version hub-users-cell-muted">
              <div className="text-xs">
                <CatalogVersionMeta tool={tool} />
              </div>
              {tool.branch ? <span className="block text-[10px]">{tool.branch}</span> : null}
              <div className="mt-1">
                <VersionSyncChip
                  syncStatus={versionSync.syncStatus}
                  title={versionSync.syncNote}
                  showAligned={tool.remoteEnabled !== false && Boolean(tool.remote)}
                />
              </div>
            </td>
            <td className="hub-users-col--hub-status">
              <div className="hub-users-role-cell">
                <QuietChip
                  label={tool.remoteEnabled === false ? "Local" : healthLabel}
                  tone={tool.healthLabel === "Ready" ? "ok" : "warn"}
                  iconMeta={
                    tool.remoteEnabled === false
                      ? resolveLocalOnlyIcon()
                      : resolveHealthStatusIcon(healthLabel)
                  }
                />
              </div>
            </td>
            <td className="hub-users-col--hub-drift hub-users-cell-num">
              {tool.driftAlerts.length > 0 ? (
                <span
                  className="inline-flex items-center justify-center gap-1 text-amber-200"
                  title={tool.driftAlerts.join("\n")}
                >
                  <DriftWarnIcon size={compactIconSize(14)} className={driftWarn.className} aria-hidden />
                  {tool.driftAlerts.length}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-1 text-emerald-200/90">
                  <DriftOkIcon size={compactIconSize(14)} className={driftOk.className} aria-hidden />
                  OK
                </span>
              )}
            </td>
            <td className="hub-users-col--hub-updated hub-users-cell-muted">
              {tool.updatedAt ? (
                <span className={`freshness-pill freshness-pill-${fresh}`} title={formatDate(tool.updatedAt)}>
                  <span className="freshness-dot" />
                  {freshnessLabel(fresh, tool.updatedAt)}
                </span>
              ) : (
                "—"
              )}
            </td>
          </>
        );
      }}
      renderStaticCells={(tool) => {
        const linkGaps = auditManifestLinks(tool);
        const port = tool.localUrl ? tryPort(tool.localUrl) : null;

        return (
          <>
            <td className="hub-users-col--hub-manifest align-top" onClick={(e) => e.stopPropagation()}>
              <LinkManifestFooter linkGaps={linkGaps} variant="table" />
            </td>
            <td className="hub-users-col--hub-links align-top" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center gap-1">
                <ToolCatalogLinkStrip
                  tool={tool}
                  linkGaps={linkGaps}
                  onCopyPath={onCopyPath}
                  linkHealth={linkHealth}
                />
                {port ? <StaticPortChip port={port} localUrl={tool.localUrl} /> : null}
              </div>
            </td>
          </>
        );
      }}
    />
  );
}

export function sortHubTools(tools: ResolvedTool[], sortKey: HubTableSortKey, sortDir: HubSortDir) {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...tools].sort((a, b) => {
    const av = sortableHubToolValue(a, sortKey);
    const bv = sortableHubToolValue(b, sortKey);
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
  });
}
