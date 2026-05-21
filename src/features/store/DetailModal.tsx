import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { InfoItem } from "../../components/InfoItem";
import { MaterialIcon, TagRow } from "../../components";
import { StatusBadge } from "../../components/StatusBadge";
import { ToolAvatar } from "../../components/ToolAvatar";
import { memoFetch } from "../../lib/cache";
import { deployLabel, folderName, formatDate, freshnessLabel, freshnessLevel } from "../../lib/tooling";
import { parseChangelog } from "../../lib/changelog-parser";
import { githubAuthHeaders } from "../../services/github";
import { statusIcon, toolIconName, toolSvgIcon } from "../../lib/visual";
import type { ResolvedTool } from "../../types";

type ModalCommit = {
  sha: string;
  html_url: string;
  commit: { message: string; author?: { name?: string; date: string } };
  author: { login?: string; avatar_url?: string } | null;
};

function timeAgo(ts: string) {
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

type DetailModalProps = {
  tool: ResolvedTool | null;
  onClose: () => void;
  onCopyPath: (path: string) => void;
  copied: string | null;
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

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function DetailModal({ tool, onClose, onCopyPath, copied }: DetailModalProps) {
  const [commits, setCommits] = useState<ModalCommit[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);

  useEffect(() => {
    if (!tool) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [tool, onClose]);

  useEffect(() => {
    if (!tool?.repo || tool.remoteEnabled === false) {
      setCommits([]);
      return;
    }
    const controller = new AbortController();
    setCommitsLoading(true);
    void memoFetch<ModalCommit[]>(
      `api:${tool.repo}/commits?per_page=15`,
      async () => {
        const response = await fetch(
          `https://api.github.com/repos/${tool.repo}/commits?per_page=15`,
          { headers: { Accept: "application/vnd.github+json", ...githubAuthHeaders() }, signal: controller.signal },
        );
        if (!response.ok) return [];
        const data = (await response.json()) as ModalCommit[];
        return Array.isArray(data) ? data : [];
      },
    ).then((data) => {
      if (controller.signal.aborted) return;
      setCommits(data ?? []);
      setCommitsLoading(false);
    });
    return () => {
      controller.abort();
    };
  }, [tool?.repo, tool?.remoteEnabled]);

  if (!tool) return null;

  const manifest = tool.remote?.manifest;
  const commands = manifest?.commands ?? {};
  const readiness = manifest?.release?.readiness ?? [];
  const nextActions = manifest?.nextActions ?? [];
  const docs = manifest?.docs ?? {};
  const aliases = manifest?.aliases ?? [];
  const healthNote = manifest?.health?.note;
  const latestPublished = manifest?.release?.latestPublished;
  const repoInfo = tool.remote?.repoInfo;
  const files = tool.remote?.files ?? [];
  const releaseAssets = tool.remote?.latestRelease?.assets ?? [];
  const okFiles = files.filter((f) => f.ok).length;
  const fresh = freshnessLevel(tool.updatedAt);
  const changelogText = files.find((f) => f.path.toLowerCase() === "changelog.md")?.text;
  const changelogEntries = parseChangelog(changelogText).slice(0, 5);

  return createPortal(
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-shell" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} title="Close (Esc)">
          <MaterialIcon name="close" size={20} />
        </button>

        <header className="modal-hero">
          <ToolAvatar code={tool.code} iconName={toolIconName(tool)} svgSrc={toolSvgIcon(tool) ?? undefined} size="lg" />
          <div className="modal-hero-text">
            <div className="modal-hero-top">
              <span className="code-pill">{tool.code}</span>
              <StatusBadge icon={statusIcon(tool)} label={statusText(tool)} tone={statusTone(tool)} />
              {tool.updatedAt ? (
                <span className={`freshness-pill freshness-pill-${fresh}`} title={formatDate(tool.updatedAt)}>
                  <span className="freshness-dot" />
                  {freshnessLabel(fresh, tool.updatedAt)}
                </span>
              ) : null}
              {tool.driftAlerts.length > 0 ? (
                <span className="mini-stat mini-stat-warn">
                  <MaterialIcon name="warning" size={13} />
                  {tool.driftAlerts.length} drift
                </span>
              ) : null}
            </div>
            <h2>{tool.name}</h2>
            <p>{tool.summary}</p>
            {aliases.length > 0 ? (
              <div className="alias-row">
                {aliases.map((a) => (
                  <span key={a} className="alias-chip">{a}</span>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <section className="modal-actions">
          {tool.appUrl ? (
            <a className="btn primary" href={tool.appUrl} target="_blank" rel="noreferrer">
              <MaterialIcon name="public" size={16} />
              Production
            </a>
          ) : null}
          {tool.localUrl ? (
            <a className="btn secondary" href={tool.localUrl} target="_blank" rel="noreferrer">
              <MaterialIcon name="dns" size={16} />
              Local server
            </a>
          ) : null}
          {tool.repo ? (
            <a className="btn secondary" href={tool.repoUrl} target="_blank" rel="noreferrer">
              <MaterialIcon name="hub" size={16} />
              Repo
            </a>
          ) : null}
          {tool.deployTarget === "github-release" && tool.downloadUrl ? (
            <a className="btn primary" href={tool.downloadUrl} target="_blank" rel="noreferrer">
              <MaterialIcon name="download" size={16} />
              Download
            </a>
          ) : null}
          {tool.releaseUrl ? (
            <a className="btn secondary" href={tool.releaseUrl} target="_blank" rel="noreferrer">
              <MaterialIcon name="rocket_launch" size={16} />
              Releases
            </a>
          ) : null}
          {tool.localPath ? (
            <button
              className="btn secondary"
              type="button"
              onClick={() => onCopyPath(tool.localPath)}
              title={copied === tool.localPath ? "Đã copy!" : `Copy: ${tool.localPath}`}
            >
              <MaterialIcon name={copied === tool.localPath ? "check" : "content_copy"} size={16} />
              {copied === tool.localPath ? "Copied" : "Copy path"}
            </button>
          ) : null}
        </section>

        <section className="versions-block">
          <h3 className="section-label">Versions & Deploy</h3>
          <div className="version-row">
            <div className="version-cell">
              <span className="version-label">
                <MaterialIcon name="laptop" size={14} /> Local
              </span>
              <span className="version-value">v{tool.version}</span>
            </div>
            <div className="version-cell">
              <span className="version-label">
                <MaterialIcon name="hub" size={14} /> Git Release
              </span>
              <span className="version-value">{tool.remote?.latestRelease?.tag_name || "—"}</span>
            </div>
            <div className="version-cell">
              <span className="version-label">
                <MaterialIcon name="cloud" size={14} /> Deploy
              </span>
              <span className="version-value">{deployLabel(tool.deployTarget)}</span>
            </div>
          </div>
        </section>

        {healthNote ? (
          <section className="modal-note">
            <MaterialIcon name="info" size={16} />
            <span>{healthNote}</span>
          </section>
        ) : null}

        <div className="modal-content-grid">
          <div className="modal-col">
            {tool.tags.length > 0 ? (
              <section className="modal-section">
                <h3 className="section-label">
                  <MaterialIcon name="layers" size={14} /> Tech stack
                </h3>
                <TagRow tags={tool.tags} iconSize={14} />
              </section>
            ) : null}

            {Object.keys(commands).length > 0 ? (
              <section className="modal-section">
                <h3 className="section-label">
                  <MaterialIcon name="terminal" size={14} /> Commands
                </h3>
                <div className="cmd-grid">
                  {Object.entries(commands).map(([key, cmd]) => (
                    <div key={key} className="cmd-row">
                      <span className="cmd-key">{key}</span>
                      <code>{cmd}</code>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {tool.usage.length > 0 ? (
              <section className="modal-section">
                <h3 className="section-label">
                  <MaterialIcon name="play_arrow" size={14} /> Usage
                </h3>
                <ul className="usage-list">
                  {tool.usage.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {nextActions.length > 0 ? (
              <section className="modal-section">
                <h3 className="section-label">
                  <MaterialIcon name="north_east" size={14} /> Roadmap / Next actions
                </h3>
                <ul className="usage-list">
                  {nextActions.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <div className="modal-col">
            <section className="modal-section">
              <h3 className="section-label">
                <MaterialIcon name="location_on" size={14} /> Locations
              </h3>
              <div className="info-grid">
                <InfoItem icon="folder" label="Local path" value={folderName(tool.localPath)} />
                <InfoItem icon="hub" label="Repo" value={tool.repo || "—"} />
                {tool.localUrl ? <InfoItem icon="dns" label="Local URL" value={tool.localUrl} /> : null}
                {manifest?.urls?.localSetupAt ? (
                  <InfoItem icon="schedule" label="Setup link local" value={formatDate(manifest.urls.localSetupAt)} />
                ) : null}
                {tool.appUrl ? <InfoItem icon="public" label="App URL" value={tool.appUrl} /> : null}
                {manifest?.urls?.appSetupAt ? (
                  <InfoItem icon="event" label="Setup link website" value={formatDate(manifest.urls.appSetupAt)} />
                ) : null}
                {manifest?.urls?.admin && !tool.localUrl ? (
                  <InfoItem icon="dns" label="Admin URL" value={manifest.urls.admin} />
                ) : null}
                {manifest?.urls?.adminSetupAt ? (
                  <InfoItem icon="schedule" label="Setup admin UI" value={formatDate(manifest.urls.adminSetupAt)} />
                ) : null}
                <InfoItem icon="category" label="Loại" value={tool.category} />
                <InfoItem icon="update" label="Last push" value={formatDate(tool.updatedAt)} />
                {manifest?.manifestUpdatedAt ? (
                  <InfoItem icon="edit_note" label="Manifest updated" value={formatDate(manifest.manifestUpdatedAt)} />
                ) : null}
                {tool.audience ? <InfoItem icon="groups" label="Đối tượng" value={tool.audience} /> : null}
              </div>
            </section>

            {readiness.length > 0 ? (
              <section className="modal-section">
                <h3 className="section-label">
                  <MaterialIcon name="task_alt" size={14} /> Readiness checks
                </h3>
                <div className="readiness-chips">
                  {readiness.map((key) => (
                    <span key={key} className="readiness-chip">{key}</span>
                  ))}
                </div>
              </section>
            ) : null}

            {tool.driftAlerts.length > 0 ? (
              <section className="modal-section">
                <h3 className="section-label">
                  <MaterialIcon name="warning" size={14} /> Drift alerts ({tool.driftAlerts.length})
                </h3>
                <ul className="modal-drift-list">
                  {tool.driftAlerts.map((alert, idx) => {
                    const lower = alert.toLowerCase();
                    const tone = lower.includes("missing") || lower.includes("drift")
                      ? "bad"
                      : "warn";
                    return (
                      <li key={idx} className={`modal-drift-item tone-${tone}`}>
                        <MaterialIcon name={tone === "bad" ? "error" : "warning"} size={13} />
                        <span>{alert}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {files.length > 0 ? (
              <section className="modal-section">
                <h3 className="section-label">
                  <MaterialIcon name="description" size={14} /> Tracked files ({okFiles}/{files.length})
                </h3>
                <ul className="file-list">
                  {files.map((f) => (
                    <li key={f.path} className={f.ok ? "file-ok" : "file-missing"}>
                      <MaterialIcon name={f.ok ? "check_circle" : "cancel"} size={13} />
                      <code>{f.path}</code>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {tool.deployTarget === "github-release" ? (
              <section className="modal-section">
                <h3 className="section-label">
                  <MaterialIcon name="download" size={14} /> Release downloads
                  {tool.remote?.latestRelease?.tag_name ? ` (${tool.remote.latestRelease.tag_name})` : ""}
                </h3>
                {releaseAssets.length > 0 ? (
                  <div className="release-asset-list">
                    {releaseAssets.map((asset) => (
                      <a
                        key={asset.name}
                        href={asset.browser_download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="release-asset-row"
                        title={`Download ${asset.name} (${formatBytes(asset.size)})`}
                      >
                        <MaterialIcon name="install_desktop" size={14} />
                        <span className="release-asset-name">{asset.name}</span>
                        <span className="release-asset-size">{formatBytes(asset.size)}</span>
                        <MaterialIcon name="download" size={13} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="no-assets-hint">
                    <MaterialIcon name="info" size={14} />
                    <span>
                      {tool.remote?.latestRelease?.tag_name
                        ? `Release ${tool.remote.latestRelease.tag_name} chưa đính kèm file installer. Upload .exe lên GitHub Releases để link xuất hiện ở đây.`
                        : "Chưa có GitHub Release nào. Tạo release và đính kèm file installer (.exe)."}
                    </span>
                    {tool.releaseUrl ? (
                      <a href={tool.releaseUrl} target="_blank" rel="noreferrer" className="no-assets-link">
                        Mở Releases <MaterialIcon name="open_in_new" size={12} />
                      </a>
                    ) : null}
                  </div>
                )}
              </section>
            ) : latestPublished ? (
              <section className="modal-section">
                <h3 className="section-label">
                  <MaterialIcon name="rocket_launch" size={14} /> Latest release asset
                </h3>
                <div className="asset-card">
                  <div className="asset-row">
                    <span className="asset-key">Tag</span>
                    <code>{latestPublished.tag}</code>
                  </div>
                  {latestPublished.asset ? (
                    <>
                      <div className="asset-row">
                        <span className="asset-key">Asset</span>
                        <code>{latestPublished.asset.name}</code>
                      </div>
                      <div className="asset-row">
                        <span className="asset-key">Size</span>
                        <code>{formatBytes(latestPublished.asset.size)}</code>
                      </div>
                      {latestPublished.asset.sha256 ? (
                        <div className="asset-row">
                          <span className="asset-key">SHA256</span>
                          <code className="sha">{latestPublished.asset.sha256.slice(0, 16)}…</code>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </section>
            ) : null}

            {repoInfo && tool.repo ? (
              <section className="modal-section">
                <h3 className="section-label">
                  <MaterialIcon name="info" size={14} /> GitHub stats
                </h3>
                <div className="info-grid">
                  {repoInfo.stargazers_count !== undefined ? (
                    <InfoItem icon="star" label="Stars" value={String(repoInfo.stargazers_count)} />
                  ) : null}
                  {repoInfo.open_issues_count !== undefined ? (
                    <InfoItem icon="bug_report" label="Issues" value={String(repoInfo.open_issues_count)} />
                  ) : null}
                  {repoInfo.default_branch ? (
                    <InfoItem icon="fork_right" label="Branch" value={repoInfo.default_branch} />
                  ) : null}
                  {repoInfo.visibility ? (
                    <InfoItem icon="visibility" label="Visibility" value={repoInfo.visibility} />
                  ) : null}
                </div>
              </section>
            ) : null}

            {Object.keys(docs).length > 0 ? (
              <section className="modal-section">
                <h3 className="section-label">
                  <MaterialIcon name="menu_book" size={14} /> Docs
                </h3>
                <div className="docs-chips">
                  {Object.entries(docs).map(([key, path]) => (
                    <span key={key} className="readiness-chip">{key}: {String(path)}</span>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        {tool.repo && tool.remoteEnabled !== false ? (
          <section className="modal-section modal-commits-section">
            <h3 className="section-label">
              <MaterialIcon name="commit" size={14} /> Recent commits
              {commits.length > 0 ? ` (${commits.length})` : ""}
            </h3>
            {commitsLoading ? (
              <div className="modal-commits-loading">
                <MaterialIcon name="hourglass_empty" size={14} className="spin" />
                Loading commits…
              </div>
            ) : commits.length === 0 ? (
              <div className="modal-commits-empty">
                <MaterialIcon name="inbox" size={14} />
                No commits found (rate-limit or private repo).
              </div>
            ) : (
              <ol className="modal-commits">
                {commits.slice(0, 10).map((c) => {
                  const message = c.commit.message.split("\n")[0];
                  const author = c.author?.login ?? c.commit.author?.name ?? "unknown";
                  const date = c.commit.author?.date ?? "";
                  return (
                    <li key={c.sha} className="modal-commit">
                      {c.author?.avatar_url ? (
                        <img
                          className="modal-commit-avatar"
                          src={c.author.avatar_url}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <span className="modal-commit-avatar placeholder">
                          {author.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="modal-commit-body">
                        <a
                          className="modal-commit-message"
                          href={c.html_url}
                          target="_blank"
                          rel="noreferrer"
                          title={message}
                        >
                          {message}
                        </a>
                        <span className="modal-commit-meta">
                          <span className="modal-commit-author">{author}</span>
                          <span className="modal-commit-time">{date ? timeAgo(date) : "—"}</span>
                        </span>
                      </div>
                      <a
                        className="modal-commit-sha"
                        href={c.html_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {c.sha.slice(0, 7)}
                      </a>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        ) : null}

        {changelogEntries.length > 0 ? (
          <section className="modal-section changelog-section">
            <h3 className="section-label">
              <MaterialIcon name="history_edu" size={14} /> Changelog ({changelogEntries.length} latest entries)
            </h3>
            <ol className="changelog-entries">
              {changelogEntries.map((entry, idx) => (
                <li key={idx} className="changelog-entry">
                  <header>
                    {entry.version ? <span className="changelog-version">v{entry.version}</span> : null}
                    {entry.date ? <span className="changelog-date">{entry.date}</span> : null}
                    {entry.type ? <span className="changelog-type">{entry.type}</span> : null}
                    {entry.status ? (
                      <span className={`changelog-status status-${entry.status.toLowerCase()}`}>{entry.status}</span>
                    ) : null}
                    {entry.commit ? <code className="changelog-commit">{entry.commit.slice(0, 7)}</code> : null}
                  </header>
                  {entry.title && entry.title !== entry.heading ? (
                    <strong className="changelog-title">{entry.title}</strong>
                  ) : null}
                  {entry.changes.length > 0 ? (
                    <ul className="changelog-bullets">
                      {entry.changes.slice(0, 5).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
