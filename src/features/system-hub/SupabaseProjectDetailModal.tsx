import { useMemo } from "react";
import {
  HubToolDetailModal,
  HUB_TOOL_DETAIL_SCROLL_ROOT,
  HUB_TOOL_DETAIL_SECTIONS_CLASS,
} from "@tool-workspace/hub-ui";
import { MetricBadge } from "../../components/sales-shell";
import { ToolAvatar } from "../../components/ToolAvatar";
import { TocHighlightContent, TocSectionHighlightProvider } from "../overview/toc-section-highlight-context";
import { SupabaseMetricsSourceBadge } from "./SupabaseMetricsSourceBadge";
import { SupabaseProjectToolBadges } from "./SupabaseProjectToolBadges";
import { SupabaseDetailTocNav } from "./SupabaseDetailTocNav";
import { SUPABASE_DETAIL_TOC } from "./supabase-detail-toc";
import { resolveProjectMetricsSource } from "./supabase-project-metrics-source";
import type { OrgRow, ProjectRow } from "./SystemSupabaseQuotaPanel.types";
import { SupabaseProjectDetailContent } from "./SupabaseProjectDetailContent";

export type SupabaseProjectDetailModalProps = {
  project: ProjectRow | null;
  org: OrgRow | null;
  tools?: string[];
  onClose: () => void;
};

function refBadgeClass() {
  return "border-emerald-400/35 bg-emerald-500/12 text-emerald-200";
}

/** Supabase project detail — golden HubToolDetailModal shell (TOC · sections · scroll). */
export function SupabaseProjectDetailModal({ project, org, tools = [], onClose }: SupabaseProjectDetailModalProps) {
  const idPrefix = project ? `sq-${project.projectRef}-` : "";
  const tocSectionIds = useMemo(
    () => (project ? SUPABASE_DETAIL_TOC.map(({ id }) => `${idPrefix}${id}`) : []),
    [idPrefix, project],
  );

  if (!project) return null;

  const metricsSource = resolveProjectMetricsSource(project);
  const refShort = project.projectRef.slice(0, 8);

  return (
    <HubToolDetailModal
      open
      onClose={onClose}
      title={project.projectName}
      titleId={`supabase-detail-${project.projectRef}`}
      ariaLabelledBy={`supabase-detail-${project.projectRef}`}
      headerLeading={<ToolAvatar code="SB" iconName="cloud" size="sm" />}
      headerTrailing={
        <>
          <MetricBadge label={refShort} mono variantClass={refBadgeClass()} />
          <SupabaseMetricsSourceBadge source={metricsSource} />
        </>
      }
      toc={<SupabaseDetailTocNav idPrefix={idPrefix} scrollRootSelector={HUB_TOOL_DETAIL_SCROLL_ROOT} />}
    >
      <TocSectionHighlightProvider sectionIds={tocSectionIds}>
        <TocHighlightContent className={HUB_TOOL_DETAIL_SECTIONS_CLASS}>
          <div className="pb-0.5">
            <SupabaseProjectToolBadges tools={tools} bindings={project.toolBindings} />
          </div>
          <SupabaseProjectDetailContent project={project} org={org} tools={tools} idPrefix={idPrefix} />
        </TocHighlightContent>
      </TocSectionHighlightProvider>
    </HubToolDetailModal>
  );
}
