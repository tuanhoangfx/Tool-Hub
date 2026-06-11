import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

export type VirtualWindowLayout = "offset" | "pad";

export type UseVirtualWindowOptions = {
  /** Enable windowing when item count reaches this (default 48). */
  threshold?: number;
  overscan?: number;
  rowHeight: number;
  /** Gap between rows in px — used for offset layout stride (default 0). */
  rowGap?: number;
  /** offset: translateY list; pad: spacer rows in table tbody */
  layout?: VirtualWindowLayout;
  initialVisible?: number;
};

export function virtualWindowStride(rowHeight: number, rowGap = 0): number {
  return rowHeight + rowGap;
}

export function virtualWindowContentHeight(count: number, rowHeight: number, rowGap = 0): number {
  if (count <= 0) return 0;
  return count * rowHeight + (count - 1) * rowGap;
}

export function isVirtualIndexInView(
  el: HTMLElement,
  index: number,
  rowHeight: number,
  stride: number,
  margin = 6,
): boolean {
  const rowTop = index * stride;
  const rowBottom = rowTop + rowHeight;
  const viewTop = el.scrollTop;
  const viewBottom = viewTop + el.clientHeight;
  return rowTop >= viewTop + margin && rowBottom <= viewBottom - margin;
}

export function scrollVirtualIndexIntoView(
  el: HTMLElement,
  index: number,
  rowHeight: number,
  stride: number,
  behavior: ScrollBehavior = "smooth",
  margin = 6,
): void {
  const rowTop = index * stride;
  const rowBottom = rowTop + rowHeight;
  const viewTop = el.scrollTop;
  const viewBottom = viewTop + el.clientHeight;
  if (rowTop >= viewTop + margin && rowBottom <= viewBottom - margin) return;
  if (rowTop < viewTop + margin) {
    el.scrollTo({ top: Math.max(0, rowTop - margin), behavior });
    return;
  }
  el.scrollTo({ top: rowBottom - el.clientHeight + margin, behavior });
}

/**
 * Generic scroll-window hook — Notes list rail (offset) and directory tables (pad).
 */
export function useVirtualWindow<T>(items: readonly T[], options: UseVirtualWindowOptions) {
  const {
    threshold = 48,
    overscan = 8,
    rowHeight,
    rowGap = 0,
    layout = "offset",
    initialVisible = 32,
  } = options;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const enabled = items.length >= threshold;
  const stride = layout === "offset" ? virtualWindowStride(rowHeight, rowGap) : rowHeight;
  const [range, setRange] = useState(() => ({
    start: 0,
    end: Math.min(items.length, initialVisible),
  }));

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !enabled) {
      setRange({ start: 0, end: items.length });
      return;
    }
    const start = Math.max(0, Math.floor(el.scrollTop / stride) - overscan);
    const count = Math.ceil(el.clientHeight / stride) + overscan * 2;
    const end = Math.min(items.length, start + count);
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, [enabled, items.length, overscan, stride]);

  useLayoutEffect(() => {
    update();
  }, [items.length, stride, enabled, update]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [update]);

  const visible = useMemo(
    () =>
      items.slice(range.start, range.end).map((item, i) => ({
        item,
        index: range.start + i,
      })),
    [items, range.end, range.start],
  );

  const offsetY = enabled && layout === "offset" ? range.start * stride : 0;
  const totalHeight =
    enabled && layout === "offset"
      ? virtualWindowContentHeight(items.length, rowHeight, rowGap)
      : enabled && layout === "pad"
        ? items.length * rowHeight
        : undefined;
  const padTop = enabled && layout === "pad" ? range.start * rowHeight : 0;
  const padBottom = enabled && layout === "pad" ? Math.max(0, (items.length - range.end) * rowHeight) : 0;

  return {
    scrollRef,
    enabled,
    visible,
    stride,
    offsetY,
    totalHeight,
    padTop,
    padBottom,
  };
}
