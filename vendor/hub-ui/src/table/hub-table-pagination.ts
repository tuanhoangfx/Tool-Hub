import { useEffect, useMemo, useState } from "react";

/** Default rows per Overview / panel table page (E0001 route pager parity). */
export const HUB_TABLE_PAGE_SIZE = 25;

export type HubTablePaginationState<T> = {
  pageIndex: number;
  pageItems: T[];
  totalCount: number;
  totalPages: number;
  pageSize: number;
  rangeStart: number;
  rangeEnd: number;
  showPager: boolean;
  goPrev: () => void;
  goNext: () => void;
  setPageIndex: (index: number) => void;
};

export function paginateHubTableItems<T>(
  items: readonly T[],
  pageIndex: number,
  pageSize = HUB_TABLE_PAGE_SIZE,
): Omit<HubTablePaginationState<T>, "goPrev" | "goNext" | "setPageIndex"> {
  const totalCount = items.length;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1;
  const clampedPageIndex = Math.min(Math.max(0, pageIndex), Math.max(0, totalPages - 1));
  const pageStart = clampedPageIndex * pageSize;
  const pageItems = items.slice(pageStart, pageStart + pageSize);
  const rangeStart = totalCount > 0 ? pageStart + 1 : 0;
  const rangeEnd = Math.min(totalCount, pageStart + pageSize);

  return {
    pageIndex: clampedPageIndex,
    pageItems,
    totalCount,
    totalPages,
    pageSize,
    rangeStart,
    rangeEnd,
    showPager: totalCount > pageSize,
  };
}

export function useHubTablePagination<T>(
  items: readonly T[],
  options?: { pageSize?: number; resetKey?: string | number | boolean | null },
): HubTablePaginationState<T> {
  const pageSize = options?.pageSize ?? HUB_TABLE_PAGE_SIZE;
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [options?.resetKey]);

  const base = useMemo(() => paginateHubTableItems(items, pageIndex, pageSize), [items, pageIndex, pageSize]);
  const totalPages = base.totalPages;

  return {
    ...base,
    goPrev: () => setPageIndex((p) => Math.max(0, p - 1)),
    goNext: () => setPageIndex((p) => Math.min(totalPages - 1, p + 1)),
    setPageIndex: (index: number) =>
      setPageIndex(Math.min(Math.max(0, index), Math.max(0, totalPages - 1))),
  };
}
