import { useMemo, useState } from "react";
import { Check, CheckCircle2, Circle, Copy, ExternalLink, GitCompare, MoreHorizontal } from "lucide-react";
import { HubTablePager, useHubTablePagination } from "@tool-workspace/hub-ui";
import { FilterBar, RegistryMetricBadge } from "../../components/sales-shell";
import { compactIconSize } from "../../lib/ui-scale";
import { resolveVersionSyncBadge } from "../../lib/version-badges";
import type { ToolVersionHistoryRow } from "./tool-versions";
import {
  PipelineColumnHeader,
  TableColumnHeader,
} from "./version-pipeline-cols";
import {
  VERSION_PIPELINE_COLS,
  VERSION_TABLE_HEADERS,
} from "./version-pipeline-defs";
import { enrichFilterDefs } from "../../lib/filter-option-counts";
import { VERSION_FILTER_DEFS, matchesVersionFilters } from "./version-filters";
import { useVersionFilterPrefs } from "./use-version-filter-prefs";
import { VersionPipelineToolbar } from "./VersionPipelineToolbar";
import type { ResolvedTool } from "../../types";

function PipelineCell({ on, title }: { on: boolean; title: string }) {
  return (
    <span
      className="inline-flex justify-center"
      title={on ? `${title} - done` : `${title} - missing`}
    >
      {on ? (
        <CheckCircle2 size={compactIconSize(15)} className="text-emerald-400" aria-label="Done" />
      ) : (
        <Circle size={compactIconSize(13)} className="text-[var(--muted)]/35" aria-label="Missing" />
      )}
    </span>
  );
}

