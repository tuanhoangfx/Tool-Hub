import { DriftHint } from "../../components/DriftHint";
import { HealthBar } from "../../components/HealthBar";
import { MaterialIcon, RunningBadge, TagRow, Tooltip } from "../../components";
import { StatusBadge } from "../../components/StatusBadge";
import { ToolAvatar } from "../../components/ToolAvatar";
import type { HealthState } from "../../hooks/useLocalHealth";
import { folderName, formatDate, freshnessLabel, freshnessLevel, normalizeVersion } from "../../lib/tooling";

function shortDate(value?: string) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(d);
  } catch {
    return "";
  }
}
import { fileHealthPercent, statusIcon, toolIconName, toolSvgIcon } from "../../lib/visual";
import type { ResolvedTool } from "../../types";

type ToolCardProps = {
  tool: ResolvedTool;
  healthState?: HealthState;
  copied: boolean;
  onOpen: (id: string) => void;
  onCopyPath: (path: string) => void;
};

const DEPLOY_LABELS: Record<string, string> = {
  "github-pages": "Pages",
  vercel: "Vercel",
  vps: "VPS",
  "github-release": "Release",
  local: "Local",
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

function localPort(url?: string) {
  if (!url) return null;
  try {
    return new URL(url).port || null;
  } catch {
    return null;
  }
}

function releaseSummary(tool: ResolvedTool): { tag: string; date?: string } {
  const tag = tool.remote?.latestRelease?.tag_name;
  const date = tool.remote?.latestRelease?.published_at;
  if (tag) {
    return { tag, date };
  }
  return { tag: "—" };
}

function syncStatus(tool: ResolvedTool): { tone: "ok" | "warn" | "bad" | "neutral"; label: string; tip: string } {
  if (tool.remoteEnabled === false) {
    return { tone: "neutral", label: "Local only", tip: "Project has no remote repo" };
  }
  const localV = normalizeVersion(tool.localVersion || tool.version);
  const remoteV = normalizeVersion(tool.remote?.latestRelease?.tag_name);
  if (!remoteV) return { tone: "warn", label: `v${localV} (no release)`, tip: "No GitHub release published yet" };
  if (localV === remoteV) return { tone: "ok", label: `Synced v${remoteV}`, tip: "Local matches latest release" };
  return { tone: "bad", label: `Local v${localV} → release v${remoteV}`, tip: "Local ahead of release" };
}

export function ToolCard({ tool, healthState, copied, onOpen, onCopyPath }: ToolCardProps) {
  const fresh = freshnessLevel(tool.updatedAt);
  const filePct = fileHealthPercent(tool.remote?.files);
  const fileCount = tool.remote?.files?.length ?? 0;
  const fileOk = tool.remote?.files?.filter((f) => f.ok).length ?? 0;
  const release = releaseSummary(tool);
  const sync = syncStatus(tool);
  const port = localPort(tool.localUrl);
  const isOnline = tool.localUrl ? healthState === "online" : false;
  const isCopied = copied;
  const deployLabel = tool.deployTarget ? DEPLOY_LABELS[tool.deployTarget] ?? tool.deployTarget : null;
  const releaseDate = release.date ? shortDate(release.date) : "";
  const isLocalOnly = tool.remoteEnabled === false;
  const isLoading = tool.remote?.loading === true || (!tool.remote && !isLocalOnly);

  return (
    <article className={`tool-card freshness-${fresh}`} onClick={() => onOpen(tool.id)}>
      {/* Identity — avatar + name + sub line full width */}
      <header className="tool-card-head">
        <ToolAvatar
          code={tool.code}
          iconName={toolIconName(tool)}
          svgSrc={toolSvgIcon(tool) ?? undefined}
          size="md"
        />
        <div className="tool-card-identity">
          <h2 className="tool-card-name" title={tool.name}>
            {tool.name}
          </h2>
          <p className="tool-card-sub">
            <span className="code-pill">{tool.code}</span>
            <span className="tool-card-sub-text">{tool.category}</span>
            {deployLabel ? (
              <>
                <span className="tool-card-sub-sep">·</span>
                <span className="tool-card-sub-text">{deployLabel}</span>
              </>
            ) : null}
          </p>
        </div>
      </header>

      {/* Status badges — RUNNING leads if active, then status, drift, freshness */}
      <div className="tool-card-status">
        <RunningBadge state={healthState} localUrl={tool.localUrl} compact />
        <StatusBadge icon={statusIcon(tool)} label={statusText(tool)} tone={statusTone(tool)} />
        <DriftHint alerts={tool.driftAlerts} />
        {tool.updatedAt ? (
          <span
            className={`freshness-pill freshness-pill-${fresh}`}
            title={`Last push: ${formatDate(tool.updatedAt)}`}
          >
            <span className="freshness-dot" />
            {freshnessLabel(fresh, tool.updatedAt)}
          </span>
        ) : null}
      </div>

      <TagRow tags={tool.tags} limit={3} />

      {isLocalOnly ? (
        <div className="health-bar-wrap">
          <div className="health-bar-head">
            <span className="health-bar-label">
              <MaterialIcon name="cloud_off" size={12} />
              Local only
            </span>
            <span className="health-pct health-pct-neutral">—</span>
          </div>
          <div className="health-bar-track">
            <div className="health-bar-fill health-bar-fill-neutral" style={{ width: "100%" }} />
          </div>
        </div>
      ) : (
        <HealthBar percent={filePct} files={tool.remote?.files} />
      )}

      {/* Info grid: version / release / branch / files */}
      <dl className={isLoading ? "tool-card-info is-loading" : "tool-card-info"}>
        <div className="tool-card-info-cell">
          <dt>
            <MaterialIcon name="sell" size={12} />
            Version
          </dt>
          <dd>v{tool.version}</dd>
        </div>
        <div className="tool-card-info-cell">
          <dt>
            <MaterialIcon name="new_releases" size={12} />
            Release
          </dt>
          <dd>
            {isLoading ? (
              <span className="skel skel-text" aria-hidden="true" />
            ) : release.tag !== "—" ? (
              <>
                <strong>{release.tag}</strong>
                {releaseDate ? <small> · {releaseDate}</small> : null}
              </>
            ) : (
              <span className="muted">—</span>
            )}
          </dd>
        </div>
        <div className="tool-card-info-cell">
          <dt>
            <MaterialIcon name="call_split" size={12} />
            Branch
          </dt>
          <dd>{tool.branch}</dd>
        </div>
        <div className="tool-card-info-cell">
          <dt>
            <MaterialIcon name="description" size={12} />
            {isLocalOnly ? "Source" : "Files"}
          </dt>
          <dd>
            {isLocalOnly ? (
              <span className="muted">Local</span>
            ) : isLoading ? (
              <span className="skel skel-text" aria-hidden="true" />
            ) : fileCount > 0 ? (
              <>
                {fileOk}/{fileCount} <small>OK</small>
              </>
            ) : (
              <span className="muted">—</span>
            )}
          </dd>
        </div>
      </dl>

      {/* Sync status line — hover shows full drift alerts when present */}
      {tool.driftAlerts.length > 0 ? (
        <Tooltip
          title={`Drift detected · ${tool.driftAlerts.length} alert${tool.driftAlerts.length > 1 ? "s" : ""}`}
          lines={tool.driftAlerts}
          align="start"
        >
          <span className={`tool-card-sync tone-${sync.tone}`}>
            <MaterialIcon name="sync" size={12} />
            <span>{sync.label}</span>
          </span>
        </Tooltip>
      ) : (
        <span className={`tool-card-sync tone-${sync.tone}`} title={sync.tip}>
          <MaterialIcon name="sync" size={12} />
          <span>{sync.label}</span>
        </span>
      )}

      {/* Local path + port */}
      {tool.localPath || port ? (
        <div className="tool-card-local">
          {tool.localPath ? (
            <span className="tool-card-folder" title={tool.localPath}>
              <MaterialIcon name="folder" size={12} />
              {folderName(tool.localPath)}
            </span>
          ) : null}
          {port ? (
            <span className={`tool-card-port ${isOnline ? "online" : ""}`}>
              <MaterialIcon name="dns" size={12} />:{port}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Quick actions footer */}
      <div className="card-footer" onClick={(e) => e.stopPropagation()}>
        <div className="card-quick-actions">
          {tool.deployTarget === "github-release" && tool.repo ? (
            <a
              className="icon-link tone-download"
              href={tool.releaseUrl}
              target="_blank"
              rel="noreferrer"
              title="Download GitHub release"
            >
              <MaterialIcon name="download" size={16} />
            </a>
          ) : null}
          {tool.appUrl ? (
            <a
              className="icon-link tone-app"
              href={tool.appUrl}
              target="_blank"
              rel="noreferrer"
              title={`Production: ${tool.appUrl}`}
            >
              <MaterialIcon name="public" size={16} />
            </a>
          ) : null}
          {tool.localUrl ? (
            <a
              className={`icon-link tone-local health-${healthState ?? "unknown"}`}
              href={tool.localUrl}
              target="_blank"
              rel="noreferrer"
              title={`Local: ${tool.localUrl} (${healthState ?? "unknown"})`}
            >
              <MaterialIcon name="dns" size={16} />
              <span className="health-dot" />
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
              <MaterialIcon name="hub" size={16} />
            </a>
          ) : null}
          {tool.localPath ? (
            <button
              className="icon-link"
              type="button"
              onClick={() => onCopyPath(tool.localPath)}
              title={isCopied ? "Copied!" : `Copy folder: ${tool.localPath}`}
            >
              <MaterialIcon name={isCopied ? "check" : "content_copy"} size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
