import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prefetchAgentManifest } from "../../lib/hub-background-prefetch";
import { AlertTriangle, Bot } from "lucide-react";
import {
  HubDirectoryBulkActionBar,
  HubPaginatedCardGrid,
  hubDirectoryListResetKey,
  semanticKpiIcon,
  compactIconSize,
} from "@tool-workspace/hub-ui";
import {
  type HubViewMode,
  type FilterValues,
  type KpiTileData,
} from "../../components/sales-shell";

import { readHubListPrefs } from "../../lib/url-prefs";
import { matchesTimeRange } from "../hub/hub-aggregates";
import { useSessionState } from "../../hooks/useSessionState";
import { SystemDirectoryToolbar } from "./SystemDirectoryToolbar";
import { setSystemTab } from "./components/SystemTabs";
import { SYSTEM_AGENT_CHART_DEFS } from "./system-display-prefs";
import { SystemHubShell } from "./SystemHubShell";
import { AgentContextDetailModal } from "./agent-context/AgentContextDetailModal";
import { AgentContextCard } from "./agent-context/AgentContextCard";
import { AgentContextDirectoryBulkActions } from "./agent-context/AgentContextDirectoryBulkActions";
import { AgentContextTableView } from "./agent-context/AgentContextTableView";
import { agentContextCharts, agentContextKpis } from "./agent-context/agent-context-aggregates";
import {
  agentFiltersWithCounts,
  matchesAgentContext,
} from "./agent-context/agent-context-filters";
import { AGENT_KEYWORD_PRESETS, AGENT_ONBOARDING_PRESET } from "./agent-context/agent-context-filter-defs";
import { pickAgentSearchOpenItem } from "./agent-context/agent-context-search";
import { sortAgentContextItems } from "./agent-context/agent-context-sort";
import type { AgentContextItem } from "./agent-context/types";
import { useAgentManifest } from "./agent-context/useAgentManifest";

