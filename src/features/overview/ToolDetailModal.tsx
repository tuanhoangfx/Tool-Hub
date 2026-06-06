import { useMemo } from "react";
import {
  HubToolDetailModal,
  HUB_TOOL_DETAIL_SCROLL_ROOT,
} from "@tool-workspace/hub-ui";
import { ToolAvatar } from "../../components/ToolAvatar";
import { ToolCodeBadge } from "../hub/hub-tool-ui";
import { toolIconName, toolSvgIcon } from "../../lib/visual";
import type { ResolvedTool } from "../../types";
import { OverviewTocNav } from "./OverviewTocNav";
import { OVERVIEW_TOC } from "./overview-toc";
import { ToolDetailSections } from "./ToolDetailSections";
import hubChangelogRaw from "../../../CHANGELOG.md?raw";

export type ToolDetailModalProps = {
  tool: ResolvedTool | null;
  onClose: () => void;
  onRefreshTool?: (toolId: string) => void;
};

/** Hub modal for one tool — header · TOC left · sections right · golden Cookie Auto shell. */
export function ToolDetailModal({ tool, onClose, onRefreshTool }: ToolDetailModalProps) {
  const tocSectionIds = useMemo(
    () => (tool ? OVERVIEW_TOC.map(({ id }) => `m-${tool.id}-${id}`) : []),
    [tool],
  );

  if (!tool) return null;

  const idPrefix = `m-${tool.id}-`;

  return (
    <HubToolDetailModal
      open
      onClose={onClose}
      title={tool.name}
      titleId={`tool-detail-${tool.id}`}
      headerLeading={
        <ToolAvatar
          code={tool.code}
          iconName={toolIconName(tool)}
          svgSrc={toolSvgIcon(tool) ?? undefined}
          size="sm"
        />
      }
      headerTrailing={<ToolCodeBadge code={tool.code} category={tool.category} />}
      toc={
        <OverviewTocNav
          code={tool.code}
          idPrefix={idPrefix}
          scrollRootSelector={HUB_TOOL_DETAIL_SCROLL_ROOT}
        />
      }
      sectionIds={tocSectionIds}
    >
      <ToolDetailSections
        tool={tool}
        hubChangelogRaw={hubChangelogRaw}
        idPrefix={idPrefix}
        statsMode="tool"
        onRefresh={onRefreshTool ? () => onRefreshTool(tool.id) : undefined}
      />
    </HubToolDetailModal>
  );
}
