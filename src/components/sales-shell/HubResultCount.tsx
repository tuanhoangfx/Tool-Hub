import type { LucideIcon } from "lucide-react";

/** Matches ViewToggle row height (hub toolbar). */
export function HubResultCount({
  icon: Icon,
  shown,
  total,
}: {
  icon: LucideIcon;
  shown: number;
  total: number;
}) {
  return (
    <span
      className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 text-xs font-semibold tabular-nums text-cyan-100 shadow-sm shadow-cyan-500/10"
      title={`${shown} of ${total} tools shown`}
    >
      <Icon size={14} className="shrink-0 text-cyan-300/90" />
      <span>
        {shown}
        <span className="mx-0.5 font-normal text-cyan-300/50">/</span>
        {total}
      </span>
    </span>
  );
}
