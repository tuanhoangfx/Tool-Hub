import { MetricBadge } from "../../components/sales-shell/MetricBadge";
import { ToolCodeBadge } from "../hub/hub-tool-ui";
import type { ToolBindingRow } from "./SystemSupabaseQuotaPanel.types";
import { formatToolUsedByTooltip, toolCategoryForCode } from "./supabase-project-tools";

type SupabaseProjectToolBadgesProps = {
  tools: string[];
  bindings?: ToolBindingRow[];
  /** Extra codes shown as +N with combined tooltip */
  maxVisible?: number;
};

export function SupabaseProjectToolBadges({
  tools,
  bindings,
  maxVisible = 4,
}: SupabaseProjectToolBadgesProps) {
  if (!tools.length) return null;

  const visible = tools.slice(0, maxVisible);
  const extra = tools.length - visible.length;

  return (
    <span className="inline-flex min-h-[var(--hub-metric-badge-h)] flex-wrap items-center gap-1">
      {visible.map((code) => (
        <ToolCodeBadge
          key={code}
          code={code}
          category={toolCategoryForCode(code)}
          title={formatToolUsedByTooltip(code, bindings)}
        />
      ))}
      {extra > 0 ? (
        <MetricBadge
          label={`+${extra}`}
          mono
          title={tools
            .slice(maxVisible)
            .map((code) => formatToolUsedByTooltip(code, bindings))
            .join("\n\n")}
          variantClass="border-white/12 bg-white/[0.06] text-[var(--muted)]"
        />
      ) : null}
    </span>
  );
}
