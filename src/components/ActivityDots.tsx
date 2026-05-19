import { MaterialIcon } from "./MaterialIcon";
import { freshnessLabel, freshnessLevel, normalizeVersion } from "../lib/tooling";
import type { ResolvedTool } from "../types";

type ActivityDotsProps = {
  tool: ResolvedTool;
};

function localTone(tool: ResolvedTool): { tone: string; label: string; tip: string } {
  if (tool.remoteEnabled === false) {
    return { tone: "stale", label: "Local", tip: "Local-only project (no remote sync)" };
  }
  const localV = normalizeVersion(tool.localVersion || tool.version);
  const remoteV = normalizeVersion(tool.remote?.latestRelease?.tag_name);
  if (!remoteV) return { tone: "fresh", label: "Ahead", tip: `Local v${localV} — no GitHub release yet` };
  if (localV === remoteV) return { tone: "synced", label: "Sync", tip: `Local matches release v${remoteV}` };
  return { tone: "fresh", label: "Ahead", tip: `Local v${localV} ahead of release v${remoteV}` };
}

export function ActivityDots({ tool }: ActivityDotsProps) {
  const local = localTone(tool);
  const fresh = freshnessLevel(tool.updatedAt);
  const githubLabel = tool.updatedAt ? freshnessLabel(fresh, tool.updatedAt) : "—";
  const githubTip = tool.updatedAt
    ? `GitHub last push: ${new Date(tool.updatedAt).toLocaleString()}`
    : "No GitHub data";

  return (
    <span className="activity-dots" aria-label="Activity status">
      <span className={`activity-dot dot-${local.tone}`} title={`Local: ${local.tip}`}>
        <MaterialIcon name="laptop_mac" size={11} />
        <span className="activity-dot-circle" />
        <span className="activity-dot-label">{local.label}</span>
      </span>
      <span className={`activity-dot dot-${fresh}`} title={`GitHub: ${githubTip}`}>
        <MaterialIcon name="hub" size={11} />
        <span className="activity-dot-circle" />
        <span className="activity-dot-label">{githubLabel}</span>
      </span>
    </span>
  );
}
