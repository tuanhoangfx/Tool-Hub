import type { FilterIconMeta } from "../../lib/badge-registry";
import { compactIconSize } from "../../lib/ui-scale";

export type DonutItem = { label: string; value: number; color?: string; iconMeta?: FilterIconMeta | null };

const PALETTE = ["#818cf8", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#f43f5e", "#facc15"];

function fmtInt(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function MiniDonut({
  title,
  items,
  total: customTotal,
  size = compactIconSize(110),
}: {
  title: string;
  items: DonutItem[];
  total?: number;
  size?: number;
}) {
  const total = customTotal ?? items.reduce((s, i) => s + i.value, 0);
  const safe = Math.max(total, 1);
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  type Slice = DonutItem & { color: string; dasharray: string; dashoffset: number };
  const slices = items.reduce<{ acc: number; out: Slice[] }>(
    (state, it, i) => {
      const len = (it.value / safe) * c;
      const dasharray = `${len} ${c - len}`;
      const dashoffset = -state.acc;
      state.out.push({
        ...it,
        color: it.color ?? PALETTE[i % PALETTE.length],
        dasharray,
        dashoffset,
      });
      return { acc: state.acc + len, out: state.out };
    },
    { acc: 0, out: [] },
  ).out;

  return (
    <div className="rounded-2xl border border-white/5 bg-[var(--panel)] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-[var(--muted)]">{title}</div>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff10" strokeWidth={stroke} />
            {slices.map((s, i) => (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={s.dasharray}
                strokeDashoffset={s.dashoffset}
                strokeLinecap="butt"
                style={{ transition: "stroke-dasharray .8s ease-out, stroke-dashoffset .8s ease-out" }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-base font-semibold tabular-nums leading-none">{compact(total)}</div>
              <div className="text-[9px] text-[var(--muted)]">total</div>
            </div>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-1 text-xs">
          {slices.slice(0, 6).map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              {s.iconMeta ? (
                <s.iconMeta.icon size={compactIconSize(11)} className={`shrink-0 ${s.iconMeta.className}`} aria-hidden />
              ) : (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
              )}
              <span className="truncate text-[var(--muted)]" title={s.label}>
                {s.label}
              </span>
              <span className="ml-auto font-mono text-[10px] tabular-nums">{fmtInt(s.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}
