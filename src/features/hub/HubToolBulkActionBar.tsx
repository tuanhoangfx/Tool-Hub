import { Package, RefreshCw } from "lucide-react";

type HubToolBulkActionBarProps = {
  hasSelection: boolean;
  selectedCount: number;
  busy: boolean;
  onRefreshSelected: () => void;
  onSyncWorkspace: () => void;
};

const btnBase =
  "inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function HubToolBulkActionBar({
  hasSelection,
  selectedCount,
  busy,
  onRefreshSelected,
  onSyncWorkspace,
}: HubToolBulkActionBarProps) {
  return (
    <>
      <button
        type="button"
        disabled={!hasSelection || busy}
        onClick={onRefreshSelected}
        title={hasSelection ? "Refresh GitHub metadata for selected tools" : "Select one or more tools"}
        className={`${btnBase} border border-indigo-400/35 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25`}
      >
        <RefreshCw size={14} className={busy ? "animate-spin" : ""} aria-hidden />
        Refresh
        {hasSelection ? (
          <span className="grid h-4 min-w-[var(--hub-count-badge-min-w)] place-items-center rounded-full bg-indigo-400 px-1 text-[9px] font-bold text-[#0f1220]">
            {selectedCount}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onSyncWorkspace}
        title="Scan workspace + refresh registry and quota"
        className={`${btnBase} border border-sky-500/30 bg-sky-500/12 text-sky-100 hover:bg-sky-500/20`}
      >
        <Package size={14} aria-hidden />
        Sync workspace
      </button>
    </>
  );
}
