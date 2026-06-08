import type { OverviewTocItem } from "./overview-toc";
import { HubTocSectionNav, type HubTocNavItem } from "@tool-workspace/hub-ui";

type Props = {
  items: readonly OverviewTocItem[];
  idPrefix?: string;
  scrollRootSelector?: string;
  className?: string;
};

export function TocSectionNav({ items, idPrefix = "", scrollRootSelector, className = "" }: Props) {
  const navItems: HubTocNavItem[] = items.map((item) => ({
    id: item.id,
    label: item.label,
    emoji: item.emoji,
  }));

  return (
    <div
      className={`overview-toc-nav relative z-10 w-[var(--overview-toc-w)] shrink-0 rounded-2xl border border-indigo-300/10 bg-[var(--panel)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)] ring-1 ring-white/[.025]${className ? ` ${className}` : ""}`}
    >
      <HubTocSectionNav items={navItems} sectionIdPrefix={idPrefix} scrollRootSelector={scrollRootSelector} />
    </div>
  );
}