function RowActions({
  row,
  copiedId,
  onCopy,
}: {
  row: ToolVersionHistoryRow;
  copiedId: string | null;
  onCopy: (row: ToolVersionHistoryRow) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onCopy(row)}
        className="inline-flex items-center justify-center rounded-md border border-white/10 p-1.5 text-[var(--muted)] hover:bg-white/[.05] hover:text-indigo-300"
        title="Copy version"
        aria-label={`Copy ${row.display}`}
      >
        {copiedId === row.id ? <Check size={compactIconSize(12)} className="text-emerald-400" /> : <Copy size={compactIconSize(12)} />}
      </button>
      {row.compareUrl ? (
        <a
          href={row.compareUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-md border border-white/10 p-1.5 text-[var(--muted)] hover:bg-white/[.05] hover:text-violet-300"
          title="Compare with previous version on GitHub"
        >
          <GitCompare size={compactIconSize(12)} />
        </a>
      ) : null}
      {row.releaseUrl ? (
        <a
          href={row.releaseUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-md border border-white/10 p-1.5 text-[var(--muted)] hover:bg-white/[.05] hover:text-cyan-300"
          title="Open GitHub release"
        >
          <ExternalLink size={compactIconSize(12)} />
        </a>
      ) : null}
    </div>
  );
}

export type ToolVersionsPanelProps = {
  rows: ToolVersionHistoryRow[];
  tool: Pick<ResolvedTool, "code" | "localPath" | "branch" | "remoteEnabled">;
  canonicalVersion: string;
  needsActionCount?: number;
  onRefresh?: () => void;
};

/** Version history with pipeline icons: Package -> Changelog -> Manifest -> Git -> Push -> Release */
export function ToolVersionsPanel({
  rows,
  tool,
  canonicalVersion,
  needsActionCount = 0,
  onRefresh,
}: ToolVersionsPanelProps) {
  const toolCode = tool.code;
  const currentRow = rows.find((r) => r.isCurrent);
  const currentSynced = currentRow?.syncStatus === "synced";
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { query, setQuery, filterValues, setFilterValues } = useVersionFilterPrefs(toolCode);

  const versionFilters = useMemo(
    () =>
      enrichFilterDefs(
        rows,
        VERSION_FILTER_DEFS,
        query,
        filterValues,
        matchesVersionFilters,
        (row, key, value) => matchesVersionFilters(row, "", { [key]: [value] }),
      ),
    [rows, query, filterValues],
  );

  const filtered = useMemo(
    () => rows.filter((r) => matchesVersionFilters(r, query, filterValues)),
    [rows, query, filterValues],
  );

  const pagination = useHubTablePagination(filtered, {
    resetKey: `${query}|${JSON.stringify(filterValues)}`,
  });

  async function copyValue(row: ToolVersionHistoryRow) {
    try {
      await navigator.clipboard.writeText(row.version);
      setCopiedId(row.id);
      window.setTimeout(() => setCopiedId((c) => (c === row.id ? null : c)), 1500);
    } catch {
      // ignore
    }
  }

  if (rows.length === 0) {
    return (
      <p className="text-[12px] text-[var(--muted)]">
        No version history yet. Add a CHANGELOG.md entry or create a GitHub Release.
      </p>
    );
  }

  const h = VERSION_TABLE_HEADERS;

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-[var(--muted)]">
        Each row is <strong className="text-[var(--text)]">one version</strong> from package/CHANGELOG.{" "}
        <strong className="text-[var(--text)]">Commit</strong> auto-bumps the patch version (for example 0.1.0 to 0.1.1)
        and syncs docs. <CheckCircle2 size={compactIconSize(11)} className="inline text-emerald-400" /> = completed step. Current:{" "}
        <span className="font-mono text-indigo-200">v{canonicalVersion}</span>
        {needsActionCount > 0 ? (
          <span className="ml-2 text-amber-200/90">· {needsActionCount} need sync / push</span>
        ) : currentSynced ? (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
            <CheckCircle2 size={compactIconSize(10)} className="text-emerald-400" aria-hidden />
            Release synced
          </span>
        ) : null}
      </p>

      <VersionPipelineToolbar
        toolCode={toolCode}
        localPath={tool.localPath}
        branch={tool.branch}
        remoteEnabled={tool.remoteEnabled}
        currentRow={currentRow}
        onDone={onRefresh}
      />

      <FilterBar
        placeholder="Search Versions by version, title, notes..."
        filters={versionFilters}
        query={query}
        onQueryChange={setQuery}
        values={filterValues}
        onValuesChange={setFilterValues}
        trailing={
          <span className="hidden text-[10px] text-[var(--muted)] sm:inline">
            {filtered.length}/{rows.length}
          </span>
        }
      />

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-6 text-center text-[12px] text-[var(--muted)]">
          No versions match the current filters.
        </p>
      ) : (
        <div className="rounded-lg border border-white/5 p-2">
          <HubTablePager
            pageIndex={pagination.pageIndex}
            totalPages={pagination.totalPages}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            totalCount={pagination.totalCount}
            onPrev={pagination.goPrev}
            onNext={pagination.goNext}
            ariaLabel="Version table pages"
          />
          <div className="overflow-x-auto rounded-md bg-black/10">
          <table className="w-full min-w-[var(--version-table-min-w)] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[.02]">
                <TableColumnHeader {...h.sync} />
                <TableColumnHeader {...h.version} />
                <TableColumnHeader {...h.released} />
                <TableColumnHeader {...h.title} />
                {VERSION_PIPELINE_COLS.map((col) => (
                  <PipelineColumnHeader key={col.key} col={col} />
                ))}
                <TableColumnHeader {...h.note} />
                <th className="w-20 px-2 py-2 text-right font-medium" title={h.actions.title}>
                  <span className="ml-auto inline-flex items-center gap-1 normal-case tracking-normal">
                    <MoreHorizontal size={compactIconSize(13)} className="text-slate-400" aria-hidden />
                    <span className="text-[10px] text-[var(--muted)]">{h.actions.label}</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-white/5 last:border-0 hover:bg-white/[.02] ${
                    row.isCurrent ? "bg-indigo-500/[.06]" : ""
                  }`}
                >
                  <td className="px-2 py-2 align-top">
                    <RegistryMetricBadge spec={resolveVersionSyncBadge(row.syncStatus)} className="text-[9px]" />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 align-top font-mono font-semibold text-indigo-100">
                    {row.display}
                    {row.isCurrent ? (
                      <span className="ml-1 text-[9px] font-normal text-indigo-300/80">· current</span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 align-top">
                    <div className="version-row-date">{row.publishedLabel ?? row.date ?? "—"}</div>
                    {row.assetSize ? (
                      <div className="font-mono text-[9px] text-cyan-300/70">{row.assetSize}</div>
                    ) : null}
                  </td>
                  <td className="max-w-[var(--version-title-max-w)] truncate px-3 py-2 align-top text-[11px] text-[var(--text)]" title={row.title}>
                    {row.title ?? "—"}
                  </td>
                  {VERSION_PIPELINE_COLS.map((col) => (
                    <td key={col.key} className="px-1 py-2 text-center align-top">
                      <PipelineCell on={row[col.key]} title={col.title} />
                    </td>
                  ))}
                  <td className="max-w-[var(--version-note-max-w)] px-3 py-2 align-top text-[10px] leading-snug text-amber-100/80">
                    {row.syncNote || "—"}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <RowActions row={row} copiedId={copiedId} onCopy={copyValue} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
