import { useCallback, useEffect, useMemo, useState } from "react";
import { Server } from "lucide-react";
import inventory from "../../../public/vps-inventory.json";
import {
  HubResultCount,
  HubTimeRangeSelect,
  MiniBarChart,
  MiniDonut,
  ViewToggle,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
} from "../../components/sales-shell";
import { useSessionState } from "../../hooks";
import { resolveHubKpiIcon } from "../../lib/badge-registry";
import { readHubListPrefs } from "../../lib/url-prefs";
import type { ResolvedTool } from "../../types";
import { hubCharts, hubKpis, matchesTimeRange } from "../hub/hub-aggregates";
import { DEFAULT_HUB_CHART_KEYS } from "../hub/hub-prefs";
import { ToolOverviewContent } from "../overview/ToolOverviewContent";
import { SystemHubShell } from "./SystemHubShell";
import { filterToolsForSystem } from "./system-hub-aggregates";
import { VpsHostSnapshotStrip } from "./VpsHostSnapshotStrip";

type VpsInventory = typeof inventory;

function vpsToolsOnly(tools: ResolvedTool[]) {
  return tools.filter((t) => t.deployTarget === "vps" && t.code);
}

function defaultVpsFocusId(tools: ResolvedTool[]) {
  const vps = vpsToolsOnly(tools);
  const prefer = ["P0006", "P0007", "P0005"];
  for (const code of prefer) {
    const hit = vps.find((t) => t.code === code);
    if (hit) return hit.id;
  }
  return vps[0]?.id ?? null;
}

function visibleChartKeys(set: Set<string> | null) {
  return set ?? DEFAULT_HUB_CHART_KEYS;
}

export function SystemServerPanel({ tools }: { tools: ResolvedTool[] }) {
  const inv = inventory as VpsInventory;
  const catalog = useMemo(() => vpsToolsOnly(tools), [tools]);

  const [focusedId, setFocusedId] = useState<string | null>(() => defaultVpsFocusId(tools));
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:server:viewMode", "card");

  useEffect(() => {
    const sync = () => setPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    if (!focusedId && catalog.length) setFocusedId(defaultVpsFocusId(tools));
  }, [focusedId, catalog.length, tools]);

  const filteredTools = useMemo(
    () =>
      filterToolsForSystem(catalog, query, filterValues.tool).filter((tool) =>
        matchesTimeRange(tool.updatedAt, prefs.range),
      ),
    [catalog, query, filterValues.tool, prefs.range],
  );

  const charts = useMemo(() => hubCharts(filteredTools), [filteredTools]);
  const kpis = useMemo(() => hubKpis(filteredTools), [filteredTools]);

  const activeTool = useMemo(() => {
    const id = focusedId ?? defaultVpsFocusId(tools);
    if (!id) return catalog[0];
    return tools.find((t) => t.id === id) ?? catalog.find((t) => t.id === id) ?? catalog[0];
  }, [focusedId, tools, catalog]);

  const toolFilters = useMemo((): FilterDef[] => {
    const options = [...catalog]
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` }));
    return [{ key: "tool", label: "VPS tool", options, showAllLabel: true }];
  }, [catalog]);

  const handleFilterValuesChange = useCallback((next: FilterValues) => {
    setFilterValues(next);
    const picked = next.tool?.[0];
    if (picked) setFocusedId(picked);
  }, []);

  const kpiItems = useMemo(() => {
    const items = [];
    const host = resolveHubKpiIcon("total");
    if (host)
      items.push({
        prefKey: "host",
        label: "VPS host",
        value: inv.host,
        hint: `${inv.provider} · ${catalog.length} tools`,
        icon: host.icon,
        tone: "amber" as const,
      });
    const ready = resolveHubKpiIcon("ready");
    if (ready)
      items.push({
        prefKey: "ready",
        label: "Ready",
        value: kpis.ready,
        icon: ready.icon,
        tone: "emerald" as const,
      });
    const releases = resolveHubKpiIcon("releases");
    if (releases)
      items.push({
        prefKey: "releases",
        label: "With release",
        value: kpis.releases,
        icon: releases.icon,
        tone: "amber" as const,
      });
    const drift = resolveHubKpiIcon("drift");
    if (drift)
      items.push({
        prefKey: "drift",
        label: "Drift alerts",
        value: kpis.drift,
        icon: drift.icon,
        tone: "rose" as const,
      });
    return items;
  }, [inv.host, inv.provider, catalog.length, kpis]);

  const visCharts = visibleChartKeys(prefs.charts);

  if (!activeTool) {
    return (
      <p className="py-8 text-center text-sm text-[var(--muted)]">
        No tools with <code className="text-xs">deployTarget: vps</code> in the workspace catalog.
      </p>
    );
  }

  return (
    <SystemHubShell
      stickyFilterTab="server"
      placeholder="Search Server by tool name, code, repo, tag..."
      filters={toolFilters}
      query={query}
      onQueryChange={setQuery}
      values={filterValues}
      onValuesChange={handleFilterValuesChange}
      toolbar={
        <>
          <HubTimeRangeSelect value={prefs.range} />
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <HubResultCount icon={Server} shown={filteredTools.length} total={catalog.length} />
        </>
      }
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
      <VpsHostSnapshotStrip inventory={inv} />
      <ToolOverviewContent
        tool={activeTool}
        allTools={catalog}
        hideWorkspaceChrome
        layoutMode={viewMode}
        scrollRootSelector=".hub-main"
        onSelectTool={setFocusedId}
        idPrefix="server-"
      />
    </SystemHubShell>
  );
}
