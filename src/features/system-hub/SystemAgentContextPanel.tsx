import { useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Bot, RefreshCw, ScrollText, Sparkles } from "lucide-react";
import {
  HubResultCount,
  HubLoadingView,
  MiniBarChart,
  MiniDonut,
  ViewToggle,
  type HubViewMode,
  type FilterValues,
  type KpiTileData,
} from "../../components/sales-shell";
import { EmptyState } from "../../components/EmptyState";
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
import { HubLikeDataSectionRule } from "./agent-context/HubLikeDataSectionRule";
import type { AgentContextItem } from "./agent-context/types";
import { useAgentManifest } from "./agent-context/useAgentManifest";

/** Agent context — flat list + Hub shell (FilterBar / KPI / charts). */
export function SystemAgentContextPanel() {
  const { items, manifest, loading, error, reload } = useAgentManifest();
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [detail, setDetail] = useState<AgentContextItem | null>(null);
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:agent:viewMode", "card");

  const filters = useMemo(
    () => agentFiltersWithCounts(items, query, filterValues),
    [items, query, filterValues],
  );

  const filtered = useMemo(
    () => items.filter((item) => matchesAgentContext(item, query, filterValues)),
    [items, query, filterValues],
  );

  const kpis = useMemo(() => agentContextKpis(filtered), [filtered]);
  const charts = useMemo(() => agentContextCharts(filtered), [filtered]);

  const kpiItems = useMemo<KpiTileData[]>(
    () => [
      { prefKey: "total", label: "Items (shown)", value: kpis.shown, icon: Bot, tone: "indigo" },
      { prefKey: "rules", label: "Rules", value: kpis.rules, icon: ScrollText, tone: "emerald" },
      { prefKey: "skills", label: "Skills", value: kpis.skills, icon: Sparkles, tone: "purple" },
      { prefKey: "always", label: "Always on", value: kpis.always, icon: BookOpen, tone: "amber" },
    ],
    [kpis],
  );

  const chartsNode = useMemo(
    () => (
      <>
        <MiniBarChart title="By kind" items={charts.kind.slice(0, 8)} />
        <MiniBarChart title="By scope" items={charts.scope.slice(0, 6)} />
        <MiniDonut title="Apply mode" items={charts.apply} />
        <MiniDonut title="Size (lines)" items={charts.size} />
      </>
    ),
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
          Sync manifest
        </button>
      </>
    ),
    [filtered.length, items.length, loading, reload, viewMode, setViewMode],
  );

  if (loading && items.length === 0) {
    return (
      <div className="relative min-h-[min(360px,50vh)]">
        <HubLoadingView icon={Bot} ariaLabel="Loading agent context" variant="overlay" />
      </div>
    );
  }

  const body = (
    <>
      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          <AlertTriangle size={compactIconSize(16)} />
          {error}
          <button type="button" className="ml-auto text-xs underline" onClick={() => void reload()}>
            Retry
          </button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title="No agent context items" description="Adjust filters or run Sync manifest after build." />
      ) : viewMode === "table" ? (
        <div className="pb-8">
          <HubLikeDataSectionRule label="Agent context" />
          <AgentContextTableView items={filtered} onOpen={setDetail} />
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          <HubLikeDataSectionRule label="Agent context" />
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <AgentContextCard key={item.id} item={item} onOpen={setDetail} />
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <SystemHubShell
        placeholder="Search rules, skills, paths, triggers…"
        filters={filters}
        query={query}
        onQueryChange={setQuery}
        values={filterValues}
        onValuesChange={setFilterValues}
        toolbar={toolbar}
        kpiItems={kpiItems}
        charts={chartsNode}
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
