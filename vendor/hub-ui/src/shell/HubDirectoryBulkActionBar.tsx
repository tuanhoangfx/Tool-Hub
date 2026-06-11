import type { ReactNode } from "react";
import { HubDirectorySelectAllChip, type HubDirectorySelectAllChipProps } from "./HubDirectorySelectAllChip";

export type HubDirectoryBulkActionBarProps = {
  /** Card-view select-all — omit in table view. */
  selectAll?: HubDirectorySelectAllChipProps | null;
  children?: ReactNode;
};

/** Golden filter row 2 — select-all + bulk CTAs (`filterRowActions`; FilterBar aligns end). */
export function HubDirectoryBulkActionBar({ selectAll, children }: HubDirectoryBulkActionBarProps) {
  const showSelectAll = selectAll != null && selectAll.visibleCount > 0;
  if (!showSelectAll && !children) return null;
  return (
    <>
      {showSelectAll ? <HubDirectorySelectAllChip {...selectAll} /> : null}
      {children}
    </>
  );
}
