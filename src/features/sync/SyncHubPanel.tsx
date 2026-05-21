import { useCallback, useEffect, useState } from "react";
import { MaterialIcon } from "../../components";
import { formatDate } from "../../lib/tooling";
import type { WorkspaceCatalog, WorkspaceCatalogEntry } from "../../types/workspace-catalog";

function statusTone(status?: string): "ok" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  if (status === "in-sync") return "ok";
  if (status === "pushed" || status === "pulled") return "ok";
  if (status === "would-push" || status === "would-pull") return "warn";
  if (status === "error") return "bad";
  if (status === "github-only") return "warn";
  return "neutral";
}

function statusLabel(status?: string) {
  switch (status) {
    case "in-sync":
      return "Đồng bộ";
    case "pushed":
      return "Đã đẩy lên GitHub";
    case "pulled":
      return "Đã kéo từ GitHub";
    case "would-push":
      return "Sẽ đẩy (dry-run)";
    case "would-pull":
      return "Sẽ kéo (dry-run)";
    case "github-only":
      return "Chỉ trên GitHub";
    case "skipped":
      return "Bỏ qua";
    case "error":
      return "Lỗi";
    default:
      return status || "—";
  }
}

function formatVersion(value?: string) {
  if (!value || value === "remote") return "—";
  return value;
}

function versionDriftTone(drift?: string): "ok" | "warn" | "neutral" {
  if (drift === "match") return "ok";
  if (drift === "drift") return "warn";
  return "neutral";
}

function rootLabel(entry: WorkspaceCatalogEntry) {
  if (entry.workspaceRoot === "tool") return "Tool";
  if (entry.workspaceRoot === "extension") return "Extension";
  if (entry.workspaceRoot === "n8n") return "n8n";
  if (entry.workspaceRoot === "github") return "GitHub";
  return entry.workspaceRoot || "—";
}

