import { Copy, ExternalLink, SquareStack, Star } from "lucide-react";

type DashboardBulkActionBarProps = {
  hasSelection: boolean;
  selectedCount: number;
  onOpenFirst: () => void;
  onOpenAllTabs: () => void;
  onCopyPaths: () => void;
  onPinSelected: () => void;
};

const btnBase =
  "inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function DashboardBulkActionBar({
  hasSelection,
  selectedCount,
  onOpenFirst,
  onOpenAllTabs,
  onCopyPaths,
  onPinSelected,
}: DashboardBulkActionBarProps) {
  return (
    <>
      <button
        type="button"
        disabled={!hasSelection}
        onClick={onOpenFirst}
        title={hasSelection ? "Open first selected screen" : "Select one or more screens"}
        className={`${btnBase} border border-indigo-400/35 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25`}
      >
        <ExternalLink size={14} aria-hidden />
        Open first
        {hasSelection ? (
          <span className="grid h-4 min-w-[var(--hub-count-badge-min-w)] place-items-center rounded-full bg-indigo-400 px-1 text-[9px] font-bold text-[#0f1220]">
            {selectedCount}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        disabled={!hasSelection}
        onClick={onOpenAllTabs}
        title="Open each selected screen in a new browser tab"
        className={`${btnBase} border border-sky-500/30 bg-sky-500/12 text-sky-100 hover:bg-sky-500/20`}
      >
        <SquareStack size={14} aria-hidden />
        Open all tabs
      </button>
      <button
        type="button"
        disabled={!hasSelection}
        onClick={onCopyPaths}
        title="Copy selected screen paths to clipboard"
        className={`${btnBase} border border-white/10 bg-white/[0.03] text-[var(--muted)] hover:bg-white/[0.06] hover:text-[var(--text)]`}
      >
        <Copy size={14} aria-hidden />
        Copy paths
      </button>
      <button
        type="button"
        disabled={!hasSelection}
        onClick={onPinSelected}
        title="Pin selected screens"
        className={`${btnBase} border border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20`}
      >
        <Star size={14} aria-hidden />
        Pin selected
      </button>
    </>
  );
}