export function SystemAgentContextPanel() {
  const { items, manifest, loading, error, reload } = useAgentManifest();
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [detail, setDetail] = useState<AgentContextItem | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:agent:viewMode", "table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const searchDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    const sync = () => setPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    prefetchAgentManifest();
  }, []);

  const sortedItems = useMemo(() => sortAgentContextItems(items), [items]);

  const filters = useMemo(
    () => agentFiltersWithCounts(sortedItems, query, filterValues),
    [sortedItems, query, filterValues],
  );

  const filtered = useMemo(
    () =>
      sortedItems.filter(
        (item) => matchesAgentContext(item, query, filterValues) && matchesTimeRange(item.updatedAt, prefs.range),
      ),
    [sortedItems, query, filterValues, prefs.range],
  );

  const listResetKey = useMemo(
    () => hubDirectoryListResetKey(query, filterValues, prefs.range, viewMode, selectedIds.size),
    [query, filterValues, prefs.range, viewMode, selectedIds.size],
  );

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id));

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const item of filtered) next.delete(item.id);
        return next;
      }
      const next = new Set(prev);
      for (const item of filtered) next.add(item.id);
      return next;
    });
  }, [allVisibleSelected, filtered]);

  const openSelectedDetail = useCallback(() => {
    const firstId = [...selectedIds][0];
    const item = filtered.find((row) => row.id === firstId) ?? items.find((row) => row.id === firstId);
    if (item) setDetail(item);
  }, [filtered, items, selectedIds]);

  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setHighlightId(null);
      return;
    }
    searchDebounceRef.current = window.setTimeout(() => {
      const pick = pickAgentSearchOpenItem(filtered, q);
      setHighlightId(pick?.id ?? filtered[0]?.id ?? null);
      if (pick) setDetail(pick);
    }, 420);
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, [query, filtered]);

  const kpis = useMemo(() => agentContextKpis(filtered), [filtered]);
  const charts = useMemo(() => agentContextCharts(filtered), [filtered]);

  const kpiItems = useMemo<KpiTileData[]>(
    () => [
      { prefKey: "total", label: "Items (shown)", value: kpis.shown, ...semanticKpiIcon("kpi.agent.items") },
      { prefKey: "rules", label: "Rules", value: kpis.rules, ...semanticKpiIcon("kpi.agent.rules") },
      { prefKey: "skills", label: "Skills", value: kpis.skills, ...semanticKpiIcon("kpi.agent.skills") },
      { prefKey: "patterns", label: "Patterns", value: kpis.patterns, ...semanticKpiIcon("kpi.agent.patterns") },
      { prefKey: "agents", label: "Subagents", value: kpis.agents, ...semanticKpiIcon("kpi.agent.subagents") },
      { prefKey: "commands", label: "Commands", value: kpis.commands, ...semanticKpiIcon("kpi.agent.commands") },
      { prefKey: "always", label: "Always on", value: kpis.always, ...semanticKpiIcon("kpi.agent.always") },
      { prefKey: "requestable", label: "Agent requestable", value: kpis.requestable, ...semanticKpiIcon("kpi.agent.requestable") },
    ],
    [kpis],
  );

  const chartBand = useMemo(
    () => ({
      defs: SYSTEM_AGENT_CHART_DEFS,
      data: {
        health_bar: charts.kind,
        category_bar: charts.scope,
        deploy_bar: charts.apply,
        status_bar: charts.size,
      },
    }),
    [charts],
  );

  const applyKeywordPreset = useCallback((preset: (typeof AGENT_KEYWORD_PRESETS)[keyof typeof AGENT_KEYWORD_PRESETS]) => {
    setFilterValues({ ...preset });
    setQuery("");
  }, []);

  const toolbar = useMemo(
    () => (
      <SystemDirectoryToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        countIcon={Bot}
        shown={filtered.length}
        total={items.length}
        countLabel="items"
        refreshing={loading}
        onRefresh={() => void reload()}
        showTimeRange
        timeRange={prefs.range}
      />
    ),
    [filtered.length, items.length, loading, reload, viewMode, setViewMode, prefs.range],
  );

  const filterRowActions = useMemo(
    () => (
      <HubDirectoryBulkActionBar
        selectAll={
          viewMode === "card"
            ? {
                visibleCount: filtered.length,
                selectedCount: selectedIds.size,
                allVisibleSelected,
                onToggleSelectAll: handleToggleSelectAll,
                noun: "items",
              }
            : null
        }
      >
        <AgentContextDirectoryBulkActions
          hasSelection={selectedIds.size > 0}
          selectedCount={selectedIds.size}
          onOpenSelected={openSelectedDetail}
          onApplyPreset={applyKeywordPreset}
          onOnboarding={() => {
            setFilterValues({ ...AGENT_ONBOARDING_PRESET });
            setQuery("");
          }}
          onOpenSkillsCatalog={() => setSystemTab("skills")}
        />
      </HubDirectoryBulkActionBar>
    ),
    [
      allVisibleSelected,
      applyKeywordPreset,
      filtered.length,
      handleToggleSelectAll,
      openSelectedDetail,
      selectedIds.size,
      setFilterValues,
      setQuery,
      viewMode,
    ],
  );

  const body = (
    <>
      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          <AlertTriangle size={compactIconSize(16)} />
          {error}
          <button type="button" className="ml-auto text-xs underline" onClick={() => void reload()}>
            Retry
          </button>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">Loading agent context in background…</p>
      ) : items.length === 0 && !error ? (
        <p className="py-10 text-center text-sm text-[var(--muted)]">
          No agent manifest items. Use sidebar <strong>Refresh</strong> or the toolbar button (rebuilds manifest in dev).
        </p>
      ) : filtered.length === 0 ? null : viewMode === "table" ? (
        <AgentContextTableView
          items={filtered}
          highlightId={highlightId}
          resetKey={listResetKey}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onOpen={setDetail}
        />
      ) : (
        <HubPaginatedCardGrid
          items={filtered}
          resetKey={listResetKey}
          ariaLabel="Agent context card pages"
        >
          {(pageItems) =>
            pageItems.map((item) => (
              <AgentContextCard
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onToggleSelect={handleToggleSelect}
                onOpen={setDetail}
              />
            ))
          }
        </HubPaginatedCardGrid>
      )}
    </>
  );

  return (
    <>
      <SystemHubShell
        tabId="agent"
        sectionRuleLabel="Agent context"
        placeholder="Search keyword, skill, example, golden, clone, path…"
        filters={filters}
        query={query}
        onQueryChange={setQuery}
        values={filterValues}
        onValuesChange={setFilterValues}
        toolbar={toolbar}
        filterRowActions={filterRowActions}
        kpiItems={kpiItems}
        chartBand={chartBand}
      >
        {body}
      </SystemHubShell>
      <AgentContextDetailModal
        item={detail}
        manifestGeneratedAt={manifest?.generatedAt}
        onClose={() => setDetail(null)}
      />
    </>
  );
}
