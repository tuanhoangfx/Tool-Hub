import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeftRight, Network, Search } from "lucide-react";
import type { ResolvedTool } from "../../types";
import { toolsToWorkspace, workspaceStats } from "../system-hub/workspace-data";
import { OverviewTocNav } from "./OverviewTocNav";
import { ToolDetailSections } from "./ToolDetailSections";
import { manifestForTool, stackForTool } from "./tool-overview-data";

const TYPE_BADGE: Record<string, string> = {
  Web: "border-indigo-400/30 bg-indigo-500/10 text-indigo-200",
  Electron: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200",
  Node: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  Static: "border-slate-400/30 bg-slate-500/10 text-slate-200",
  Infra: "border-amber-400/30 bg-amber-500/10 text-amber-200",
};

const HEALTH_DOT: Record<string, string> = { pass: "bg-emerald-400", warn: "bg-amber-400", fail: "bg-rose-400" };

type WorkspaceFilter = "all" | "active" | "review" | "idle";

const FILTER_OPTIONS: { id: WorkspaceFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "review", label: "Review" },
  { id: "idle", label: "Idle" },
];

function matchesWorkspaceFilter(status: string, filter: WorkspaceFilter) {
  if (filter === "all") return true;
  if (filter === "active") return status === "Active";
  if (filter === "review") return status === "Needs review";
  return status === "Idle";
}

export type ToolOverviewContentProps = {
  tool: ResolvedTool;
  allTools: ResolvedTool[];
  hubChangelogRaw?: string;
  /** Prefix anchor ids (modal) to avoid collisions */
  idPrefix?: string;
  /** Click workspace card / jump list → switch focused tool */
  onSelectTool?: (toolId: string) => void;
};

