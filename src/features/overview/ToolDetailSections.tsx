import { useMemo, type ReactNode } from "react";
import { CheckCircle2, Layers, Target } from "lucide-react";
import { MetricBadge } from "../../components/sales-shell";
import {
  resolveDeployTargetIcon,
  resolveHealthStatusIcon,
} from "../../lib/badge-registry";
import type { ResolvedTool } from "../../types";
import { QuietChip, ToolCodeBadge } from "../hub/hub-tool-ui";
import { overviewSectionTitle } from "./overview-toc";
import {
  changelogEntriesForTool,
  changelogFullTextForTool,
  featuresForTool,
  manifestForTool,
  stackForTool,
} from "./tool-overview-data";
import { collectImportantLinks } from "./tool-links";
import { collectVersionHistory } from "./tool-versions";
import { ToolLinksPanel } from "./ToolLinksTable";
import { ToolVersionsPanel } from "./ToolVersionsPanel";

const HUB_EXTRA_ROADMAP = "Table view skin → OrdersTable style";

export type ToolDetailSectionsProps = {
  tool: ResolvedTool;
  hubChangelogRaw?: string;
  idPrefix?: string;
  /** Workspace Overview: health.catalog row. Hub modal: health.remote row. */
  statsMode?: "workspace" | "tool";
  catalogToolCount?: number;
  onRefresh?: () => void;
};

