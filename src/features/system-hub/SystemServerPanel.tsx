import { useCallback, useMemo, useState } from "react";
import { Server } from "lucide-react";
import {
  chartBreakdownFromLabels,
  HubPaginatedCardGrid,
  HubPaginatedTableShell,
  hubDirectoryListResetKey,
  semanticKpiIcon,
} from "@tool-workspace/hub-ui";
import { type FilterDef, type FilterValues, type HubViewMode } from "../../components/sales-shell";
import { SystemDirectoryToolbar } from "./SystemDirectoryToolbar";
import { EmptyState } from "../../components/EmptyState";
import { resolveDeployBadge } from "../../lib/badge-registry";
import { useSessionState } from "../../hooks";
import type { ResolvedTool } from "../../types";
import { QuietChip, ToolCodeBadge } from "../hub/hub-tool-ui";
import { toolCategoryForCode } from "./supabase-project-tools";
import { SYSTEM_SERVER_CHART_DEFS } from "./system-display-prefs";
import { SystemHubShell } from "./SystemHubShell";
import { buildHostingDeployRows, hostingRowsForQuotaTab } from "./hosting-quota-build";
import { hostingFiltersWithCounts, matchesHostingRow } from "./hosting-quota-filters";
import type { HostingDeployRow } from "./hosting-quota-types";
import { HostingDeployCard } from "./HostingDeployCard";
import { HostingDeployDetailModal } from "./HostingDeployDetailModal";

function uniq<T>(items: T[]) {
  return [...new Set(items)];
}

function normLabel(v: string | null | undefined) {
  const s = (v ?? "").trim();
  return s || "—";
}

const DEPLOY_TABLE_COLUMNS = ["Provider", "Host", "Deployment", "Tools", "Region", "Plan", "URL", "Health", "Notes"] as const;