export function ToolOverviewContent({
  tool,
  allTools,
  hubChangelogRaw,
  idPrefix = "",
  onSelectTool,
}: ToolOverviewContentProps) {
  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const toolByCode = useMemo(() => new Map(allTools.map((t) => [t.code, t])), [allTools]);
  const manifest = useMemo(() => manifestForTool(tool), [tool]);
  const workspace = useMemo(() => toolsToWorkspace(allTools, tool.code), [allTools, tool.code]);
  const stats = useMemo(() => workspaceStats(workspace), [workspace]);
  const stack = useMemo(() => stackForTool(tool, manifest), [tool, manifest]);

  const currentCode = manifest.code ?? tool.code;
  const version = manifest.release?.version ?? tool.version;

  const totalRows = allTools.length;

  const stackYou = stack.slice(0, 2).join(" + ") || tool.category;
  const isHub = tool.code === "P0004";

  const sid = (id: string) => `${idPrefix}${id}`;

  const visibleWorkspace = useMemo(
    () => workspace.filter((w) => matchesWorkspaceFilter(w.status, workspaceFilter)),
    [workspace, workspaceFilter],
  );

  const pickToolByCode = (code: string) => {
    const picked = toolByCode.get(code);
    if (picked && onSelectTool) onSelectTool(picked.id);
  };

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-400/20 bg-gradient-to-r from-slate-500/10 via-slate-500/5 to-transparent">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Network size={14} className="text-fuchsia-300" />
            <span className="text-sm font-semibold">Workspace</span>
            <code className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">E:\Dev\Tool</code>
            <span className="text-[10px] text-[var(--muted)]">·</span>
            <span className="text-[10px] text-[var(--muted)]">
              {stats.totalTools} tools · <span className="text-emerald-300">{stats.active} active</span> ·{" "}
              <span className="text-amber-300">{stats.needsReview} review</span> ·{" "}
              <span className="text-slate-400">{stats.idle} idle</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors ${
                filterOpen || workspaceFilter !== "all"
                  ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-200"
                  : "border-white/10 bg-white/[.02] hover:bg-white/[.05]"
              }`}
            >
              <Search size={9} /> filter
              {workspaceFilter !== "all" ? (
                <span className="rounded bg-indigo-500/30 px-1 font-mono text-[9px]">{workspaceFilter}</span>
              ) : null}
            </button>
            <button
              type="button"
              aria-pressed={compareOpen}
              onClick={() => setCompareOpen((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors ${
                compareOpen
                  ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100"
                  : "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/20"
              }`}
            >
              <ArrowLeftRight size={9} /> compare
            </button>
          </div>
        </div>

        {filterOpen ? (
          <div className="flex flex-wrap gap-1 border-b border-white/5 px-4 py-2">
            {FILTER_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setWorkspaceFilter(id)}
                className={`rounded-md px-2 py-0.5 text-[10px] transition-colors ${
                  workspaceFilter === id
                    ? "bg-indigo-500/25 text-indigo-100"
                    : "text-[var(--muted)] hover:bg-white/[.05] hover:text-[var(--text)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid gap-1.5 p-2 sm:grid-cols-3 lg:grid-cols-7">
          {visibleWorkspace.map((w) => {
            const isCurrent = w.code === currentCode;
            const selectable = Boolean(onSelectTool && toolByCode.has(w.code));
            const CardTag = selectable ? "button" : "div";
            return (
              <CardTag
                key={w.code}
                type={selectable ? "button" : undefined}
                onClick={selectable ? () => pickToolByCode(w.code) : undefined}
                className={`group relative w-full rounded-lg border p-2 text-left transition-all ${
                  selectable ? "cursor-pointer hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400/60" : ""
                } ${
                  isCurrent
                    ? "border-indigo-400/40 bg-indigo-500/15 shadow-lg shadow-indigo-500/20"
                    : "border-white/5 bg-white/[.02] hover:bg-white/[.05]"
                }`}
              >
                {isCurrent ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-indigo-500 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-white">
                    here
                  </span>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold">{w.code}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${HEALTH_DOT[w.health]}`} title={w.health} />
                </div>
                <div className="mt-1 truncate text-[11px] font-medium">{w.name}</div>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className={`rounded border px-1 py-px font-mono text-[8px] ${TYPE_BADGE[w.type] ?? TYPE_BADGE.Web}`}>
                    {w.type}
                  </span>
                  <span className="font-mono text-[9px] text-[var(--muted)]">v{w.version}</span>
                </div>
                {compareOpen && !isCurrent ? (
                  <div className="mt-1.5 border-t border-white/5 pt-1 text-[9px] text-fuchsia-200/90">
                    vs {currentCode}: v{version} · {stackYou}
                  </div>
                ) : null}
              </CardTag>
            );
          })}
        </div>

        {compareOpen ? (
          <div className="border-t border-white/5 px-4 py-2">
            <div className="text-[10px] uppercase tracking-wider text-fuchsia-200/80">Quick compare · {currentCode}</div>
            <div className="mt-1.5 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {visibleWorkspace
                .filter((w) => w.code !== currentCode)
                .slice(0, 6)
                .map((w) => (
                  <div key={w.code} className="rounded-md border border-white/5 bg-black/20 px-2 py-1.5 text-[10px]">
                    <span className="font-mono text-fuchsia-300">{w.code}</span>
                    <span className="mx-1 text-[var(--muted)]">·</span>
                    <span>v{w.version}</span>
                    <span className="mx-1 text-[var(--muted)]">·</span>
                    <span className={w.health === "pass" ? "text-emerald-300" : w.health === "fail" ? "text-rose-300" : "text-amber-300"}>
                      {w.health}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/5 bg-[var(--panel)] p-3">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">{currentCode} vs workspace average</div>
        <div className="grid gap-2 sm:grid-cols-4">
          <CompareCard label="Version" you={version} avg={stats.avgVersion} good />
          <CompareCard label="Catalog" you={totalRows.toLocaleString("en-US")} avg={`${stats.totalTools} tools`} good />
          <CompareCard label="Stack" you={stackYou} avg={stats.mostUsedStack} neutral />
          <CompareCard
            label="Schema"
            you={
              isHub
                ? `${(manifest.release?.readiness?.length ?? 0) + 3} registry tables`
                : `${manifest.release?.readiness?.length ?? 0} gates`
            }
            avg={isHub ? "catalog · manifest · runtime" : "manifest · remote"}
            good
          />
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-3 lg:self-start">
          <OverviewTocNav code={currentCode} idPrefix={idPrefix} />
        </aside>

        <main className="space-y-6 rounded-2xl border border-white/5 bg-[var(--panel)] p-6">
          <ToolDetailSections
            tool={tool}
            hubChangelogRaw={hubChangelogRaw}
            idPrefix={idPrefix}
            statsMode="workspace"
            catalogToolCount={totalRows}
          />
        </main>
      </div>
    </div>
  );
}

function CompareCard({
  label,
  you,
  avg,
  good,
  neutral,
}: {
  label: string;
  you: string;
  avg: string;
  good?: boolean;
  neutral?: boolean;
}) {
  const cls = good
    ? "border-emerald-400/30 bg-emerald-500/5"
    : neutral
      ? "border-white/10 bg-white/[.02]"
      : "border-amber-400/30 bg-amber-500/5";
  return (
    <div className={`rounded-lg border px-3 py-2 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="font-mono text-[12px] font-semibold text-emerald-300">{you}</span>
        <span className="text-[9px] text-[var(--muted)]">vs</span>
        <span className="text-[10px] text-[var(--muted)]">{avg}</span>
      </div>
    </div>
  );
}

