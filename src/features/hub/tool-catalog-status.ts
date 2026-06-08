import { normalizeVersion } from "../../lib/tooling";
import type { VersionSyncStatus } from "../overview/tool-versions";
import type { ResolvedTool } from "../../types";

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((x) => parseInt(x, 10) || 0);
  const pb = b.split(".").map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Catalog card — local vs GitHub version sync (registry + GitHub refresh, no port probe). */
export function resolveCatalogVersionSync(tool: ResolvedTool): {
  displayVersion: string;
  localVersion: string | null;
  githubVersion: string | null;
  syncStatus: VersionSyncStatus;
  syncNote: string;
} {
  const githubVersion =
    normalizeVersion(
      tool.remote?.packageJson?.version ??
        tool.remote?.manifest?.release?.version ??
        tool.version,
    ) || null;
  const localRaw = tool.localVersion?.trim();
  const localVersion = localRaw ? normalizeVersion(localRaw) || localRaw : null;

  if (tool.remoteEnabled === false || !tool.remote) {
    return {
      displayVersion: tool.version,
      localVersion: localRaw ?? null,
      githubVersion: null,
      syncStatus: "current",
      syncNote: "Local registry — GitHub sync off",
    };
  }

  if (tool.driftAlerts.length > 0) {
    return {
      displayVersion: tool.version,
      localVersion: localRaw ?? null,
      githubVersion,
      syncStatus: "needs-sync",
      syncNote: tool.driftAlerts[0],
    };
  }

  if (localVersion && githubVersion && localVersion !== githubVersion) {
    const ahead = compareSemver(localVersion, githubVersion) > 0;
    return {
      displayVersion: tool.version,
      localVersion: localRaw ?? localVersion,
      githubVersion,
      syncStatus: ahead ? "needs-push" : "needs-sync",
      syncNote: ahead
        ? `Local v${localVersion} ahead of GitHub v${githubVersion}`
        : `GitHub v${githubVersion} ahead of local v${localVersion}`,
    };
  }

  return {
    displayVersion: tool.version,
    localVersion: localRaw ?? null,
    githubVersion,
    syncStatus: "synced",
    syncNote: "Local and GitHub versions aligned",
  };
}

export type ToolLinkSlot = "app" | "local" | "github" | "folder";

export type ToolLinkSlotState = {
  key: ToolLinkSlot;
  configured: boolean;
  href?: string;
  title: string;
  gapLabel?: string;
};

/** Manifest link slots for catalog icons — configured vs missing (no HTTP probe). */
export function resolveToolLinkSlots(tool: ResolvedTool, linkGapKeys: Set<string>): ToolLinkSlotState[] {
  const deploy = tool.deployTarget ?? "app";
  const slots: ToolLinkSlotState[] = [];

  if (tool.appUrl) {
    slots.push({
      key: "app",
      configured: !linkGapKeys.has("app") && !linkGapKeys.has("vercel-url"),
      href: tool.appUrl,
      title: `Production (${deploy}): ${tool.appUrl}`,
      gapLabel: "Web URL",
    });
  } else {
    slots.push({
      key: "app",
      configured: false,
      title: linkGapKeys.has("app") || linkGapKeys.has("vercel-url") ? "Missing production URL" : "No production URL",
      gapLabel: "Web URL",
    });
  }

  if (tool.localUrl) {
    slots.push({
      key: "local",
      configured: !linkGapKeys.has("local"),
      href: tool.localUrl,
      title: `Local dev: ${tool.localUrl}`,
      gapLabel: "Local URL",
    });
  } else {
    slots.push({
      key: "local",
      configured: false,
      title: linkGapKeys.has("local") ? "Missing local URL" : "No local URL",
      gapLabel: "Local URL",
    });
  }

  if (tool.repo) {
    slots.push({
      key: "github",
      configured: !linkGapKeys.has("github"),
      href: tool.repoUrl,
      title: `GitHub: ${tool.repo}`,
      gapLabel: "GitHub repo",
    });
  } else {
    slots.push({
      key: "github",
      configured: false,
      title: linkGapKeys.has("github") ? "Missing GitHub repo" : "No GitHub repo",
      gapLabel: "GitHub repo",
    });
  }

  slots.push({
    key: "folder",
    configured: Boolean(tool.localPath?.trim()),
    title: tool.localPath ? `Workspace: ${tool.localPath}` : "No local path",
  });

  return slots;
}