function DeployTable({
  rows,
  onOpen,
  resetKey,
}: {
  rows: HostingDeployRow[];
  onOpen: (id: string) => void;
  resetKey?: string | number | boolean | null;
}) {
  return (
    <HubPaginatedTableShell items={rows} resetKey={resetKey} ariaLabel="Deployments table pages">
      {(pageRows) => (
    <div className="hub-users-table-wrap overflow-x-auto">
      <table className="hub-users-table hub-users-table--wide min-w-[960px]">
        <thead>
          <tr>
            {DEPLOY_TABLE_COLUMNS.map((label) => (
              <th key={label} scope="col">
                <span className="hub-users-th-text">{label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row) => (
            <tr key={row.id} className="hub-users-row" onClick={() => onOpen(row.id)}>
              <td className="align-top text-[11px] text-[var(--text)]">{row.providerLabel}</td>
              <td className="align-top font-mono text-[11px] text-indigo-200/90">{row.hostSlug}</td>
              <td className="align-top font-medium text-[var(--text)]">{row.name}</td>
              <td className="align-top" onClick={(e) => e.stopPropagation()}>
                <span className="inline-flex flex-wrap gap-1">
                  {row.toolCodes.map((code) => (
                    <ToolCodeBadge key={code} code={code} category={toolCategoryForCode(code)} />
                  ))}
                </span>
              </td>
              <td className="align-top text-[11px] text-[var(--muted)]">{normLabel(row.region)}</td>
              <td className="align-top text-[11px] text-[var(--muted)]">{normLabel(row.plan ?? row.status)}</td>
              <td className="align-top text-[11px]" onClick={(e) => e.stopPropagation()}>
                {row.publicUrl ? (
                  <a href={row.publicUrl} target="_blank" rel="noreferrer" className="text-indigo-300 hover:underline">
                    {row.publicUrl.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="align-top">
                <QuietChip label={row.healthLabel} tone={row.driftCount > 0 ? "bad" : row.publicUrl ? "ok" : "warn"} />
              </td>
              <td className="align-top text-[11px] text-[var(--muted)]">{row.note ?? (row.error ? row.error.slice(0, 80) : "—")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
      )}
    </HubPaginatedTableShell>
  );
}

export function SystemServerPanel({ tools }: { tools: ResolvedTool[] }) {
  const rowsRaw = useMemo(() => hostingRowsForQuotaTab(buildHostingDeployRows(tools)), [tools]);
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:server:viewMode", "card");
  const [modalId, setModalId] = useState<string | null>(null);

  const providerOptions = useMemo(() => {
    const values = uniq(rowsRaw.map((r) => r.provider)).sort();
    return values.map((v) => ({ value: v, label: resolveDeployBadge(v).label }));
  }, [rowsRaw]);

  const hostOptions = useMemo(() => {
    const values = uniq(rowsRaw.map((r) => normLabel(r.hostSlug))).sort((a, b) => a.localeCompare(b));
    return values.map((v) => ({ value: v, label: v }));
  }, [rowsRaw]);

  const toolOptions = useMemo(() => {
    const values = uniq(rowsRaw.flatMap((r) => r.toolCodes)).sort((a, b) => a.localeCompare(b));
    return values.map((v) => ({ value: v, label: v }));
  }, [rowsRaw]);

  const filtersBase = useMemo((): FilterDef[] => {
    return [
      { key: "provider", label: "Provider", options: providerOptions, showAllLabel: true },
      { key: "host", label: "Host", options: hostOptions, showAllLabel: true },
      { key: "tool", label: "Tool", options: toolOptions, showAllLabel: true },
      {
        key: "health",
        label: "Health",
        options: [
          { value: "ok", label: "OK" },
          { value: "drift", label: "Drift" },
          { value: "gap", label: "Link gap" },
          { value: "error", label: "Error" },
        ],
        showAllLabel: true,
      },
    ];
  }, [providerOptions, hostOptions, toolOptions]);

  const filters = useMemo(
    () => hostingFiltersWithCounts(rowsRaw, filtersBase, query, filterValues),
    [rowsRaw, filtersBase, query, filterValues],
  );

  const rowsFiltered = useMemo(
    () => rowsRaw.filter((r) => matchesHostingRow(r, query, filterValues)),
    [rowsRaw, query, filterValues],
  );

  const kpis = useMemo(() => {
    const hostsShown = new Set(rowsFiltered.map((r) => `${r.provider}:${r.hostSlug}`)).size;
    const errors = rowsFiltered.filter((r) => Boolean(r.error)).length;
    const restricted = rowsFiltered.filter((r) => r.driftCount > 0 || r.linkGap).length;
    const catalogOnly = rowsFiltered.filter((r) => !r.publicUrl).length;
    const withUrl = rowsFiltered.filter((r) => Boolean(r.publicUrl)).length;
    const toolsLinked = rowsFiltered.reduce((n, r) => n + r.toolCodes.length, 0);
    const ready = rowsFiltered.filter((r) => r.status === "ready" || r.healthLabel.toLowerCase() === "ready").length;
    return {
      total: rowsFiltered.length,
      hosts: hostsShown,
      errors,
      restricted,
      catalogOnly,
      withUrl,
      toolsLinked,
      ready,
    };
  }, [rowsFiltered]);

  const charts = useMemo(
    () => ({
      byProvider: chartBreakdownFromLabels(rowsFiltered.map((r) => r.providerLabel)),
      byHealth: chartBreakdownFromLabels(rowsFiltered.map((r) => r.healthLabel)),
    }),
    [rowsFiltered],
  );

  const kpiItems = useMemo(
    () => [
      { prefKey: "total", label: "Deployments (shown)", value: kpis.total, ...semanticKpiIcon("kpi.total") },
      { prefKey: "metrics", label: "Live URL", value: kpis.withUrl, ...semanticKpiIcon("kpi.live") },
      { prefKey: "catalog", label: "No public URL", value: kpis.catalogOnly, ...semanticKpiIcon("kpi.catalog") },
      { prefKey: "orgs", label: "Hosts", value: kpis.hosts, ...semanticKpiIcon("kpi.hosts") },
      { prefKey: "errors", label: "Errors", value: kpis.errors, ...semanticKpiIcon("kpi.errors") },
      { prefKey: "restricted", label: "Drift alerts", value: kpis.restricted, ...semanticKpiIcon("kpi.drift") },
      { prefKey: "api_total", label: "Tools linked", value: kpis.toolsLinked, ...semanticKpiIcon("kpi.toolsLinked") },
      { prefKey: "api_rest", label: "Ready", value: kpis.ready, ...semanticKpiIcon("kpi.ready") },
    ],
    [kpis],
  );

  const chartBand = useMemo(
    () => ({
      defs: SYSTEM_SERVER_CHART_DEFS,
      data: {
        category_bar: charts.byProvider,
        health_bar: charts.byHealth,
      },
    }),
    [charts],
  );

  const modalRow = useMemo(() => rowsRaw.find((r) => r.id === modalId) ?? null, [rowsRaw, modalId]);
  const openRow = useCallback((id: string) => setModalId(id), []);
  const closeModal = useCallback(() => setModalId(null), []);

  const listResetKey = useMemo(
    () => hubDirectoryListResetKey(query, filterValues, viewMode),
    [query, filterValues, viewMode],
  );

  const toolbar = useMemo(
    () => (
      <SystemDirectoryToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        countIcon={Server}
        shown={rowsFiltered.length}
        total={rowsRaw.length}
        countLabel="deployments"
        refreshing={false}
        onRefresh={() => {}}
        showTimeRange={false}
        showRefresh={false}
      />
    ),
    [viewMode, setViewMode, rowsFiltered.length, rowsRaw.length],
  );

  const body =
    rowsRaw.length === 0 ? (
      <div className="rounded-2xl border border-white/5 bg-white/[.02] p-10 text-center text-sm text-[var(--muted)]">
        No VPS or Vercel deployments in the workspace catalog. Add <code className="text-xs">deployTarget: vps</code> or{" "}
        <code className="text-xs">vercel</code> tools, or refresh <code className="text-xs">vps-inventory.json</code>.
      </div>
    ) : viewMode === "card" ? (
      rowsFiltered.length === 0 ? (
        <EmptyState />
      ) : (
        <HubPaginatedCardGrid
          items={rowsFiltered}
          resetKey={listResetKey}
          ariaLabel="Deployments card pages"
        >
          {(pageRows) => pageRows.map((row) => <HostingDeployCard key={row.id} row={row} onOpen={openRow} />)}
        </HubPaginatedCardGrid>
      )
    ) : (
      <DeployTable rows={rowsFiltered} onOpen={openRow} resetKey={listResetKey} />
    );

  return (
    <>
      <SystemHubShell
        tabId="server"
        sectionRuleLabel="Deployments"
        placeholder="Search hosting by provider, host, tool, deployment, URL, region..."
        filters={filters}
        query={query}
        onQueryChange={setQuery}
        values={filterValues}
        onValuesChange={setFilterValues}
        toolbar={toolbar}
        kpiItems={kpiItems}
        chartBand={chartBand}
      >
        {body}
      </SystemHubShell>
      <HostingDeployDetailModal row={modalRow} tools={tools} onClose={closeModal} />
    </>
  );
}
