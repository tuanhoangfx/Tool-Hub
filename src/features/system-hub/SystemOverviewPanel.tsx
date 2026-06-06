import { useCallback, useEffect, useMemo, useState } from "react";
import changelogRaw from "../../../CHANGELOG.md?raw";
import manifestJson from "../../../tool.manifest.json";
import { Boxes } from "lucide-react";
import {
  HubResultCount,
  HubTimeRangeSelect,
  MiniBarChart,
  ViewToggle,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
} from "../../components/sales-shell";
import { useSessionState } from "../../hooks";
import { buildHubKpiItems } from "../hub/hub-kpi-items";
import { readHubListPrefs } from "../../lib/url-prefs";
import type { ResolvedTool, ToolManifest, ToolRepository } from "../../types";
import { hubCharts, hubKpis, matchesTimeRange } from "../hub/hub-aggregates";
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
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:overview:viewMode", "card");

  useEffect(() => {
    const sync = () => setPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const filteredTools = useMemo(
    () =>
      filterToolsForSystem(tools, query, filterValues.tool).filter((tool) =>
        matchesTimeRange(tool.updatedAt, prefs.range),
      ),
    [tools, query, filterValues.tool, prefs.range],
  );

  const charts = useMemo(() => hubCharts(filteredTools), [filteredTools]);
  const kpis = useMemo(() => hubKpis(filteredTools), [filteredTools]);

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

  const kpiItems = useMemo(() => buildHubKpiItems(kpis), [kpis]);

  const chartSlots = useMemo(
    () => ({
      health_bar: <MiniBarChart title="By Health" items={charts.health.slice(0, 8)} />,
      category_bar: <MiniBarChart title="By Category" items={charts.category.slice(0, 6)} />,
      deploy_bar: <MiniBarChart title="Deploy distribution" items={charts.deploy} />,
      status_bar: <MiniBarChart title="Status distribution" items={charts.status} />,
    }),
    [charts],
  );

  return (
    <SystemHubShell
      tabId="overview"
      placeholder="Search Overview by tool name, code, repo, tag..."
      filters={toolFilters}
      query={query}
      onQueryChange={setQuery}
      values={filterValues}
      onValuesChange={handleFilterValuesChange}
      toolbar={
        <>
          <HubTimeRangeSelect value={prefs.range} />
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <HubResultCount icon={Boxes} shown={filteredTools.length} total={tools.length} />
        </>
      }
      kpiItems={kpiItems}
      chartSlots={chartSlots}
    >
      <ToolOverviewContent
        tool={activeTool}
        allTools={tools}
        hubChangelogRaw={changelogRaw}
        hideWorkspaceChrome
        layoutMode={viewMode}
        scrollRootSelector=".hub-main"
        onSelectTool={setFocusedId}
      />
    </SystemHubShell>
  );
}
