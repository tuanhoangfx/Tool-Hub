import type { OverviewTocItem } from "./overview-toc";
import { useHubTocNavActive, useHubTocNavHighlight } from "@tool-workspace/hub-ui";
import { scrollToTocSection } from "./use-toc-section-spy";
import { useTocNavActive, useTocNavHighlight } from "./toc-section-highlight-context";

type Props = {
  items: readonly OverviewTocItem[];
  idPrefix?: string;
  scrollRootSelector?: string;
  className?: string;
};

export function TocSectionNav({ items, idPrefix = "", scrollRootSelector, className = "" }: Props) {
  return (
    <div
      className={`overview-toc-nav relative z-10 w-[var(--overview-toc-w)] shrink-0 rounded-2xl border border-indigo-300/10 bg-[var(--panel)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)] ring-1 ring-white/[.025] ${className}`}
    >
      <nav className="overview-toc-nav__list space-y-0.5" aria-label="On this page">
        {items.map((item) => (
          <TocSectionNavItem
            key={item.id}
            item={item}
            sectionId={`${idPrefix}${item.id}`}
            scrollRootSelector={scrollRootSelector}
          />
        ))}
      </nav>
    </div>
  );
}

function TocSectionNavItem({
  item: { label, emoji },
  sectionId,
  scrollRootSelector,
}: {
  item: OverviewTocItem;
  sectionId: string;
  scrollRootSelector?: string;
}) {
  const isHighlighted = useHubTocNavHighlight(sectionId) || useTocNavHighlight(sectionId);
  const isActive = useHubTocNavActive(sectionId) || useTocNavActive(sectionId);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        scrollToTocSection(sectionId, scrollRootSelector);
      }}
      className={`overview-toc-nav__item group relative z-[1] min-h-[var(--overview-toc-row-h)] w-full cursor-pointer text-left text-[13px] transition-colors ${
        isHighlighted ? "is-highlighted" : isActive ? "is-active" : ""
      }`}
    >
      <span className="overview-toc-nav__label flex min-w-0 items-center gap-1.5 truncate rounded-lg px-2 py-1 font-medium text-[var(--muted)] transition-all duration-200 group-hover:text-[var(--text)]">
        <span className="shrink-0 text-[12px] leading-none opacity-90" aria-hidden>
          {emoji}
        </span>
        <span className="truncate">{label}</span>
      </span>
    </button>
  );
}
