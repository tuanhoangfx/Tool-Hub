import { MetricBadge, RegistryMetricBadge } from "../../components/sales-shell";
import { compactIconSize } from "../../lib/ui-scale";
import { resolveVersionSyncBadge } from "../../lib/version-badges";
import type { RoadmapNode } from "./roadmap-nodes";

export function RoadmapTimeline({ nodes }: { nodes: RoadmapNode[] }) {
  return (
    <div className="roadmap-timeline overflow-x-auto pb-3">
      <div
        className="roadmap-timeline-track relative overflow-hidden rounded-2xl border border-white/5 px-6 py-6"
        style={{ minWidth: `${Math.max(640, nodes.length * 165)}px` }}
      >
        <div className="roadmap-grid-bg" aria-hidden />
        <div className="roadmap-timeline-axis" aria-hidden />
        <div
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${Math.max(nodes.length, 1)}, minmax(150px, 1fr))` }}
        >
          {nodes.map((node, index) => {
            const top = index % 2 === 0;
            const statusClass =
              node.status === "done"
                ? "roadmap-node--done"
                : node.status === "current"
                  ? "roadmap-node--current"
                  : "roadmap-node--planned";
            return (
              <div key={node.id} className={`roadmap-version-cell ${top ? "roadmap-version-cell--top" : "roadmap-version-cell--bottom"}`}>
                <div className="roadmap-half roadmap-half--above">
                  {top ? (
                    <>
                      <BulletsList node={node} />
                      <IconOrb node={node} statusClass={statusClass} placement="above" />
                    </>
                  ) : (
                    <>
                      <VersionHeader node={node} />
                      <DateLabel date={node.date} />
                    </>
                  )}
                </div>
                <span className={`roadmap-axis-dot ${statusClass}`} aria-hidden />
                <div className="roadmap-half roadmap-half--below">
                  {top ? (
                    <>
                      <DateLabel date={node.date} />
                      <VersionHeader node={node} />
                    </>
                  ) : (
                    <>
                      <IconOrb node={node} statusClass={statusClass} placement="below" />
                      <BulletsList node={node} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function IconOrb({ node, statusClass, placement }: { node: RoadmapNode; statusClass: string; placement: "above" | "below" }) {
  const Icon = node.icon;
  const className = `roadmap-icon-orb roadmap-icon-orb--${placement} ${statusClass}`;
  const title = `${node.version} · ${resolveVersionSyncBadge(node.syncStatus).label}`;
  if (node.releaseUrl) {
    return (
      <a
        href={node.releaseUrl}
        target="_blank"
        rel="noreferrer"
        className={className}
        aria-label={title}
        title={title}
      >
        <Icon size={compactIconSize(16)} aria-hidden />
      </a>
    );
  }
  return (
    <span className={className} aria-label={title} title={title}>
      <Icon size={compactIconSize(16)} aria-hidden />
    </span>
  );
}

function DateLabel({ date }: { date: string }) {
  return <div className="roadmap-axis-date version-row-date">{date}</div>;
}

function VersionHeader({ node }: { node: RoadmapNode }) {
  const versionChip = (
    <MetricBadge
      label={node.version}
      mono
      variantClass="border-cyan-400/35 bg-cyan-400/10 text-cyan-100"
      className="roadmap-version-chip"
    />
  );
  return (
    <div className="roadmap-version-header">
      {node.releaseUrl ? (
        <a href={node.releaseUrl} target="_blank" rel="noreferrer" className="roadmap-version-chip-link" aria-label={`${node.version} release`}>
          {versionChip}
        </a>
      ) : (
        versionChip
      )}
      <RegistryMetricBadge spec={resolveVersionSyncBadge(node.syncStatus)} className="roadmap-info-badge" />
    </div>
  );
}

function BulletsList({ node }: { node: RoadmapNode }) {
  return (
    <ul className="roadmap-info-bullets">
      {node.bullets.map((b) => (
        <li key={b} className="roadmap-info-bullet" title={b.endsWith("…") ? b : undefined}>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}
