import { useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "../../components";
import { memoFetch } from "../../lib/cache";
import { dateKey, formatDate } from "../../lib/tooling";
import { githubAuthHeaders } from "../../services/github";
import type { ResolvedTool } from "../../types";

const COMMITS_PER_REPO = 10;

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { name?: string; date: string };
  };
  author: { login?: string; avatar_url?: string } | null;
};

type TimelineItem = {
  sha: string;
  url: string;
  message: string;
  date: number;
  authorLabel: string;
  authorAvatar?: string;
  tool: ResolvedTool;
};

type ActivityTabProps = {
  tools: ResolvedTool[];
};

function formatRelative(ts: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

async function fetchCommits(repo: string): Promise<GitHubCommit[]> {
  const result = await memoFetch<GitHubCommit[]>(
    `api:${repo}/commits?per_page=${COMMITS_PER_REPO}`,
    async () => {
      const response = await fetch(
        `https://api.github.com/repos/${repo}/commits?per_page=${COMMITS_PER_REPO}`,
        { headers: { Accept: "application/vnd.github+json", ...githubAuthHeaders() } },
      );
      if (!response.ok) return [];
      const data = (await response.json()) as GitHubCommit[];
      return Array.isArray(data) ? data : [];
    },
  );
  return result ?? [];
}

export function ActivityTab({ tools }: ActivityTabProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterToolId, setFilterToolId] = useState<string>("all");

  const remoteTools = useMemo(
    () => tools.filter((t) => t.repo && t.remoteEnabled !== false),
    [tools],
  );

  useEffect(() => {
    if (remoteTools.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    Promise.allSettled(
      remoteTools.map(async (tool) => {
        const commits = await fetchCommits(tool.repo);
        return commits
          .map<TimelineItem | null>((c) => {
            const dateStr = c.commit.author?.date;
            if (!dateStr) return null;
            const date = new Date(dateStr).getTime();
            if (Number.isNaN(date)) return null;
            return {
              sha: c.sha,
              url: c.html_url,
              message: c.commit.message.split("\n")[0],
              date,
              authorLabel: c.author?.login ?? c.commit.author?.name ?? "unknown",
              authorAvatar: c.author?.avatar_url,
              tool,
            };
          })
          .filter((item): item is TimelineItem => item !== null);
      }),
    ).then((results) => {
      if (cancelled) return;
      const perTool = results
        .filter((r): r is PromiseFulfilledResult<TimelineItem[]> => r.status === "fulfilled")
        .map((r) => r.value);
      const merged = perTool.flat().sort((a, b) => b.date - a.date);
      setItems(merged);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [remoteTools]);

  const filteredItems = useMemo(
    () => (filterToolId === "all" ? items : items.filter((item) => item.tool.id === filterToolId)),
    [items, filterToolId],
  );

  const grouped = useMemo(() => {
    const buckets = new Map<string, TimelineItem[]>();
    for (const item of filteredItems) {
      const key = dateKey(item.date);
      const arr = buckets.get(key) ?? [];
      arr.push(item);
      buckets.set(key, arr);
    }
    return Array.from(buckets.entries());
  }, [filteredItems]);

  const stats = useMemo(() => {
    const repos = new Set(filteredItems.map((item) => item.tool.id));
    const authors = new Set(filteredItems.map((item) => item.authorLabel));
    const latest = filteredItems[0]?.date;
    return {
      total: filteredItems.length,
      repos: repos.size,
      authors: authors.size,
      latest,
    };
  }, [filteredItems]);

  return (
    <section className="activity-layout">
      <header className="activity-hero">
        <div className="activity-hero-stats">
          <div className="activity-stat">
            <span className="activity-stat-label">Commits</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="activity-stat">
            <span className="activity-stat-label">Repos</span>
            <strong>{stats.repos}</strong>
          </div>
          <div className="activity-stat">
            <span className="activity-stat-label">Authors</span>
            <strong>{stats.authors}</strong>
          </div>
          <div className="activity-stat">
            <span className="activity-stat-label">Latest</span>
            <strong>{stats.latest ? formatRelative(stats.latest) : "—"}</strong>
          </div>
        </div>
        <div className="activity-filter">
          <label className="activity-filter-label">
            <MaterialIcon name="filter_list" size={14} />
            Tool
          </label>
          <select
            className="activity-filter-select"
            value={filterToolId}
            onChange={(e) => setFilterToolId(e.target.value)}
          >
            <option value="all">All tools ({remoteTools.length})</option>
            {remoteTools.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.code} · {tool.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <ol className="activity-timeline activity-timeline-skeleton" aria-busy="true">
          {Array.from({ length: 2 }).map((_, dayIdx) => (
            <li className="activity-day" key={dayIdx}>
              <div className="activity-day-header">
                <span className="skel skel-text" style={{ width: 80 }} aria-hidden="true" />
                <span className="skel skel-text" style={{ width: 60 }} aria-hidden="true" />
              </div>
              <ul className="activity-commits">
                {Array.from({ length: dayIdx === 0 ? 4 : 3 }).map((__, ci) => (
                  <li className="activity-commit skeleton-row" key={ci}>
                    <span className="skel" style={{ width: 28, height: 28, borderRadius: "50%" }} aria-hidden="true" />
                    <div className="activity-commit-body">
                      <div className="activity-commit-meta">
                        <span className="skel skel-text" style={{ width: 40 }} aria-hidden="true" />
                        <span className="skel skel-text" style={{ width: 60 }} aria-hidden="true" />
                        <span className="skel skel-text" style={{ width: 32 }} aria-hidden="true" />
                      </div>
                      <span className="skel skel-text" style={{ width: "80%" }} aria-hidden="true" />
                    </div>
                    <span className="skel skel-text" style={{ width: 50, height: 18 }} aria-hidden="true" />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : filteredItems.length === 0 ? (
        <div className="activity-empty">
          <MaterialIcon name="inbox" size={16} />
          No commits found. GitHub rate-limit, private repos, or no remote-enabled tools.
        </div>
      ) : (
        <ol className="activity-timeline">
          {grouped.map(([day, dayItems]) => (
            <li className="activity-day" key={day}>
              <div className="activity-day-header">
                <span className="activity-day-label">{formatDate(`${day}T00:00:00Z`).slice(0, 10)}</span>
                <span className="activity-day-count">{dayItems.length} commits</span>
              </div>
              <ul className="activity-commits">
                {dayItems.map((item) => (
                  <li className="activity-commit" key={`${item.tool.id}-${item.sha}`}>
                    {item.authorAvatar ? (
                      <img className="activity-avatar" src={item.authorAvatar} alt="" loading="lazy" />
                    ) : (
                      <span className="activity-avatar activity-avatar-placeholder">
                        {item.authorLabel.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="activity-commit-body">
                      <div className="activity-commit-meta">
                        <span className="code-pill">{item.tool.code}</span>
                        <span className="activity-commit-author">{item.authorLabel}</span>
                        <span className="activity-commit-time">{formatRelative(item.date)}</span>
                      </div>
                      <a
                        className="activity-commit-message"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        title={item.message}
                      >
                        {item.message}
                      </a>
                    </div>
                    <a
                      className="activity-commit-sha"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open commit"
                    >
                      {item.sha.slice(0, 7)}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
