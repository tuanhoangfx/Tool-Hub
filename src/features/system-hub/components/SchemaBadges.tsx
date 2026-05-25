import { GROUP_TONE, MODE_TONE, type Mode } from "../../../lib/hub-schema-spec";
import { MetricBadge } from "../../../components/sales-shell/MetricBadge";
import { MODE_LABEL_SHORT, SCHEMA_GROUP, SCHEMA_MODE } from "../../../lib/badge-registry";

export function SchemaGroupBadge({
  group,
  suffix,
  className = "",
}: {
  group: string;
  suffix?: string;
  className?: string;
}) {
  const t = GROUP_TONE[group];
  const variantClass = t ? `${t.border} ${t.bg} ${t.text}` : "border-white/10 bg-white/[.04] text-[var(--muted)]";
  const label = suffix ? `${group} ${suffix}` : group;
  return (
    <MetricBadge
      label={label}
      iconMeta={SCHEMA_GROUP[group] ?? SCHEMA_GROUP.Classification}
      variantClass={variantClass}
      className={className}
    />
  );
}

export function SchemaModeBadge({ mode, count }: { mode: Mode; count?: number }) {
  const label = count != null ? `${MODE_LABEL_SHORT[mode]} ${count}` : MODE_LABEL_SHORT[mode];
  return (
    <MetricBadge
      label={label}
      iconMeta={SCHEMA_MODE[mode]}
      variantClass={`rounded-full border ${MODE_TONE[mode]}`}
      className="text-[9px]"
    />
  );
}
