import type { QuotaBudgetLine } from "./supabase-quota-budget";
import { formatQuotaLineInline } from "./supabase-quota-budget";

type QuotaUsageInlineProps = {
  line: QuotaBudgetLine;
};

/** Single-line used/limit (no progress bar). */
export function QuotaUsageInline({ line }: QuotaUsageInlineProps) {
  return (
    <p className="truncate text-[10px] leading-snug" title={line.hint ?? formatQuotaLineInline(line)}>
      <span className="text-[var(--muted)]">{line.label}: </span>
      <span className="font-medium tabular-nums text-[var(--text)]">{formatQuotaLineInline(line)}</span>
    </p>
  );
}

type QuotaBudgetBlockProps = {
  lines: QuotaBudgetLine[];
  maxLines?: number;
  excludeKeys?: string[];
};

export function QuotaBudgetBlock({ lines, maxLines = 3, excludeKeys = [] }: QuotaBudgetBlockProps) {
  const exclude = new Set(excludeKeys);
  const shown = lines.filter((l) => !exclude.has(l.key)).slice(0, maxLines);
  if (!shown.length) return null;
  return (
    <div className="space-y-0.5">
      {shown.map((line) => (
        <QuotaUsageInline key={line.key} line={line} />
      ))}
    </div>
  );
}
