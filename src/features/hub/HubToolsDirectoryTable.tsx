import { ArrowDown, ArrowUp, ArrowUpDown, Play } from "lucide-react";
import { HubTableColumnHeader, type HubTableColumnRole } from "@tool-workspace/hub-ui";
import { MaterialIcon } from "../../components";
import { ToolAvatar } from "../../components/ToolAvatar";
import { auditManifestLinks } from "../overview/manifest-link-audit";
import { LinkManifestFooter, QuietChip, ToolCodeBadge } from "./hub-tool-ui";
import { healthDotColor } from "./hub-tool-ui-utils";
import { folderName, formatDate, freshnessLabel, freshnessLevel } from "../../lib/tooling";
import {
  resolveDriftChipIcon,
  resolveDriftCleanIcon,
  resolveHealthStatusIcon,
  resolveLocalOnlyIcon,
  resolveLocalPortIcon,
} from "../../lib/badge-registry";
import { compactIconSize } from "../../lib/ui-scale";
import { toolIconName, toolSvgIcon } from "../../lib/visual";
import type { HealthState } from "../../hooks/useLocalHealth";
import type { ResolvedTool } from "../../types";

export type HubTableSortKey = "code" | "name" | "version" | "status" | "drift" | "updated";

type SortDir = "asc" | "desc";

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

function tryPort(url: string) {
  try {
    return new URL(url).port || null;
  } catch {
    return null;
  }
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return <Icon size={13} className={`hub-users-sort${active ? " is-active" : ""}`} aria-hidden />;
}

