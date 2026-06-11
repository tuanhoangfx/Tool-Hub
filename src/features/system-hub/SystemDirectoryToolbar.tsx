import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { DirectorySearchToolbar, type HubViewMode, type TimeRange } from "@tool-workspace/hub-ui";

type Props = {
  viewMode: HubViewMode;
  onViewModeChange: (mode: HubViewMode) => void;
  countIcon: LucideIcon;
  shown: number;
  total: number;
  countLabel?: string;
  refreshing: boolean;
  onRefresh: () => void;
  showTimeRange?: boolean;
  timeRange?: TimeRange;
  trailing?: ReactNode;
  showRefresh?: boolean;
};

/** Golden directory toolbar for System tabs — same contract as HubListPage filterToolbar. */
export function SystemDirectoryToolbar({
  viewMode,
  onViewModeChange,
  countIcon,
  shown,
  total,
  countLabel = "items",
  refreshing,
  onRefresh,
  showTimeRange = false,
  timeRange,
  trailing,
  showRefresh = true,
}: Props) {
  return (
    <DirectorySearchToolbar
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      countIcon={countIcon}
      shown={shown}
      total={total}
      countLabel={countLabel}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showTimeRange={showTimeRange}
      timeRange={timeRange}
      showTablePageSize
      showRefresh={showRefresh}
      trailing={trailing}
    />
  );
}
