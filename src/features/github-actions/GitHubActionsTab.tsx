import { MaterialIcon } from "../../components/MaterialIcon";
import type { ResolvedTool } from "../../types";

type GitHubActionsTabProps = {
  selectedTool: ResolvedTool;
  token: string;
  actionStatus: string;
  onTokenChange: (value: string) => void;
  onCreateIssue: () => Promise<void>;
  onCreateRelease: () => Promise<void>;
  onCreateVersionSyncPr: () => Promise<void>;
};

export function GitHubActionsTab({
  selectedTool,
  token,
  actionStatus,
  onTokenChange,
  onCreateIssue,
  onCreateRelease,
  onCreateVersionSyncPr,
}: GitHubActionsTabProps) {
  return (
    <section className="github-layout">
      <div className="admin-main">
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
              Release
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
          <span className="version-chip">v{selectedTool.version}</span>
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
      </aside>
    </section>
  );
}
