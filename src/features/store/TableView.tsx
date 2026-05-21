import { MaterialIcon, RunningBadge } from "../../components";
import { StatusBadge } from "../../components/StatusBadge";
import type { HealthState } from "../../hooks/useLocalHealth";
import { folderName, formatDate, freshnessLabel, freshnessLevel } from "../../lib/tooling";
import { statusIcon } from "../../lib/visual";
import type { ResolvedTool } from "../../types";

type TableViewProps = {
  tools: ResolvedTool[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCopyPath: (path: string) => void;
  healthState?: Record<string, HealthState>;
};

function statusTone(tool: ResolvedTool): "ok" | "warn" | "bad" | "neutral" {
  if (tool.remoteEnabled === false) return "neutral";
  if (tool.healthLabel === "Ready") return "ok";
  if (tool.driftAlerts.length > 0) return "bad";
  return "warn";
}

function statusText(tool: ResolvedTool) {
  if (tool.remoteEnabled === false) return "Local";
  return tool.healthLabel;
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
            return (
            <tr
              key={tool.id}
              className={`freshness-${fresh}${tool.id === selectedId ? " selected" : ""}`}
              onClick={() => onSelect(tool.id)}
            >
              <td className="col-code">
                <span className="code-pill">{tool.code}</span>
              </td>
              <td className="col-name">
                <div className="name-cell">
                  <div className="name-cell-title">
                    <strong>{tool.name}</strong>
                    <RunningBadge
                      state={tool.localUrl ? healthState?.[tool.localUrl] : undefined}
                      localUrl={tool.localUrl}
                      compact
                    />
                  </div>
                  <small>{tool.category} · {tool.audience}</small>
                </div>
              </td>
              <td className="col-version">
                <span className="mini-stat">v{tool.version}</span>
              </td>
              <td className="col-status">
                <StatusBadge icon={statusIcon(tool)} label={statusText(tool)} tone={statusTone(tool)} />
              </td>
              <td className="col-drift">
                {tool.driftAlerts.length > 0 ? (
                  <span className="mini-stat mini-stat-warn" title={tool.driftAlerts.join("\n")}>
                    <MaterialIcon name="warning" size={14} />
                    {tool.driftAlerts.length}
                  </span>
                ) : (
                  <span className="mini-stat mini-stat-ok">
                    <MaterialIcon name="check_circle" size={14} />
                    OK
                  </span>
                )}
              </td>
              <td className="col-updated">
                {tool.updatedAt ? (
                  <span className={`freshness-pill freshness-pill-${fresh}`} title={formatDate(tool.updatedAt)}>
                    <span className="freshness-dot" />
                    {freshnessLabel(fresh, tool.updatedAt)}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="col-links" onClick={(e) => e.stopPropagation()}>
                <div className="link-row">
                  {tool.appUrl ? (
                    <a className="icon-link tone-app" href={tool.appUrl} target="_blank" rel="noreferrer" title={`Production: ${tool.appUrl}`}>
                      <MaterialIcon name="public" size={16} />
                    </a>
                  ) : null}
                  {tool.localUrl ? (
                    <a className="icon-link tone-local" href={tool.localUrl} target="_blank" rel="noreferrer" title={`Local: ${tool.localUrl}`}>
                      <MaterialIcon name="dns" size={16} />
                    </a>
                  ) : null}
                  {tool.repo ? (
                    <a className="icon-link" href={tool.repoUrl} target="_blank" rel="noreferrer" title={`Repo: ${tool.repo}`}>
                      <MaterialIcon name="hub" size={16} />
                    </a>
                  ) : null}
                  {tool.localPath ? (
                    <button
                      className="icon-link"
                      type="button"
                      onClick={() => onCopyPath(tool.localPath)}
                      title={`${folderName(tool.localPath)} — copy path`}
                    >
                      <MaterialIcon name="folder" size={16} />
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          );})}
        </tbody>
      </table>
      {tools.length === 0 ? <div className="table-empty">No projects match filters.</div> : null}
    </div>
  );
}

