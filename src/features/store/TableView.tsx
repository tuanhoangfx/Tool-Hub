import { MaterialIcon } from "../../components";
import { ToolAvatar } from "../../components/ToolAvatar";
import { auditManifestLinks } from "../overview/manifest-link-audit";
import {
  LinkManifestFooter,
  QuietChip,
  ToolCodeBadge,
} from "../hub/hub-tool-ui";
import { healthDotColor } from "../hub/hub-tool-ui-utils";
import { deployLabel, folderName, formatDate, freshnessLabel, freshnessLevel } from "../../lib/tooling";
import {
  resolveDeployTargetIcon,
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

type TableViewProps = {
  tools: ResolvedTool[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCopyPath: (path: string) => void;
  healthState?: Record<string, HealthState>;
};

function tryPort(url: string) {
  try {
    return new URL(url).port || null;
  } catch {
    return null;
  }
}

export function TableView({ tools, selectedId, onSelect, onCopyPath, healthState }: TableViewProps) {
  return (
    <div className="table-view">
      <table className="lib-table">
        <thead>
          <tr>
            <th className="col-code">Code</th>
            <th className="col-name">Project</th>
            <th className="col-version">Version</th>
            <th className="col-status">Status</th>
            <th className="col-drift">Drift</th>
            <th className="col-updated">Updated</th>
            <th className="col-links">Links</th>
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

            return (
              <tr
                key={tool.id}
                className={`freshness-${fresh}${tool.id === selectedId ? " selected" : ""}`}
                onClick={() => onSelect(tool.id)}
              >
                <td className="col-code align-top">
                  <ToolCodeBadge code={tool.code} category={tool.category} />
                </td>
                <td className="col-name align-top">
                  <div className="flex min-w-0 items-start gap-2">
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
                      <strong className="block truncate text-sm">{tool.name}</strong>
                      <small className="mt-0.5 block truncate text-[var(--muted)]">
                        {tool.category} · {tool.audience}
                      </small>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <QuietChip label={healthLabel} tone="ok" iconMeta={resolveHealthStatusIcon(healthLabel)} />
                        <QuietChip
                          label={deployLabel(tool.deployTarget)}
                          tone="neutral"
                          iconMeta={resolveDeployTargetIcon(tool.deployTarget)}
                        />
                        {port ? (
                          <QuietChip
                            label={localHealth === "online" ? `:${port} online` : `:${port}`}
                            tone={localHealth === "online" ? "ok" : "neutral"}
                            iconMeta={resolveLocalPortIcon(localHealth === "online")}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="col-version align-top">
                  <span className="mini-stat">v{tool.version}</span>
                  {tool.branch ? <div className="text-[10px] text-[var(--muted)]">{tool.branch}</div> : null}
                </td>
                <td className="col-status align-top">
                  <QuietChip
                    label={tool.remoteEnabled === false ? "Local" : healthLabel}
                    tone={tool.healthLabel === "Ready" ? "ok" : "warn"}
                    iconMeta={
                      tool.remoteEnabled === false
                        ? resolveLocalOnlyIcon()
                        : resolveHealthStatusIcon(healthLabel)
                    }
                  />
                </td>
                <td className="col-drift align-top">
                  {tool.driftAlerts.length > 0 ? (
                    <span className="mini-stat mini-stat-warn inline-flex items-center gap-1" title={tool.driftAlerts.join("\n")}>
                      <DriftWarnIcon size={compactIconSize(14)} className={driftWarn.className} aria-hidden />
                      {tool.driftAlerts.length}
                    </span>
                  ) : (
                    <span className="mini-stat mini-stat-ok inline-flex items-center gap-1">
                      <DriftOkIcon size={compactIconSize(14)} className={driftOk.className} aria-hidden />
                      OK
                    </span>
                  )}
                </td>
                <td className="col-updated align-top">
                  {tool.updatedAt ? (
                    <span className={`freshness-pill freshness-pill-${fresh}`} title={formatDate(tool.updatedAt)}>
                      <span className="freshness-dot" />
                      {freshnessLabel(fresh, tool.updatedAt)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="col-links align-top" onClick={(e) => e.stopPropagation()}>
                  <LinkManifestFooter linkGaps={linkGaps} />
                  <div className="link-row mt-1">
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
