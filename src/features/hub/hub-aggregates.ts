import { hasManifestLinkGaps } from "../overview/manifest-link-audit";
import type { TimeRange } from "../../lib/url-prefs";
import { resolveChartLegendIcon } from "../../lib/badge-registry";
import { deployLabel } from "../../lib/tooling";
import type { ResolvedTool } from "../../types";
import type { BarItem, FilterDef, FilterValues } from "../../components/sales-shell";
import { enrichFilterDefs } from "../../lib/filter-option-counts";

const CHART_COLORS = ["#818cf8", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#f43f5e"];

function breakdown(tools: ResolvedTool[], pick: (t: ResolvedTool) => string): BarItem[] {
  const map = new Map<string, number>();
  for (const t of tools) {
    const label = pick(t) || "—";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value], i) => ({
      label,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
      iconMeta: resolveChartLegendIcon(label),
    }))
    .sort((a, b) => b.value - a.value);
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

function dayBounds(offsetDays = 0) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

export function matchesTimeRange(updatedAt: string | undefined, range: TimeRange): boolean {
  if (range === "all") return true;
  if (!updatedAt?.trim()) return false;
  const at = new Date(updatedAt).getTime();
  if (Number.isNaN(at)) return false;

  const now = Date.now();
  if (range === "today") {
    const { start, end } = dayBounds(0);
    return at >= start && at <= end;
  }
  if (range === "yesterday") {
    const { start, end } = dayBounds(-1);
    return at >= start && at <= end;
  }
  const days: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
  const d = days[range];
  if (d) return at >= now - d * 86400000;
  return true;
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
