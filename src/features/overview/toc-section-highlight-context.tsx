import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useHubTocSectionSpy } from "@tool-workspace/hub-ui";

type TocSectionHighlightContextValue = {
  highlightedSectionId: string | null;
  activeSectionId: string | null;
  sectionIds: string[];
  setHighlightedSectionId: (id: string | null) => void;
};

const TocSectionHighlightContext = createContext<TocSectionHighlightContextValue | null>(null);

export function TocSectionHighlightProvider({
  sectionIds,
  scrollRootSelector,
  children,
}: {
  sectionIds: string[];
  scrollRootSelector?: string;
  children: ReactNode;
}) {
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(() => sectionIds[0] ?? null);

  useHubTocSectionSpy(sectionIds, scrollRootSelector, setActiveSectionId);

  const value = useMemo(
    () => ({ highlightedSectionId, activeSectionId, sectionIds, setHighlightedSectionId }),
    [activeSectionId, highlightedSectionId, sectionIds],
  );

  return <TocSectionHighlightContext.Provider value={value}>{children}</TocSectionHighlightContext.Provider>;
}

function useTocSectionHighlightContext() {
  const ctx = useContext(TocSectionHighlightContext);
  if (!ctx) {
    throw new Error("TocHighlightContent must be used within TocSectionHighlightProvider");
  }
  return ctx;
}

function resolveSectionAtPointer(sectionIds: string[], clientY: number): string | null {
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (clientY >= rect.top && clientY <= rect.bottom) return id;
  }
  return null;
}

/** Wraps main doc column — highlights matching TOC label while the pointer is over a section. */
export function TocHighlightContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { sectionIds, setHighlightedSectionId } = useTocSectionHighlightContext();

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const id = resolveSectionAtPointer(sectionIds, event.clientY);
      setHighlightedSectionId(id);
    },
    [sectionIds, setHighlightedSectionId],
  );

  const onPointerLeave = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const next = event.relatedTarget;
      if (next instanceof Node && event.currentTarget.contains(next)) return;
      setHighlightedSectionId(null);
    },
    [setHighlightedSectionId],
  );

  return (
    <div
      className={`toc-highlight-main min-w-0 ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>
  );
}

export function useTocNavHighlight(sectionId: string) {
  const ctx = useContext(TocSectionHighlightContext);
  return ctx?.highlightedSectionId === sectionId;
}

export function useTocNavActive(sectionId: string) {
  const ctx = useContext(TocSectionHighlightContext);
  if (!ctx) return false;
  if (ctx.highlightedSectionId) return false;
  return ctx.activeSectionId === sectionId;
}