function sortableValue(tool: ResolvedTool, key: HubTableSortKey): string | number {
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
  healthState,
  onStartDev,
  startingDevCodes,
}: {
  tools: ResolvedTool[];
  sortKey: HubTableSortKey;
  sortDir: SortDir;
  onSort: (key: HubTableSortKey) => void;
  selectedIds: Set<string>;
  onToggleSelect: (toolId: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  detailToolId: string | null;
  onSelect: (id: string) => void;
  onCopyPath: (path: string) => void;
  healthState?: Record<string, HealthState>;
  onStartDev?: (code: string) => void;
  startingDevCodes?: Set<string>;
}) {
  return (
    <div className="hub-users-table-wrap overflow-x-auto rounded-2xl border border-white/5">
      <table className="hub-users-table hub-users-table--hub-tools">
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
        <thead>
          <tr>
            <th className="hub-users-col--select" scope="col">
              <label className="hub-users-select-all">
                <input
                  type="checkbox"
                  className="hub-checkbox"
                  checked={tools.length > 0 && allVisibleSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all visible tools"
                />
              </label>
            </th>
            {COLUMNS.map((col) => (
              <th key={col.key} className={col.colClass} scope="col">
                <button
                  type="button"
                  className="hub-users-th-btn"
                  onClick={() => onSort(col.key)}
                  aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                >
                  <span className="hub-users-th-label">
                    <HubTableColumnHeader label={col.label} role={col.role} />
                    <SortIndicator active={sortKey === col.key} dir={sortDir} />
                  </span>
                </button>
              </th>
            ))}
            <th className="hub-users-col--hub-manifest" scope="col">
              <span className="hub-users-th-btn hub-users-th-btn--static">
                <span className="hub-users-th-label">
                  <HubTableColumnHeader label="Manifest" role="manifest" />
                </span>
              </span>
            </th>
            <th className="hub-users-col--hub-links" scope="col">
              <span className="hub-users-th-btn hub-users-th-btn--static">
                <span className="hub-users-th-label">
                  <HubTableColumnHeader label="Links" role="links" />
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tools.map((tool) => {
            const fresh = freshnessLevel(tool.updatedAt);
            const linkGaps = auditManifestLinks(tool);
            const port = tool.localUrl ? tryPort(tool.localUrl) : null;
            const localHealth = tool.localUrl ? healthState?.[tool.localUrl] : undefined;
            const dot = healthDotColor(tool, localHealth, linkGaps.length);
            const healthLabel = tool.healthLabel || tool.status;
            const driftWarn = resolveDriftChipIcon();
            const driftOk = resolveDriftCleanIcon();
            const DriftWarnIcon = driftWarn.icon;
            const DriftOkIcon = driftOk.icon;
            const selected = selectedIds.has(tool.id);
            const isDetail = detailToolId === tool.id;

            return (
              <tr
                key={tool.id}
                className={`hub-users-row${selected ? " is-selected" : ""}${isDetail ? " is-detail" : ""}`}
                onClick={() => onSelect(tool.id)}
              >
                <td className="hub-users-col--select" onClick={(e) => e.stopPropagation()}>
                  <label className="hub-users-select-row">
                    <input
                      type="checkbox"
                      className="hub-checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(tool.id)}
                      aria-label={`Select ${tool.code}`}
                    />
                  </label>
                </td>
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
                  <span className="block text-xs font-semibold text-[var(--text)]">v{tool.version}</span>
                  {tool.branch ? <span className="block text-[10px]">{tool.branch}</span> : null}
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
                <td className="hub-users-col--hub-manifest align-top" onClick={(e) => e.stopPropagation()}>
                  <LinkManifestFooter linkGaps={linkGaps} variant="table" />
                </td>
                <td className="hub-users-col--hub-links align-top" onClick={(e) => e.stopPropagation()}>
                  <div className="link-row flex flex-wrap justify-center gap-0.5">
                    {tool.appUrl ? (
                      <a
                        className="icon-link tone-app"
                        href={tool.appUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={`Production: ${tool.appUrl}`}
                      >
                        <MaterialIcon name="public" size={compactIconSize(16)} />
                      </a>
                    ) : null}
                    {tool.localUrl ? (
                      <a
                        className={`icon-link tone-local ${
                          localHealth === "online"
                            ? "health-online"
                            : localHealth === "offline"
                              ? "health-offline"
                              : localHealth === "checking"
                                ? "health-checking"
                                : "health-unknown"
                        }`}
                        href={tool.localUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={
                          localHealth === "online"
                            ? `Local live: ${tool.localUrl}`
                            : localHealth === "offline"
                              ? `Local down: ${tool.localUrl}`
                              : `Local: ${tool.localUrl}`
                        }
                      >
                        <MaterialIcon name="dns" size={compactIconSize(16)} />
                        <span className="health-dot" aria-hidden="true" />
                      </a>
                    ) : null}
                    {tool.repo ? (
                      <a
                        className="icon-link"
                        href={tool.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={`Repo: ${tool.repo}`}
                      >
                        <MaterialIcon name="hub" size={compactIconSize(16)} />
                      </a>
                    ) : null}
                    {tool.localPath ? (
                      <button
                        className="icon-link"
                        type="button"
                        onClick={() => onCopyPath(tool.localPath)}
                        title={`${folderName(tool.localPath)} — copy path`}
                      >
                        <MaterialIcon name="folder" size={compactIconSize(16)} />
                      </button>
                    ) : null}
                    {port ? (
                      <QuietChip
                        label={localHealth === "online" ? `:${port}` : `:${port}`}
                        tone={localHealth === "online" ? "ok" : "neutral"}
                        iconMeta={resolveLocalPortIcon(localHealth === "online")}
                      />
                    ) : null}
                    {import.meta.env.DEV &&
                    tool.localUrl &&
                    onStartDev &&
                    localHealth === "offline" ? (
                      <button
                        type="button"
                        className="icon-link"
                        disabled={startingDevCodes?.has(tool.code)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartDev(tool.code);
                        }}
                        title={`Start ${tool.code} dev server`}
                      >
                        <Play
                          size={compactIconSize(16)}
                          className={startingDevCodes?.has(tool.code) ? "animate-pulse" : ""}
                        />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function sortHubTools(tools: ResolvedTool[], sortKey: HubTableSortKey, sortDir: SortDir) {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...tools].sort((a, b) => {
    const av = sortableValue(a, sortKey);
    const bv = sortableValue(b, sortKey);
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
  });
}
