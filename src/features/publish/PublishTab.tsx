import { useMemo, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import { buildPublishChecks, formatPublishChecklist } from "../../lib/publish-checklist";
import type { ResolvedTool } from "../../types";

type PublishTabProps = {
  selectedTool: ResolvedTool;
  token: string;
  actionStatus: string;
  onTokenChange: (value: string) => void;
  onCreateIssue: () => Promise<void>;
  onCreateRelease: () => Promise<void>;
  onCreateVersionSyncPr: () => Promise<void>;
};

export function PublishTab({
  selectedTool,
  token,
  actionStatus,
  onTokenChange,
  onCreateIssue,
  onCreateRelease,
  onCreateVersionSyncPr,
}: PublishTabProps) {
  const checks = useMemo(() => buildPublishChecks(selectedTool), [selectedTool]);
  const passed = checks.filter((c) => c.passed).length;
  const [copyStatus, setCopyStatus] = useState("");

  async function copyChecklist() {
    const text = formatPublishChecklist(selectedTool, checks);
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("ÄÃ£ copy checklist");
    } catch {
      setCopyStatus("KhÃ´ng copy Ä‘Æ°á»£c");
    }
    window.setTimeout(() => setCopyStatus(""), 2400);
  }

  return (
    <section className="publish-layout">
      <div className="admin-main">
        <div className="panel-title-row slim">
          <h2>{selectedTool.name}</h2>
          <span className="version-chip">v{selectedTool.version}</span>
          <span className={passed === checks.length ? "status-dot ok" : "status-dot warn"}>
            {passed}/{checks.length} checks
          </span>
          <button className="btn secondary" type="button" onClick={() => void copyChecklist()} title="Copy checklist">
            <MaterialIcon name="content_copy" size={16} />
            Copy checklist
          </button>
        </div>
        {copyStatus ? <p className="muted-inline">{copyStatus}</p> : null}

        <div className="checklist compact-checks">
          {checks.map((check) => (
            <article className={check.passed ? "check-row passed" : "check-row warning"} key={check.label}>
              <MaterialIcon name={check.passed ? "check_circle" : "warning"} size={16} />
              <strong>{check.label}</strong>
            </article>
          ))}
        </div>

        <hr className="publish-divider" />

        <h3 className="publish-section-title">
          <MaterialIcon name="merge" size={16} />
          GitHub actions
        </h3>

        <div className="token-row">
          <div className="token-box">
            <MaterialIcon name="key" size={16} />
            <input value={token} onChange={(e) => onTokenChange(e.target.value)} placeholder="GitHub PAT" type="password" />
          </div>
          <span className={token ? "status-dot ok" : "status-dot warn"}>{token ? "OK" : "No token"}</span>
        </div>

        <div className="action-cards compact-actions">
          <article>
            <h3>
              <MaterialIcon name="bug_report" size={14} />
              Issue
            </h3>
            <button className="primary-action wide" type="button" onClick={() => void onCreateIssue()} disabled={!token} title="Create issue">
              <MaterialIcon name="play_arrow" size={16} />
            </button>
          </article>
          <article>
            <h3>
              <MaterialIcon name="call_merge" size={14} />
              Sync PR
            </h3>
            <button className="ghost-action wide" type="button" onClick={() => void onCreateVersionSyncPr()} disabled={!token} title="Version sync PR">
              <MaterialIcon name="merge" size={16} />
            </button>
          </article>
          <article>
            <h3>
              <MaterialIcon name="new_releases" size={14} />
              Draft release
            </h3>
            <button className="ghost-action wide" type="button" onClick={() => void onCreateRelease()} disabled={!token} title="Draft release">
              <MaterialIcon name="rocket_launch" size={16} />
            </button>
          </article>
        </div>

        {actionStatus ? <div className="status-log">{actionStatus}</div> : null}
      </div>

      <aside className="admin-side">
        <div className="panel-title-row">
          <h2>{selectedTool.repo}</h2>
        </div>
        {selectedTool.driftAlerts.length > 0 ? (
          <section className="info-block compact">
            <h3>
              <MaterialIcon name="warning" size={14} />
              Drift
            </h3>
            <ul className="suggestions">
              {selectedTool.driftAlerts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className="info-block compact">
          <h3>
            <MaterialIcon name="lightbulb" size={14} />
            Gá»£i Ã½
          </h3>
          {selectedTool.suggestions.length > 0 ? (
            <ul className="suggestions">
              {selectedTool.suggestions.slice(0, 6).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="muted-inline">Sáºµn sÃ ng publish</p>
          )}
        </section>
      </aside>
    </section>
  );
}
