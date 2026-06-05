import { useEffect, useMemo, useState } from "react";
import { prefetchAgentManifest } from "../../lib/hub-background-prefetch";
import { AlertTriangle, BookOpen, Bot, Command, Layers, RefreshCw, ScrollText, Sparkles, Wand2 } from "lucide-react";
import {
  HubResultCount,
  MiniBarChart,
  MiniDonut,
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
import { sortAgentContextItems } from "./agent-context/agent-context-sort";
import type { AgentContextItem } from "./agent-context/types";
import { useAgentManifest } from "./agent-context/useAgentManifest";

export function SystemAgentContextPanel() {
  const { items, manifest, loading, error, reload } = useAgentManifest();
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [detail, setDetail] = useState<AgentContextItem | null>(null);
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:agent:viewMode", "table");

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

  const kpis = useMemo(() => agentContextKpis(filtered), [filtered]);
  const charts = useMemo(() => agentContextCharts(filtered), [filtered]);

  const kpiItems = useMemo<KpiTileData[]>(
    () => [
      { prefKey: "total", label: "Items (shown)", value: kpis.shown, icon: Bot, tone: "indigo" },
      { prefKey: "rules", label: "Rules", value: kpis.rules, icon: ScrollText, tone: "emerald" },
      { prefKey: "skills", label: "Skills", value: kpis.skills, icon: Sparkles, tone: "purple" },
      { prefKey: "patterns", label: "Patterns", value: kpis.patterns, icon: Wand2, tone: "indigo" },
      { prefKey: "agents", label: "Subagents", value: kpis.agents, icon: Bot, tone: "indigo" },
      { prefKey: "commands", label: "Commands", value: kpis.commands, icon: Command, tone: "amber" },
      { prefKey: "always", label: "Always on", value: kpis.always, icon: BookOpen, tone: "amber" },
      { prefKey: "requestable", label: "Agent requestable", value: kpis.requestable, icon: Layers, tone: "purple" },
    ],
    [kpis],
  );

  const chartSlots = useMemo(
    () => ({
      health_bar: <MiniBarChart title="By kind" items={charts.kind.slice(0, 8)} />,
      category_bar: <MiniBarChart title="By scope" items={charts.scope.slice(0, 6)} />,
      deploy_donut: <MiniDonut title="Apply mode" items={charts.apply} />,
      status_donut: <MiniDonut title="Size (lines)" items={charts.size} />,
    }),
    [charts],
  );

  const toolbar = useMemo(
    () => (
      <>
        <ViewToggle value={viewMode} onChange={setViewMode} />
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
    [filtered.length, items.length, loading, reload, viewMode, setViewMode],
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
        <AgentContextTableView items={filtered} onOpen={setDetail} />
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <AgentContextCard key={item.id} item={item} onOpen={setDetail} />
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      <SystemHubShell
        tabId="agent"
        sectionRuleLabel="Agent context"
        placeholder="Search rules, skills, paths, triggers…"
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
