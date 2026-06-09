import { useEffect, useMemo, useRef, useState } from "react";
import { prefetchAgentManifest } from "../../lib/hub-background-prefetch";
import { AlertTriangle, BookOpen, Bot, Command, GitBranch, RefreshCw, Zap } from "lucide-react";
import { HubPaginatedCardGrid, semanticKpiIcon } from "@tool-workspace/hub-ui";
import {
  HubResultCount,
  MiniBarChart,
  ViewToggle,
  type HubViewMode,
  type FilterValues,
  type KpiTileData,
} from "../../components/sales-shell";
import { compactIconSize } from "../../lib/ui-scale";
import { useSessionState } from "../../hooks/useSessionState";
import { SystemHubShell } from "./SystemHubShell";
import { AgentContextDetailModal } from "./agent-context/AgentContextDetailModal";
import { AgentContextCard } from "./agent-context/AgentContextCard";
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
  const searchDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    prefetchAgentManifest();
  }, []);

  const sortedItems = useMemo(() => sortAgentContextItems(items), [items]);

  const filters = useMemo(
    () => agentFiltersWithCounts(sortedItems, query, filterValues),
    [sortedItems, query, filterValues],
  );

  const filtered = useMemo(
    () => sortedItems.filter((item) => matchesAgentContext(item, query, filterValues)),
    [sortedItems, query, filterValues],
  );

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

  const chartSlots = useMemo(
    () => ({
      health_bar: <MiniBarChart title="By kind" items={charts.kind.slice(0, 8)} />,
      category_bar: <MiniBarChart title="By scope" items={charts.scope.slice(0, 6)} />,
      deploy_bar: <MiniBarChart title="Apply mode" items={charts.apply} />,
      status_bar: <MiniBarChart title="Size (lines)" items={charts.size} />,
    }),
    [charts],
  );

  const applyKeywordPreset = (preset: (typeof AGENT_KEYWORD_PRESETS)[keyof typeof AGENT_KEYWORD_PRESETS]) => {
    setFilterValues({ ...preset });
    setQuery("");
  };

  const toolbar = useMemo(
    () => (
      <>
        <ViewToggle value={viewMode} onChange={setViewMode} />
        <button
          type="button"
          onClick={() => {
            setFilterValues({ ...AGENT_ONBOARDING_PRESET });
            setQuery("");
          }}
          className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20"
          title="Keyword guide + infra stack + 5 core skills"
        >
          <BookOpen size={compactIconSize(14)} />
          Onboarding
        </button>
        <button
          type="button"
          onClick={() => applyKeywordPreset(AGENT_KEYWORD_PRESETS.allKeywords)}
          className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[.04] px-2.5 text-xs font-medium text-[var(--muted)] hover:border-indigo-300/25 hover:text-indigo-100"
          title="All 16 ship/pattern keywords"
        >
          <Command size={compactIconSize(13)} />
          Keywords
        </button>
        <button
          type="button"
          onClick={() => applyKeywordPreset(AGENT_KEYWORD_PRESETS.verify)}
          className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center rounded-lg border border-white/10 bg-white/[.04] px-2.5 text-xs font-medium text-[var(--muted)] hover:border-indigo-300/25 hover:text-indigo-100"
          title="Ship · Loop · Fix · Smoke"
        >
          Verify
        </button>
        <button
          type="button"
          onClick={() => applyKeywordPreset(AGENT_KEYWORD_PRESETS.git)}
          className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center rounded-lg border border-white/10 bg-white/[.04] px-2.5 text-xs font-medium text-[var(--muted)] hover:border-indigo-300/25 hover:text-indigo-100"
          title="Git · Push · Deploy · Release"
        >
          <GitBranch size={compactIconSize(13)} />
          Git
        </button>
        <button
          type="button"
          onClick={() => applyKeywordPreset(AGENT_KEYWORD_PRESETS.pattern)}
          className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center rounded-lg border border-white/10 bg-white/[.04] px-2.5 text-xs font-medium text-[var(--muted)] hover:border-indigo-300/25 hover:text-indigo-100"
          title="Directory · Inbox · Dashboard · …"
        >
          Pattern
        </button>
        <button
          type="button"
          onClick={() => applyKeywordPreset(AGENT_KEYWORD_PRESETS.supabase)}
          className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center rounded-lg border border-white/10 bg-white/[.04] px-2.5 text-xs font-medium text-[var(--muted)] hover:border-indigo-300/25 hover:text-indigo-100"
          title="Migrate P00xx"
        >
          <Zap size={compactIconSize(13)} />
          Supabase
        </button>
        <HubResultCount icon={Bot} shown={filtered.length} total={items.length} />
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 text-xs font-medium text-indigo-100 hover:bg-indigo-500/20 disabled:opacity-50"
        >
          <RefreshCw size={compactIconSize(14)} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </>
    ),
    [filtered.length, items.length, loading, reload, viewMode, setViewMode, setFilterValues, setQuery],
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
        <AgentContextTableView items={filtered} highlightId={highlightId} onOpen={setDetail} />
      ) : (
        <HubPaginatedCardGrid
          items={filtered}
          resetKey={`${query}|${JSON.stringify(filterValues)}`}
          ariaLabel="Agent context card pages"
        >
          {(pageItems) => pageItems.map((item) => <AgentContextCard key={item.id} item={item} onOpen={setDetail} />)}
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
        kpiItems={kpiItems}
        chartSlots={chartSlots}
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
