import { useCallback, useEffect, useMemo, useState } from "react";
import changelogRaw from "../../../CHANGELOG.md?raw";
import manifestJson from "../../../tool.manifest.json";
import { MiniBarChart, MiniDonut, type FilterDef, type FilterValues } from "../../components/sales-shell";
import { resolveHubKpiIcon } from "../../lib/badge-registry";
import { readHubListPrefs } from "../../lib/url-prefs";
import type { ResolvedTool, ToolManifest, ToolRepository } from "../../types";
import { hubCharts, hubKpis } from "../hub/hub-aggregates";
import { DEFAULT_HUB_CHART_KEYS } from "../hub/hub-prefs";
import { ToolOverviewContent } from "../overview/ToolOverviewContent";
import { SystemHubShell } from "./SystemHubShell";
import { filterToolsForSystem } from "./system-hub-aggregates";

function hubToolFromManifest(manifest: ToolManifest): ResolvedTool {
  const base: ToolRepository = {
    id: manifest.code ?? "P0004",
    code: manifest.code ?? "P0004",
    name: manifest.name ?? "Tool Hub",
    category: "Web",
    audience: "internal",
    status: (manifest.status as ToolRepository["status"]) ?? "Ready",
    summary: manifest.summary ?? "",
    tags: manifest.stack ?? [],
    repo: manifest.github?.repo ?? "",
    branch: manifest.github?.branch ?? "main",
    appUrl: manifest.urls?.app,
    localUrl: manifest.urls?.local,
    localPath: "",
    deployTarget: (manifest.deployTarget as ToolRepository["deployTarget"]) ?? "vercel",
    remoteEnabled: true,
    usage: manifest.features ?? [],
    downloadHint: "",
    manifestPath: "tool.manifest.json",
    trackedFiles: [],
    scriptFiles: [],
  };
  return {
    ...base,
    version: manifest.release?.version ?? "0.1.0",
    releaseUrl: "",
    repoUrl: manifest.github?.repo ? `https://github.com/${manifest.github.repo}` : "",
    downloadUrl: "",
    healthLabel: manifest.health?.status ?? "Ready",
    updatedAt: "",
    driftAlerts: manifest.health?.note ? [manifest.health.note] : [],
    suggestions: [],
    remote: {
      id: base.id,
      loading: false,
      manifest,
      files: [],
    },
  };
}

function visibleChartKeys(set: Set<string> | null) {
  return set ?? DEFAULT_HUB_CHART_KEYS;
}

export function SystemOverviewPanel({ tools }: { tools: ResolvedTool[] }) {
  const hubTool = useMemo(() => {
    const localManifest = manifestJson as ToolManifest;
    const found = tools.find((t) => t.code === "P0004");
    if (!found) return hubToolFromManifest(localManifest);

    return {
      ...found,
      remote: {
        ...(found.remote ?? {}),
        id: found.remote?.id ?? found.id,
        loading: found.remote?.loading ?? false,
        files: found.remote?.files ?? [],
        manifest: {
          ...(found.remote?.manifest ?? {}),
          ...localManifest,
        },
      },
    };
  }, [tools]);

  const [focusedId, setFocusedId] = useState<string | null>(hubTool.id);
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [prefs, setPrefs] = useState(readHubListPrefs);

  useEffect(() => {
    const sync = () => setPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const filteredTools = useMemo(
    () => filterToolsForSystem(tools, query, filterValues.tool),
    [tools, query, filterValues.tool],
  );

  const charts = useMemo(() => hubCharts(filteredTools.length ? filteredTools : tools), [filteredTools, tools]);
  const kpis = useMemo(() => hubKpis(filteredTools.length ? filteredTools : tools), [filteredTools, tools]);

  const activeTool = useMemo(() => {
    const id = focusedId ?? hubTool.id;
    if (id === hubTool.id) return hubTool;
    return tools.find((t) => t.id === id) ?? hubTool;
  }, [focusedId, tools, hubTool]);

  const toolFilters = useMemo((): FilterDef[] => {
    const options = [...tools]
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` }));
    return [{ key: "tool", label: "Tool", options, showAllLabel: true }];
  }, [tools]);

  const handleFilterValuesChange = useCallback((next: FilterValues) => {
    setFilterValues(next);
    const picked = next.tool?.[0];
    if (picked) setFocusedId(picked);
  }, []);

  const kpiItems = useMemo(() => {
    const items = [];
    const total = resolveHubKpiIcon("total");
    if (total) items.push({ prefKey: "total", label: "Tools (shown)", value: kpis.total, icon: total.icon, tone: "indigo" as const });
    const ready = resolveHubKpiIcon("ready");
    if (ready) items.push({ prefKey: "ready", label: "Ready", value: kpis.ready, icon: ready.icon, tone: "emerald" as const });
    const releases = resolveHubKpiIcon("releases");
    if (releases) items.push({ prefKey: "releases", label: "With release", value: kpis.releases, icon: releases.icon, tone: "amber" as const });
    const drift = resolveHubKpiIcon("drift");
    if (drift) items.push({ prefKey: "drift", label: "Drift alerts", value: kpis.drift, icon: drift.icon, tone: "rose" as const });
    return items;
  }, [kpis]);

  const visCharts = visibleChartKeys(prefs.charts);

  return (
    <SystemHubShell
      placeholder="Search tool name, code, repo, tag…"
      filters={toolFilters}
      query={query}
      onQueryChange={setQuery}
      values={filterValues}
      onValuesChange={handleFilterValuesChange}
      kpiItems={kpiItems}
      charts={
        <>
          {visCharts.has("health_bar") ? <MiniBarChart title="By Health" items={charts.health.slice(0, 8)} /> : null}
          {visCharts.has("category_bar") ? <MiniBarChart title="By Category" items={charts.category.slice(0, 6)} /> : null}
          {visCharts.has("deploy_donut") ? <MiniDonut title="Deploy distribution" items={charts.deploy} /> : null}
          {visCharts.has("status_donut") ? <MiniDonut title="Status distribution" items={charts.status} /> : null}
        </>
      }
    >
      <ToolOverviewContent
        tool={activeTool}
        allTools={tools}
        hubChangelogRaw={changelogRaw}
        hideWorkspaceChrome
        onSelectTool={setFocusedId}
      />
    </SystemHubShell>
  );
}
