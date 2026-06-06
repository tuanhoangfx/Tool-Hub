import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import {
  HubToolDetailModal,
  HubToolDetailSection,
  HUB_TOOL_DETAIL_SCROLL_ROOT,
  HUB_TOOL_DETAIL_SECTIONS_CLASS,
} from "@tool-workspace/hub-ui";
import { MetricBadge } from "../../components/sales-shell/MetricBadge";
import { compactIconSize } from "../../lib/ui-scale";
import { resolveDeployBadge } from "../../lib/badge-registry";
import type { ResolvedTool } from "../../types";
import { TocSectionNav } from "../overview/TocSectionNav";
import { TocHighlightContent, TocSectionHighlightProvider } from "../overview/toc-section-highlight-context";
import { SupabaseProjectToolBadges } from "./SupabaseProjectToolBadges";
import { HOSTING_DEPLOY_DETAIL_TOC, hostingDeploySectionTitle } from "./hosting-deploy-detail-toc";
import type { HostingDeployRow } from "./hosting-quota-types";

export type HostingDeployDetailModalProps = {
  row: HostingDeployRow | null;
  tools: ResolvedTool[];
  onClose: () => void;
};

export function HostingDeployDetailModal({ row, tools, onClose }: HostingDeployDetailModalProps) {
  const linked = useMemo(() => {
    if (!row) return [];
    return row.toolCodes.map((code) => tools.find((t) => t.code === code)).filter(Boolean) as ResolvedTool[];
  }, [row, tools]);

  const idPrefix = row ? `host-${row.ref}-` : "";
  const tocSectionIds = useMemo(
    () => (row ? HOSTING_DEPLOY_DETAIL_TOC.map(({ id }) => `${idPrefix}${id}`) : []),
    [idPrefix, row],
  );

  if (!row) return null;

  const deploy = resolveDeployBadge(row.provider);
  const ProviderIcon = deploy.iconMeta.icon;
  const sid = (id: string) => `${idPrefix}${id}`;
  const showLinksSection = Boolean(row.publicUrl || row.note || row.error || row.driftCount > 0);

  return (
    <HubToolDetailModal
      open
      onClose={onClose}
      title={row.name}
      titleId={`hosting-detail-${row.ref}`}
      ariaLabelledBy={`hosting-detail-${row.ref}`}
      headerLeading={<ProviderIcon size={compactIconSize(18)} className="shrink-0 text-indigo-300" />}
      headerTrailing={<MetricBadge label={row.ref} mono />}
      toc={
        <TocSectionNav
          items={HOSTING_DEPLOY_DETAIL_TOC.filter(({ id }) => id !== "links" || showLinksSection)}
          idPrefix={idPrefix}
          scrollRootSelector={HUB_TOOL_DETAIL_SCROLL_ROOT}
        />
      }
    >
      <TocSectionHighlightProvider sectionIds={tocSectionIds}>
        <TocHighlightContent className={HUB_TOOL_DETAIL_SECTIONS_CLASS}>
          <HubToolDetailSection id={sid("identity")} title={hostingDeploySectionTitle("identity")}>
            <p className="text-sm text-[var(--muted)]">
              {row.providerLabel} · {row.hostSlug}
            </p>
          </HubToolDetailSection>

          <HubToolDetailSection id={sid("metrics")} title={hostingDeploySectionTitle("metrics")}>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {[
                ["Region / provider", row.region ?? "—"],
                ["Plan / status", row.plan ?? row.status],
                ["Health", row.healthLabel],
                ["Service", row.serviceKind ? `${row.serviceKind}${row.serviceStatus ? ` · ${row.serviceStatus}` : ""}` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{k}</dt>
                  <dd className="mt-0.5 text-[var(--text)]">{v}</dd>
                </div>
              ))}
            </dl>
          </HubToolDetailSection>

          {showLinksSection ? (
            <HubToolDetailSection id={sid("links")} title={hostingDeploySectionTitle("links")}>
              {row.publicUrl ? (
                <a
                  href={row.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:underline"
                >
                  <ExternalLink size={compactIconSize(14)} />
                  {row.publicUrl}
                </a>
              ) : null}
              {row.note ? (
                <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-100/90">{row.note}</p>
              ) : null}
              {row.error || row.driftCount > 0 ? (
                <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
                  {row.error ?? `${row.driftCount} drift alert(s) on linked tool(s)`}
                </p>
              ) : null}
            </HubToolDetailSection>
          ) : null}

          <HubToolDetailSection id={sid("tools")} title={hostingDeploySectionTitle("tools")}>
            <SupabaseProjectToolBadges tools={row.toolCodes} maxVisible={12} />
            {linked.length > 0 ? (
              <ul className="space-y-2">
                {linked.map((t) => (
                  <li key={t.id} className="rounded-lg border border-white/5 px-3 py-2 text-[12px]">
                    <span className="font-mono text-indigo-200/90">{t.code}</span>
                    <span className="mx-2 text-[var(--muted)]">·</span>
                    <span className="text-[var(--text)]">{t.name}</span>
                    <span className="ml-2 text-[var(--muted)]">{t.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-[var(--muted)]">No workspace catalog match for tool codes on this deployment.</p>
            )}
          </HubToolDetailSection>
        </TocHighlightContent>
      </TocSectionHighlightProvider>
    </HubToolDetailModal>
  );
}
