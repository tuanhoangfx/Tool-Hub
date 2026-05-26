import { useMemo, type ReactNode } from "react";
import { CheckCircle2, Layers } from "lucide-react";
import { MetricBadge } from "../../components/sales-shell";
import {
  resolveDeployTargetIcon,
  resolveHealthStatusIcon,
} from "../../lib/badge-registry";
import type { ResolvedTool } from "../../types";
import { QuietChip, ToolCodeBadge } from "../hub/hub-tool-ui";
import { overviewSectionTitle } from "./overview-toc";
import { RoadmapTimeline } from "./RoadmapTimeline";
import { buildRoadmapNodes } from "./roadmap-nodes";
import { featuresForTool, manifestForTool, stackForTool } from "./tool-overview-data";
import { collectImportantLinks } from "./tool-links";
import { collectVersionHistory } from "./tool-versions";
import { ToolLinksPanel } from "./ToolLinksTable";
import { ToolVersionsPanel } from "./ToolVersionsPanel";

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
  hubChangelogRaw: _hubChangelogRaw,
  idPrefix = "",
  statsMode = "tool",
  catalogToolCount,
  onRefresh,
}: ToolDetailSectionsProps) {
  const manifest = useMemo(() => manifestForTool(tool), [tool]);
  const stack = useMemo(() => stackForTool(tool, manifest), [tool, manifest]);
  const features = useMemo(() => featuresForTool(tool, manifest), [tool, manifest]);

  const currentCode = manifest.code ?? tool.code;
  const currentName = manifest.name ?? tool.name;
  const version = manifest.release?.version ?? tool.version;
  const summary = manifest.summary ?? tool.summary ?? "";
  const status = manifest.status ?? tool.status;
  const isHub = tool.code === "P0004";
  const sid = (id: string) => `${idPrefix}${id}`;
  const importantLinks = useMemo(() => collectImportantLinks(tool, manifest), [tool, manifest]);
  const versionRows = useMemo(() => collectVersionHistory(tool, manifest), [tool, manifest]);
  const roadmapNodes = useMemo(() => buildRoadmapNodes(manifest, versionRows), [manifest, versionRows]);
  const versionNeedsAction = useMemo(
    () => {
      const current = versionRows.find((r) => r.isCurrent);
      return current?.syncStatus === "needs-push" || current?.syncStatus === "needs-sync" ? 1 : 0;
    },
    [versionRows],
  );

  const aboutIntro = isHub
    ? "Tool Hub is the central dashboard for the E:\\Dev\\Tool workspace: it lists tools, checks GitHub/Vercel state, tracks versions, links deployments, shows release roadmap, and surfaces health signals. Its goal is to show which tools are ready, which ones need sync, and provide a clear overview for sharing the tool ecosystem."
    : `${currentName} is ${summary || "a workspace tool"}; this page collects important details such as version, operational links, stack, features, release roadmap, and health signals for quick review or sharing.`;

  return (
    <>
      <section id={sid("about")} className="scroll-mt-3 space-y-4">
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
        <p className="max-w-5xl rounded-xl border border-indigo-300/10 bg-indigo-500/[.045] px-4 py-3 text-[14px] leading-relaxed text-[var(--text)]/90">
          {aboutIntro}
        </p>
      </section>

      <DetailSection id={sid("versions")} title={overviewSectionTitle("versions")}>
        <p className="text-[12px] text-[var(--muted)]">
          Version history and CHANGELOG are merged into the table below.
        </p>
        <ToolVersionsPanel
          rows={versionRows}
          tool={tool}
          canonicalVersion={version}
          needsActionCount={versionNeedsAction}
          onRefresh={onRefresh}
        />
      </DetailSection>

      <DetailSection id={sid("links")} title={overviewSectionTitle("links")}>
        <ToolLinksPanel links={importantLinks} toolCode={currentCode} />
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

      <DetailSection id={sid("roadmap")} title={overviewSectionTitle("roadmap")}>
        <RoadmapTimeline nodes={roadmapNodes} />
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
