import { useCallback, useMemo, useState } from "react";
import { Gauge, Server } from "lucide-react";
import { HubPaginatedCardGrid, HubPaginatedTableShell } from "@tool-workspace/hub-ui";
import {
  HubResultCount,
  MiniBarChart,
  ViewToggle,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
} from "../../components/sales-shell";
import { EmptyState } from "../../components/EmptyState";
import { resolveDeployBadge } from "../../lib/badge-registry";
import { useSessionState } from "../../hooks";
import type { ResolvedTool } from "../../types";
import { QuietChip, ToolCodeBadge } from "../hub/hub-tool-ui";
import { toolCategoryForCode } from "./supabase-project-tools";
import { SystemHubShell } from "./SystemHubShell";
import { buildHostingDeployRows, hostingRowsForQuotaTab } from "./hosting-quota-build";
import { hostingFiltersWithCounts, matchesHostingRow } from "./hosting-quota-filters";
import type { HostingDeployRow } from "./hosting-quota-types";
import { HostingDeployCard } from "./HostingDeployCard";
import { HostingDeployDetailModal } from "./HostingDeployDetailModal";

function normLabel(v: string | null | undefined) {
  const t = (v ?? "").trim();
  return t ? t : "—";
}

function uniq<T>(items: T[]) {
  return [...new Set(items)];
}

function breakdown(labels: Array<string | null | undefined>): Array<{ label: string; value: number }> {
  const map = new Map<string, number>();
  for (const label of labels) {
    const key = normLabel(label);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

const DEPLOY_TABLE_COLUMNS = ["Provider", "Host", "Deployment", "Tools", "Region", "Plan", "URL", "Health", "Notes"] as const;

function DeployTable({ rows, onOpen }: { rows: HostingDeployRow[]; onOpen: (id: string) => void }) {
  return (
    <HubPaginatedTableShell items={rows} ariaLabel="Deployments table pages">
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
      byProvider: breakdown(rowsFiltered.map((r) => r.providerLabel)),
      byHealth: breakdown(rowsFiltered.map((r) => r.healthLabel)),
    }),
    [rowsFiltered],
  );

  const kpiItems = useMemo(
    () => [
      { prefKey: "total", label: "Deployments (shown)", value: kpis.total, icon: Gauge, tone: "indigo" as const },
      { prefKey: "metrics", label: "Live URL", value: kpis.withUrl, icon: Gauge, tone: "emerald" as const },
      { prefKey: "catalog", label: "No public URL", value: kpis.catalogOnly, icon: Gauge, tone: "purple" as const },
      { prefKey: "orgs", label: "Hosts", value: kpis.hosts, icon: Gauge, tone: "emerald" as const },
      { prefKey: "errors", label: "Errors", value: kpis.errors, icon: Gauge, tone: "rose" as const },
      { prefKey: "restricted", label: "Drift alerts", value: kpis.restricted, icon: Gauge, tone: "rose" as const },
      { prefKey: "api_total", label: "Tools linked", value: kpis.toolsLinked, icon: Gauge, tone: "blue" as const },
      { prefKey: "api_rest", label: "Ready", value: kpis.ready, icon: Gauge, tone: "purple" as const },
    ],
    [kpis],
  );

  const chartSlots = useMemo(() => {
    const palette = ["#818cf8", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#f43f5e"];
    const providerItems = charts.byProvider.slice(0, 8).map((i, idx) => ({
      ...i,
      color: palette[idx % palette.length],
    }));
    const healthItems = charts.byHealth.slice(0, 8).map((i, idx) => ({
      ...i,
      color: palette[idx % palette.length],
    }));
    return {
      category_bar: <MiniBarChart title="By provider" items={providerItems} />,
      health_bar: <MiniBarChart title="By health" items={healthItems} />,
    };
  }, [charts]);

  const modalRow = useMemo(() => rowsRaw.find((r) => r.id === modalId) ?? null, [rowsRaw, modalId]);
  const openRow = useCallback((id: string) => setModalId(id), []);
  const closeModal = useCallback(() => setModalId(null), []);

  const toolbar = useMemo(
    () => (
      <>
        <ViewToggle value={viewMode} onChange={setViewMode} />
        <HubResultCount icon={Server} shown={rowsFiltered.length} total={rowsRaw.length} label="deployments" />
      </>
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
          resetKey={`${query}|${JSON.stringify(filterValues)}`}
          ariaLabel="Deployments card pages"
        >
          {(pageRows) => pageRows.map((row) => <HostingDeployCard key={row.id} row={row} onOpen={openRow} />)}
        </HubPaginatedCardGrid>
      )
    ) : (
      <DeployTable rows={rowsFiltered} onOpen={openRow} />
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
        chartSlots={chartSlots}
      >
        {body}
      </SystemHubShell>
      <HostingDeployDetailModal row={modalRow} tools={tools} onClose={closeModal} />
    </>
  );
}