export function SyncHubPanel() {
  const [catalog, setCatalog] = useState<WorkspaceCatalog | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/workspace-catalog.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setCatalog((await response.json()) as WorkspaceCatalog);
    } catch (err) {
      setCatalog(null);
      setError(err instanceof Error ? err.message : "Không đọc được workspace-catalog.json");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = catalog?.summary;

  return (
    <section className="sync-hub-panel">
      <header className="sync-hub-header">
        <div>
          <h3 className="section-label">
            <MaterialIcon name="sync" size={14} /> Sync Hub (2 chiều)
          </h3>
          <p className="sync-hub-desc">
            Trung tâm metadata: quét <strong>Tool</strong>, <strong>Extension</strong>, <strong>n8n</strong> và đồng bộ{" "}
            <code>tool.manifest.json</code> với GitHub <code>tuanhoangfx</code> (cần <code>gh auth login</code> hoặc{" "}
            <code>GITHUB_TOKEN</code>).
          </p>
        </div>
        <button type="button" className="btn secondary" onClick={() => void load()} disabled={loading}>
          <MaterialIcon name="refresh" size={14} />
          Tải lại catalog
        </button>
      </header>

      <div className="sync-hub-cmd card-surface">
        <MaterialIcon name="terminal" size={16} />
        <div>
          <code className="sync-cmd-line">corepack pnpm scan:local</code>
          <span className="sync-cmd-hint"> — quét 3 root, cập nhật registry + catalog (không gọi GitHub API ghi)</span>
        </div>
      </div>
      <div className="sync-hub-cmd card-surface">
        <MaterialIcon name="cloud_sync" size={16} />
        <div>
          <code className="sync-cmd-line">corepack pnpm sync:workspace</code>
          <span className="sync-cmd-hint">
            {" "}
            — đồng bộ 2 chiều manifest: local mới hơn → push GitHub; remote mới hơn → ghi local; repo GitHub không có
            folder → hiện github-only
          </span>
        </div>
      </div>
      <div className="sync-hub-cmd card-surface subtle">
        <MaterialIcon name="science" size={16} />
        <div>
          <code className="sync-cmd-line">corepack pnpm sync:workspace:dry</code>
          <span className="sync-cmd-hint"> — xem trước, không ghi file</span>
        </div>
      </div>
      <div className="sync-hub-cmd card-surface">
        <MaterialIcon name="download" size={16} />
        <div>
          <code className="sync-cmd-line">corepack pnpm sync:workspace --clone-missing</code>
          <span className="sync-cmd-hint">
            {" "}
            — clone repo chỉ có trên GitHub về <code>E:\Dev\Tool</code> (đổi trong{" "}
            <code>workspace.roots.json → clone.targetRoot</code>), rồi quét + sync lại
          </span>
        </div>
      </div>

      {loading ? (
        <p className="sync-hub-loading">
          <MaterialIcon name="hourglass_empty" size={14} className="spin" /> Đang tải workspace-catalog…
        </p>
      ) : null}

      {error ? (
        <p className="sync-hub-error">
          <MaterialIcon name="warning" size={14} /> {error}. Chạy <code>pnpm scan:local</code> hoặc{" "}
          <code>pnpm sync:workspace</code> trong thư mục P0004.
        </p>
      ) : null}

      {summary ? (
        <div className="sync-summary-chips">
          <span className="readiness-chip">Tổng: {summary.total}</span>
          <span className="readiness-chip">Project: {summary.projects}</span>
          <span className="readiness-chip">n8n: {summary.n8n}</span>
          {summary.githubOnly != null ? <span className="readiness-chip">GitHub-only: {summary.githubOnly}</span> : null}
          {summary.inSync != null ? <span className="readiness-chip tone-ok">In-sync: {summary.inSync}</span> : null}
          {summary.pushed != null ? <span className="readiness-chip">Pushed: {summary.pushed}</span> : null}
          {summary.pulled != null ? <span className="readiness-chip">Pulled: {summary.pulled}</span> : null}
          {summary.errors != null && summary.errors > 0 ? (
            <span className="readiness-chip tone-bad">Errors: {summary.errors}</span>
          ) : null}
          {summary.versionDrift != null && summary.versionDrift > 0 ? (
            <span className="readiness-chip tone-warn">Version drift: {summary.versionDrift}</span>
          ) : null}
          {summary.cloned != null && summary.cloned > 0 ? (
            <span className="readiness-chip tone-ok">Cloned: {summary.cloned}</span>
          ) : null}
          {catalog?.generatedAt ? (
            <span className="readiness-chip">Catalog: {formatDate(catalog.generatedAt)}</span>
          ) : null}
        </div>
      ) : null}

      {catalog?.entries?.length ? (
        <div className="sync-table-wrap">
          <table className="sync-table">
            <thead>
              <tr>
                <th>Root</th>
                <th>Code</th>
                <th>Tên</th>
                <th>Repo / path</th>
                <th>Local</th>
                <th>GitHub</th>
                <th>Sync</th>
              </tr>
            </thead>
            <tbody>
              {catalog.entries.map((entry) => {
                const tone = statusTone(entry.sync?.manifest);
                const driftTone = versionDriftTone(entry.versionDrift);
                return (
                  <tr key={`${entry.workspaceRoot}-${entry.id}`}>
                    <td>{rootLabel(entry)}</td>
                    <td>
                      <code>{entry.code}</code>
                    </td>
                    <td>{entry.name}</td>
                    <td className="sync-path-cell">
                      {entry.repo ? (
                        <a href={`https://github.com/${entry.repo}`} target="_blank" rel="noreferrer">
                          {entry.repo}
                        </a>
                      ) : (
                        <span title={entry.localPath}>{entry.localPath ? entry.localPath.split(/[/\\]/).pop() : "—"}</span>
                      )}
                    </td>
                    <td>
                      <code className="sync-version">{formatVersion(entry.localVersion)}</code>
                    </td>
                    <td>
                      <code className="sync-version">{formatVersion(entry.githubVersion)}</code>
                      {entry.versionDrift === "drift" ? (
                        <span className={`sync-pill tone-${driftTone} sync-pill-inline`} title="Local ≠ GitHub">
                          drift
                        </span>
                      ) : entry.versionDrift === "match" ? (
                        <span className={`sync-pill tone-${driftTone} sync-pill-inline`} title="Khớp version">
                          ✓
                        </span>
                      ) : entry.githubVersionError ? (
                        <span className="sync-detail" title={entry.githubVersionError}>
                          lỗi
                        </span>
                      ) : null}
                      {entry.githubVersionSource ? (
                        <span className="sync-detail" title={`Nguồn: ${entry.githubVersionSource}`}>
                          {entry.githubVersionSource === "manifest" ? "m" : "pkg"}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <span className={`sync-pill tone-${tone}`}>{statusLabel(entry.sync?.manifest)}</span>
                      {entry.sync?.clone ? (
                        <span className="sync-detail" title={entry.sync.cloneDetail}>
                          {entry.sync.clone}
                        </span>
                      ) : null}
                      {entry.sync?.detail ? (
                        <span className="sync-detail" title={entry.sync.detail}>
                          {entry.sync.detail}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
