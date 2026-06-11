import { chartBreakdownFromPicker, matchesDirectoryTimeRange } from "@tool-workspace/hub-ui";
import { hasManifestLinkGaps } from "../overview/manifest-link-audit";
import type { TimeRange } from "../../lib/url-prefs";
import { resolveChartLegendIcon } from "../../lib/badge-registry-chart";
import { deployLabel } from "../../lib/tooling";
import type { ResolvedTool } from "../../types";
import type { BarItem, FilterDef, FilterValues } from "../../components/sales-shell";
import { enrichFilterDefs } from "../../lib/filter-option-counts";

function breakdown(tools: ResolvedTool[], pick: (t: ResolvedTool) => string): BarItem[] {
  return chartBreakdownFromPicker(tools, pick, { iconFor: resolveChartLegendIcon });
}

const HOSTED_TARGETS = new Set(["vps", "vercel", "cloudflare"]);

export function hubKpis(tools: ResolvedTool[]) {
  const ready = tools.filter((t) => t.healthLabel === "Ready").length;
  const releases = tools.filter((t) => Boolean(t.remote?.latestRelease)).length;
  const drift = tools.filter((t) => t.driftAlerts.length > 0).length;
  const localOnly = tools.filter((t) => t.remoteEnabled === false).length;
  const linkGaps = tools.filter((t) => hasManifestLinkGaps(t)).length;
  const draft = tools.filter((t) => t.status === "Draft").length;
  const hosted = tools.filter((t) => t.deployTarget && HOSTED_TARGETS.has(t.deployTarget)).length;
  return { total: tools.length, ready, releases, drift, localOnly, linkGaps, draft, hosted };
}

export function hubCharts(tools: ResolvedTool[]) {
  return {
    health: breakdown(tools, (t) => t.healthLabel || t.status || "—"),
    category: breakdown(tools, (t) => t.category || "—"),
    deploy: breakdown(tools, (t) => deployLabel(t.deployTarget)),
    status: breakdown(tools, (t) => t.status || "—"),
  };
}

export function filterOptions(tools: ResolvedTool[]) {
  const uniq = (vals: string[]) =>
    [...new Set(vals.filter(Boolean))].sort().map((v) => ({ value: v, label: v }));

  return {
    health: uniq(tools.map((t) => t.healthLabel || t.status)),
    category: uniq(tools.map((t) => t.category)),
    deploy: uniq(tools.map((t) => deployLabel(t.deployTarget))),
    status: uniq(tools.map((t) => t.status)),
    drift: [
      { value: "drift", label: "Has drift" },
      { value: "clean", label: "No drift" },
    ],
    links: [{ value: "missing", label: "Missing manifest links" }],
  };
}

export function matchesTimeRange(updatedAt: string | undefined, range: TimeRange): boolean {
  return matchesDirectoryTimeRange(updatedAt, range);
}

export function filterHubTools(
  tools: ResolvedTool[],
  q: string,
  filters: Record<string, string[]>,
  range: TimeRange,
): ResolvedTool[] {
  return tools.filter(
    (t) => matchesHubFilters(t, q, filters) && matchesTimeRange(t.updatedAt, range),
  );
}

export function matchesHubFilters(
  tool: ResolvedTool,
  q: string,
  filters: Record<string, string[]>,
): boolean {
  const query = q.trim().toLowerCase();
  if (query) {
    const hay = [tool.name, tool.code, tool.repo, tool.summary, tool.category, tool.audience, ...tool.tags]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(query)) return false;
  }
  if (filters.health?.length && !filters.health.includes(tool.healthLabel || tool.status)) return false;
  if (filters.category?.length && !filters.category.includes(tool.category)) return false;
  if (filters.deploy?.length && !filters.deploy.includes(deployLabel(tool.deployTarget))) return false;
  if (filters.status?.length && !filters.status.includes(tool.status)) return false;
  if (filters.drift?.length) {
    const hasDrift = tool.driftAlerts.length > 0;
    const wantDrift = filters.drift.includes("drift");
    const wantClean = filters.drift.includes("clean");
    if (wantDrift && !wantClean && !hasDrift) return false;
    if (wantClean && !wantDrift && hasDrift) return false;
  }
  if (filters.links?.includes("missing") && !hasManifestLinkGaps(tool)) return false;
  return true;
}

export function hubFiltersWithCounts(
  allTools: ResolvedTool[],
  defs: FilterDef[],
  query: string,
  values: FilterValues,
  range: TimeRange,
): FilterDef[] {
  return enrichFilterDefs(
    allTools,
    defs,
    query,
    values,
    (tool, q, f) => matchesHubFilters(tool, q, f) && matchesTimeRange(tool.updatedAt, range),
    (tool, _key, value) => matchesHubFilters(tool, "", { [_key]: [value] }),
  );
}
