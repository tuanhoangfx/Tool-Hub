import { useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "../../components";
import { formatDate, freshnessLabel, freshnessLevel } from "../../lib/tooling";
import { githubAuthHeaders } from "../../services/github";
import type { ResolvedTool } from "../../types";

type SystemTabProps = {
  tools: ResolvedTool[];
  loadingAll: boolean;
  lastRefreshedAt: number | null;
  onCopyPath: (path: string) => void;
};

const SELF_CODE = "P0004";
const COMMITS_TO_FETCH = 30;
const DAYS_IN_CHART = 14;

type Commit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name?: string; date: string };
  };
  author: { login?: string; avatar_url?: string } | null;
};

type Release = {
  tag_name: string;
  name?: string;
  html_url: string;
  published_at?: string;
};

type SessionLogEntry = {
  ts: number;
  event: string;
  detail?: string;
};

const SESSION_LOG_KEY = "tool-library.session-log";

function readSessionLog(): SessionLogEntry[] {
  try {
    const raw = localStorage.getItem(SESSION_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionLogEntry[];
  } catch {
    return [];
  }
}

function formatRelative(ts: number | string) {
  const t = typeof ts === "string" ? new Date(ts).getTime() : ts;
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildDailyBuckets(commits: Commit[]) {
  const buckets: Record<string, number> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = DAYS_IN_CHART - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets[dateKey(d)] = 0;
  }
  for (const c of commits) {
    const key = dateKey(new Date(c.commit.author.date));
    if (key in buckets) buckets[key] += 1;
  }
  return Object.entries(buckets).map(([day, count]) => ({ day, count }));
}

export function SystemTab({ tools, loadingAll, lastRefreshedAt, onCopyPath }: SystemTabProps) {
  const self = useMemo(() => tools.find((t) => t.code === SELF_CODE), [tools]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [sessionLog, setSessionLog] = useState<SessionLogEntry[]>(() => readSessionLog());

  useEffect(() => {
    if (!self?.repo) return;
    let cancelled = false;
    const headers = { Accept: "application/vnd.github+json", ...githubAuthHeaders() };
    Promise.all([
      fetch(`https://api.github.com/repos/${self.repo}/commits?per_page=${COMMITS_TO_FETCH}`, { headers }).then(
        (r) => (r.ok ? (r.json() as Promise<Commit[]>) : []),
      ),
      fetch(`https://api.github.com/repos/${self.repo}/releases?per_page=10`, { headers }).then((r) =>
        r.ok ? (r.json() as Promise<Release[]>) : [],
      ),
    ])
      .then(([c, rel]) => {
        if (cancelled) return;
        setCommits(Array.isArray(c) ? c : []);
        setReleases(Array.isArray(rel) ? rel : []);
        setFetchedAt(Date.now());
        setFetchError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchError((err as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [self?.repo, lastRefreshedAt]);

  useEffect(() => {
    const interval = window.setInterval(() => setSessionLog(readSessionLog()), 5_000);
    return () => window.clearInterval(interval);
  }, []);

  const daily = useMemo(() => buildDailyBuckets(commits), [commits]);
  const maxDaily = Math.max(1, ...daily.map((d) => d.count));
  const totalCommits = commits.length;
  const uniqueAuthors = new Set(commits.map((c) => c.author?.login ?? c.commit.author?.name ?? "unknown")).size;
  const fresh = self ? freshnessLevel(self.updatedAt) : "unknown";

  if (!self) {
    return <div className="inline-banner bad">Workspace tool P0004 not found in registry.</div>;
  }

  return (
    <section className="system-layout">
      <header className="self-hero">
        <div className="self-hero-top">
          <div className="self-hero-id">
            <span className="code-pill">{self.code}</span>
            <h2>{self.name}</h2>
            <span className={`freshness-pill freshness-pill-${fresh}`}>
              <span className="freshness-dot" />
              {freshnessLabel(fresh, self.updatedAt)}
            </span>
          </div>
          <p>{self.summary}</p>
        </div>
        <div className="self-hero-stats">
          <div className="self-stat">
            <span className="self-stat-label">Local version</span>
            <strong>v{self.version}</strong>
          </div>
          <div className="self-stat">
            <span className="self-stat-label">Git release</span>
            <strong>{self.remote?.latestRelease?.tag_name || "—"}</strong>
          </div>
          <div className="self-stat">
            <span className="self-stat-label">Commits (last 30)</span>
            <strong>{totalCommits}</strong>
          </div>
          <div className="self-stat">
            <span className="self-stat-label">Contributors</span>
            <strong>{uniqueAuthors}</strong>
          </div>
        </div>
      </header>

      {fetchError ? (
        <div className="inline-banner bad">
          <MaterialIcon name="warning" size={16} /> {fetchError}
        </div>
      ) : null}

      <section className="system-section">
        <h3 className="system-section-title">
          <MaterialIcon name="bar_chart" size={16} />
          Commits per day (last {DAYS_IN_CHART})
        </h3>
        <div className="chart-card">
          <div className="bar-chart">
            {daily.map((d) => {
              const heightPct = (d.count / maxDaily) * 100;
              const dayShort = d.day.slice(5);
              return (
                <div key={d.day} className="bar-col" title={`${d.day}: ${d.count} commit(s)`}>
                  <div className="bar-fill" style={{ height: `${heightPct}%` }}>
                    {d.count > 0 ? <span className="bar-label">{d.count}</span> : null}
                  </div>
                  <span className="bar-axis">{dayShort}</span>
                </div>
              );
            })}
          </div>
          <div className="chart-meta">
            {fetchedAt ? <>Updated {formatRelative(fetchedAt)}</> : loadingAll ? "Loading..." : "—"}
          </div>
        </div>
      </section>

      <section className="system-section">
        <h3 className="system-section-title">
          <MaterialIcon name="commit" size={16} />
          Recent commits
        </h3>
        <div className="table-view">
          <table className="lib-table changelog-table">
            <thead>
              <tr>
                <th className="col-when">When</th>
                <th className="col-author">Author</th>
                <th className="col-msg">Message</th>
                <th className="col-sha">SHA</th>
              </tr>
            </thead>
            <tbody>
              {commits.slice(0, 15).map((c) => (
                <tr key={c.sha}>
                  <td className="col-when">{formatRelative(c.commit.author.date)}</td>
                  <td className="col-author">{c.author?.login ?? c.commit.author?.name ?? "—"}</td>
                  <td className="col-msg">{c.commit.message.split("\n")[0]}</td>
                  <td className="col-sha">
                    <a className="mini-link" href={c.html_url} target="_blank" rel="noreferrer">
                      {c.sha.slice(0, 7)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {commits.length === 0 ? <div className="table-empty">No commits yet.</div> : null}
        </div>
      </section>

      <section className="system-section">
        <h3 className="system-section-title">
          <MaterialIcon name="rocket_launch" size={16} />
          Release history
        </h3>
        <div className="table-view">
          <table className="lib-table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Name</th>
                <th>Published</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((r) => (
                <tr key={r.tag_name}>
                  <td><span className="code-pill">{r.tag_name}</span></td>
                  <td>{r.name || r.tag_name}</td>
                  <td>{r.published_at ? formatDate(r.published_at) : "—"}</td>
                  <td>
                    <a className="mini-link" href={r.html_url} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {releases.length === 0 ? <div className="table-empty">No releases yet.</div> : null}
        </div>
      </section>

      <section className="system-section">
        <h3 className="system-section-title">
          <MaterialIcon name="history" size={16} />
          Session log ({sessionLog.length})
        </h3>
        {sessionLog.length === 0 ? (
          <div className="table-empty">No actions yet. Refresh, copy paths, or open a tool to start logging.</div>
        ) : (
          <ol className="session-log">
            {sessionLog
              .slice()
              .reverse()
              .slice(0, 30)
              .map((entry, idx) => (
                <li key={idx}>
                  <span className="log-time">{formatRelative(entry.ts)}</span>
                  <span className="log-event">{entry.event}</span>
                  {entry.detail ? <span className="log-detail">{entry.detail}</span> : null}
                </li>
              ))}
          </ol>
        )}
      </section>

      <section className="system-section">
        <h3 className="system-section-title">
          <MaterialIcon name="folder" size={16} />
          Quick links
        </h3>
        <div className="modal-actions">
          {self.appUrl ? (
            <a className="btn primary" href={self.appUrl} target="_blank" rel="noreferrer">
              <MaterialIcon name="public" size={16} /> Production
            </a>
          ) : null}
          {self.localUrl ? (
            <a className="btn secondary" href={self.localUrl} target="_blank" rel="noreferrer">
              <MaterialIcon name="dns" size={16} /> Local
            </a>
          ) : null}
          {self.repo ? (
            <a className="btn secondary" href={self.repoUrl} target="_blank" rel="noreferrer">
              <MaterialIcon name="hub" size={16} /> Repo
            </a>
          ) : null}
          {self.localPath ? (
            <button className="btn secondary" type="button" onClick={() => onCopyPath(self.localPath)}>
              <MaterialIcon name="content_copy" size={16} /> Copy folder
            </button>
          ) : null}
        </div>
      </section>
    </section>
  );
}

export function appendSessionLog(event: string, detail?: string) {
  try {
    const raw = localStorage.getItem(SESSION_LOG_KEY);
    const existing = raw ? (JSON.parse(raw) as SessionLogEntry[]) : [];
    const next = [...existing, { ts: Date.now(), event, detail }].slice(-50);
    localStorage.setItem(SESSION_LOG_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
