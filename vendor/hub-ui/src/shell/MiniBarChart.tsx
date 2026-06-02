import type { FilterIconMeta } from "../../lib/badge-registry";
import { compactIconSize } from "../../lib/ui-scale";

export type BarItem = { label: string; value: number; color?: string; iconMeta?: FilterIconMeta | null };

function fmtInt(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function MiniBarChart({
  title,
  items,
  max,
  formatter,
}: {
  title: string;
  items: BarItem[];
  max?: number;
  formatter?: (n: number) => string;
}) {
  const m = max ?? Math.max(1, ...items.map((i) => i.value));
  const fmt = formatter ?? fmtInt;

  return (
    <div className="rounded-2xl border border-white/5 bg-[var(--panel)] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-[var(--muted)]">{title}</div>
      <ul className="space-y-1.5">
        {items.map((it, i) => {
          const pct = Math.max(2, (it.value / m) * 100);
          const color = it.color ?? defaultColor(i);
          return (
            <li key={i} className="anim-slide flex items-center gap-2 text-xs">
              <span className="flex w-24 min-w-0 items-center gap-1 truncate text-[var(--muted)]" title={it.label}>
                {it.iconMeta ? (
                  <it.iconMeta.icon size={compactIconSize(11)} className={`shrink-0 ${it.iconMeta.className}`} aria-hidden />
                ) : null}
                <span className="truncate">{it.label}</span>
              </span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}55` }}
                />
              </div>
              <span className="w-14 text-right font-mono text-[10px] tabular-nums">{fmt(it.value)}</span>
            </li>
          );
        })}
        {items.length === 0 ? <li className="py-4 text-center text-xs text-[var(--muted)]">—</li> : null}
      </ul>
    </div>
  );
}

function defaultColor(i: number): string {
  const palette = ["#818cf8", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#f43f5e"];
  return palette[i % palette.length]!;
}
