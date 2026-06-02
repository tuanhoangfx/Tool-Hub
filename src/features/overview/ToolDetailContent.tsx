import { ToolAvatar } from "../../components/ToolAvatar";
import { ToolCodeBadge } from "../hub/hub-tool-ui";
import { toolIconName, toolSvgIcon } from "../../lib/visual";
import type { ResolvedTool } from "../../types";
import { useMemo } from "react";
import { OverviewTocNav } from "./OverviewTocNav";
import { OVERVIEW_TOC } from "./overview-toc";
import { TocHighlightContent, TocSectionHighlightProvider } from "./toc-section-highlight-context";
import { ToolDetailSections } from "./ToolDetailSections";

export type ToolDetailContentProps = {
  tool: ResolvedTool;
  hubChangelogRaw?: string;
  idPrefix?: string;
  onRefreshTool?: () => void;
};

/** Single-tool docs only: TOC + sections, without workspace compare/jump UI. */
export function ToolDetailContent({
  tool,
  hubChangelogRaw,
  idPrefix = "",
  onRefreshTool,
}: ToolDetailContentProps) {
  const code = tool.code;
  const tocSectionIds = useMemo(
    () => OVERVIEW_TOC.map(({ id }) => `${idPrefix}${id}`),
    [idPrefix],
  );

  return (
    <TocSectionHighlightProvider sectionIds={tocSectionIds}>
      <div className="grid gap-4 lg:grid-cols-[var(--overview-toc-w)_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-0 lg:self-start">
          <OverviewTocNav
            code={code}
            idPrefix={idPrefix}
            scrollRootSelector=".modal-shell--tool-detail .modal-shell__scroll"
          />
        </aside>

        <TocHighlightContent className="min-w-0 space-y-5 p-1 sm:p-2">
        <div className="flex items-center gap-3 pb-1">
          <ToolAvatar
            code={tool.code}
            iconName={toolIconName(tool)}
            svgSrc={toolSvgIcon(tool) ?? undefined}
            size="md"
          />
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <ToolCodeBadge code={tool.code} category={tool.category} />
            <h2 className="min-w-0 truncate text-lg font-semibold leading-tight">{tool.name}</h2>
          </div>
        </div>

        <ToolDetailSections
          tool={tool}
          hubChangelogRaw={hubChangelogRaw}
          idPrefix={idPrefix}
          statsMode="tool"
          onRefresh={onRefreshTool}
        />
        </TocHighlightContent>
      </div>
    </TocSectionHighlightProvider>
  );
}