export function ToolDetailSections({
  tool,
  hubChangelogRaw,
  idPrefix = "",
  statsMode = "tool",
  catalogToolCount,
  onRefresh,
}: ToolDetailSectionsProps) {
  const manifest = useMemo(() => manifestForTool(tool), [tool]);
  const stack = useMemo(() => stackForTool(tool, manifest), [tool, manifest]);
  const features = useMemo(() => featuresForTool(tool, manifest), [tool, manifest]);
  const changelogEntries = useMemo(
    () => changelogEntriesForTool(tool, hubChangelogRaw),
    [tool, hubChangelogRaw],
  );
  const changelogFull = useMemo(
    () => changelogFullTextForTool(tool, hubChangelogRaw),
    [tool, hubChangelogRaw],
  );

  const currentCode = manifest.code ?? tool.code;
  const currentName = manifest.name ?? tool.name;
  const version = manifest.release?.version ?? tool.version;
  const summary = manifest.summary ?? tool.summary ?? "";
  const status = manifest.status ?? tool.status;
  const isHub = tool.code === "P0004";
  const sid = (id: string) => `${idPrefix}${id}`;
  const importantLinks = useMemo(() => collectImportantLinks(tool, manifest), [tool, manifest]);
  const versionRows = useMemo(() => collectVersionHistory(tool, manifest), [tool, manifest]);
  const versionNeedsAction = useMemo(
    () => versionRows.filter((r) => r.syncStatus === "needs-push" || r.syncStatus === "needs-sync").length,
    [versionRows],
  );

  return (
    <>
      <section id={sid("about")} className="scroll-mt-3 space-y-2">
        <SectionHeading title={overviewSectionTitle("about")} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xl font-semibold">{currentName}</span>
          <ToolCodeBadge code={currentCode} category={tool.category ?? "other"} />
          <MetricBadge label={`v${version}`} iconMeta={resolveHealthStatusIcon("Ready")} tone="ok" />
          <QuietChip
            label={status}
            tone={status === "Ready" || status === "Active" ? "ok" : "neutral"}
            iconMeta={resolveHealthStatusIcon(status)}
          />
        </div>
        {summary ? <p className="text-[13px] leading-relaxed text-[var(--muted)]">{summary}</p> : null}
        {manifest.aliases?.length ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {manifest.aliases.map((a) => (
              <MetricBadge key={a} label={a} tone="neutral" />
            ))}
          </div>
        ) : null}
      </section>

      <DetailSection id={sid("links")} title={overviewSectionTitle("links")}>
        <ToolLinksPanel links={importantLinks} toolCode={currentCode} />
      </DetailSection>

      <DetailSection id={sid("versions")} title={overviewSectionTitle("versions")}>
        <ToolVersionsPanel
          rows={versionRows}
          tool={tool}
          canonicalVersion={version}
          needsActionCount={versionNeedsAction}
          onRefresh={onRefresh}
        />
      </DetailSection>

      <DetailSection id={sid("stack")} title={overviewSectionTitle("stack")}>
        <div className="flex flex-wrap gap-1.5">
          {stack.map((s) => (
            <MetricBadge
              key={s}
              label={s}
              iconMeta={{ icon: Layers, className: "text-indigo-300" }}
              variantClass="border-indigo-400/20 bg-indigo-500/5 text-indigo-200"
              mono
            />
          ))}
        </div>
        {isHub ? (
          <p className="mt-2 text-[11px] text-[var(--muted)]">
            Schema source-of-truth: <code className="rounded bg-black/30 px-1 font-mono">src/data/registry-schema.ts</code> · Catalog:{" "}
            <code className="rounded bg-black/30 px-1 font-mono">public/registry.default.json</code>
          </p>
        ) : tool.repo ? (
          <p className="mt-2 text-[11px] text-[var(--muted)]">
            Repo: <code className="rounded bg-black/30 px-1 font-mono">{tool.repo}</code>
            {tool.branch ? ` @ ${tool.branch}` : null}
          </p>
        ) : null}
      </DetailSection>

      <DetailSection id={sid("features")} title={overviewSectionTitle("features")}>
        <ul className="grid gap-1.5 md:grid-cols-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 rounded-md border border-white/5 bg-white/[.02] px-2.5 py-1.5 text-[12px]">
              <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-300" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </DetailSection>

      <DetailSection id={sid("changelog")} title={overviewSectionTitle("changelog")}>
        {changelogEntries.length > 0 ? (
          <ul className="space-y-1.5">
            {changelogEntries.map((c) => (
              <li key={`${c.version}-${c.date}-${c.title}`} className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <MetricBadge
                    label={`v${c.version}`}
                    iconMeta={resolveHealthStatusIcon("Ready")}
                    variantClass="border-indigo-400/30 bg-indigo-500/10 text-indigo-200"
                    mono
                  />
                  {c.date ? <span className="text-[10px] text-[var(--muted)]">{c.date}</span> : null}
                  {c.type ? <span className="text-[10px] text-fuchsia-300">· {c.type}</span> : null}
                </div>
                <div className="mt-0.5 text-[12px]">{c.title}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] text-[var(--muted)]">No changelog in remote files yet.</p>
        )}
        {changelogFull ? (
          <details className="mt-2 rounded-lg border border-white/5 bg-black/20">
            <summary className="cursor-pointer px-3 py-2 text-[11px] text-fuchsia-300">View full CHANGELOG.md →</summary>
            <div className="max-h-[400px] overflow-auto px-3 pb-3">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[var(--muted)]">{changelogFull}</pre>
            </div>
          </details>
        ) : null}
      </DetailSection>

      <DetailSection id={sid("roadmap")} title={overviewSectionTitle("roadmap")}>
        <div className="grid gap-1.5 md:grid-cols-2">
          {(manifest.release?.readiness ?? []).map((r) => (
            <div key={r} className="flex items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-500/5 px-2.5 py-1.5 text-[12px]">
              <CheckCircle2 size={11} className="text-emerald-300" />
              <code className="font-mono text-emerald-200">{r}</code>
              <span className="ml-auto text-[10px] text-[var(--muted)]">done</span>
            </div>
          ))}
          {isHub ? (
            <div className="flex items-center gap-2 rounded-md border border-amber-400/20 bg-amber-500/5 px-2.5 py-1.5 text-[12px]">
              <Target size={11} className="text-amber-300" />
              <span>{HUB_EXTRA_ROADMAP}</span>
              <span className="ml-auto text-[10px] text-amber-300">med</span>
            </div>
          ) : null}
          {!manifest.release?.readiness?.length && !isHub ? (
            <p className="text-[12px] text-[var(--muted)]">No roadmap items in manifest.</p>
          ) : null}
        </div>
      </DetailSection>

      <DetailSection id={sid("runbook")} title={overviewSectionTitle("runbook")}>
        {Object.keys(manifest.commands ?? {}).length > 0 ? (
          <div className="space-y-1.5">
            {Object.entries(manifest.commands ?? {}).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 rounded-md border border-white/5 bg-black/30 px-2.5 py-1.5">
                <span className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">{k}</span>
                <code className="flex-1 font-mono text-[11px] text-emerald-300">$ {v}</code>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[var(--muted)]">No commands in manifest.</p>
        )}
      </DetailSection>

      <DetailSection id={sid("health")} title={overviewSectionTitle("health")}>
        <div className="grid gap-1.5 md:grid-cols-2">
          <HealthRow
            label="status"
            value={manifest.health?.status ?? tool.healthLabel}
            good={(manifest.health?.status ?? tool.healthLabel) === "Ready"}
          />
          {statsMode === "workspace" ? (
            <HealthRow
              label="catalog"
              value={catalogToolCount != null ? `${catalogToolCount} tools indexed` : "workspace registry"}
              good
            />
          ) : (
            <HealthRow label="remote" value={tool.remoteEnabled === false ? "local only" : "github"} good={tool.remoteEnabled !== false} />
          )}
          <HealthRow label="readiness" value={`${manifest.release?.readiness?.length ?? 0} gates pass`} good />
          <HealthRow label="deploy" value={manifest.deployTarget ?? tool.deployTarget ?? "—"} good />
        </div>
        {manifest.health?.note || tool.driftAlerts[0] ? (
          <p className="mt-2 rounded-md border border-amber-400/20 bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-amber-200">
            {manifest.health?.note ?? tool.driftAlerts[0]}
          </p>
        ) : null}
      </DetailSection>
    </>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="border-b border-white/5 pb-2 text-lg font-semibold">{title}</h2>;
}

function DetailSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-3 space-y-3">
      <SectionHeading title={title} />
      {children}
    </section>
  );
}

function HealthRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  const deployIcon = label === "deploy" ? resolveDeployTargetIcon(value) : null;
  const statusIcon = label === "status" ? resolveHealthStatusIcon(value) : null;
  const iconMeta = deployIcon ?? statusIcon;
  return (
    <div className="flex items-center justify-between rounded-md border border-white/5 bg-white/[.02] px-2.5 py-1.5 text-[12px]">
      <span className="font-mono text-[var(--muted)]">{label}</span>
      <MetricBadge label={value} iconMeta={iconMeta} tone={good ? "ok" : "warn"} />
    </div>
  );
}
