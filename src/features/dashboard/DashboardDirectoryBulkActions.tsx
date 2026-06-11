import { Copy } from "lucide-react";
import { HubBulkActionButton } from "@tool-workspace/hub-ui";

type Props = {
  hasSelection: boolean;
  selectedCount: number;
  onCopyPaths: () => void;
};

/** Dashboard row-2 — Copy paths only (pin per card footer). */
export function DashboardDirectoryBulkActions({
  hasSelection,
  selectedCount,
  onCopyPaths,
}: Props) {
  return (
    <HubBulkActionButton
      icon={<Copy size={14} aria-hidden />}
      label="Copy paths"
      title="Copy selected screen paths to clipboard"
      tone="neutral"
      disabled={!hasSelection}
      selectedCount={hasSelection ? selectedCount : undefined}
      onClick={onCopyPaths}
    />
  );
}
