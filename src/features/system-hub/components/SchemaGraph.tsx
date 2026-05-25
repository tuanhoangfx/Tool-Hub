'use client';
import { useMemo, useState } from 'react';
import type { FieldSpec } from "../../../lib/hub-schema-spec";
import { GROUP_TONE } from "../../../lib/hub-schema-spec";
import { resolveFieldSpecIcon } from "../../../lib/badge-registry";
import { SchemaGroupBadge, SchemaModeBadge } from "./SchemaBadges";

/**
 * Obsidian-style relationship graph for one entity's field registry.
 *
 * Radial layout (zero-dependency, deterministic):
 *   - Center: the entity hub (orders / buyers / products).
 *   - Ring 1: one node per group, evenly spaced around the entity.
 *   - Ring 2: each group's fields fan out from its group node.
 *   - FK edges: dashed lines from foreign-key fields to a "ghost" node
 *     representing the target entity, placed outside the outer ring.
 *
 * Node color encodes group; ring color encodes mode (input/auto/derive/
 * compute/ro). Hover a field or group to see details in the side panel.
 */

type Props = {
  spec: FieldSpec[];
  groups: readonly string[];
  entity: string;
  overrides: number;
  customs: number;
  /** Shorter graph for System schema tab (Hub shell above). */
  compact?: boolean;
};

const W = 760;
const H = 460;
const CX = W / 2;
const CY = H / 2;
const R_GROUP = 130;
const R_FIELD = 56;

const MODE_HEX: Record<string, string> = {
  input:   '#34d399',
  auto:    '#c084fc',
  derive:  '#fbbf24',
  compute: '#22d3ee',
  ro:      '#94a3b8',
};

function GROUP_FILL(group: string) {
  const tone = GROUP_TONE[group];
  const map: Record<string, string> = {
    'bg-slate-500':   '#64748b',
    'bg-rose-500':    '#f43f5e',
    'bg-emerald-500': '#10b981',
    'bg-cyan-500':    '#06b6d4',
    'bg-blue-500':    '#3b82f6',
    'bg-orange-500':  '#f97316',
    'bg-indigo-500':  '#6366f1',
    'bg-yellow-500':  '#eab308',
    'bg-amber-500':   '#f59e0b',
    'bg-teal-500':    '#14b8a6',
    'bg-purple-500':  '#a855f7',
    'bg-fuchsia-500': '#d946ef',
  };
  return map[tone?.bar] ?? '#64748b';
}

function detectFk(col: string): string | null {
  if (col === 'buyer_id')       return 'buyers';
  if (col === 'product_name')   return 'products';
  if (col === 'seller_display') return 'sellers';
  return null;
}

export function SchemaGraph({ spec, groups, entity, overrides, customs, compact = false }: Props) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const layout = useMemo(() => computeLayout(spec, groups), [spec, groups]);
  const fkNodes = useMemo(() => collectFkTargets(spec), [spec]);

  const hovered = hoverKey
    ? layout.fieldPositions.find((p) => p.key === hoverKey) ?? null
    : null;
  const hoveredField = hoverKey ? spec.find((f) => f.key === hoverKey) : null;

  return (
    <section className={`rounded-2xl border border-white/5 bg-[var(--panel)] ${compact ? "p-2.5" : "p-3"}`}>
      <header className={`flex items-baseline justify-between gap-3 ${compact ? "mb-1.5" : "mb-2"}`}>
        <h1 className="text-base font-semibold">
          Database Schema · <code className="font-mono text-indigo-300">{entity}</code>
        </h1>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="rounded bg-white/[.04] px-1.5 py-0.5 text-[var(--muted)]">
            {spec.length} fields · {groups.length} groups
          </span>
          {overrides > 0 && (
            <span className="rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-indigo-300">{overrides} override</span>
          )}
          {customs > 0 && (
            <span className="rounded-full bg-fuchsia-500/15 px-1.5 py-0.5 text-fuchsia-300">{customs} custom</span>
          )}
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="overflow-hidden rounded-xl border border-white/5 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.06),transparent_70%)]">
          <svg viewBox={`0 0 ${W} ${H}`} className={compact ? "h-[min(280px,42vh)] w-full" : "h-[460px] w-full"}>
            {/* Grid backdrop */}
            <defs>
              <pattern id="g-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#ffffff08" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={W} height={H} fill="url(#g-dots)" />

            {/* Group-membership edges (entity → group → field) */}
            {layout.groupPositions.map((gp) => (
              <line
                key={`eg-${gp.group}`}
                x1={CX}
                y1={CY}
                x2={gp.x}
                y2={gp.y}
                stroke={GROUP_FILL(gp.group)}
                strokeOpacity="0.25"
                strokeWidth="1.2"
              />
            ))}
            {layout.fieldPositions.map((fp) => {
              const gp = layout.groupPositions.find((g) => g.group === fp.group);
              if (!gp) return null;
              return (
                <line
                  key={`ef-${fp.key}`}
                  x1={gp.x}
                  y1={gp.y}
                  x2={fp.x}
                  y2={fp.y}
                  stroke={GROUP_FILL(fp.group)}
                  strokeOpacity={hoverKey === fp.key ? 0.8 : 0.18}
                  strokeWidth={hoverKey === fp.key ? 1.5 : 0.8}
                />
              );
            })}

            {/* FK edges to ghost nodes */}
            {layout.fieldPositions.map((fp) => {
              const fk = detectFk(fp.col);
              if (!fk) return null;
              const ghost = fkNodes[fk];
              if (!ghost) return null;
              return (
                <line
                  key={`fk-${fp.key}`}
                  x1={fp.x}
                  y1={fp.y}
                  x2={ghost.x}
                  y2={ghost.y}
                  stroke="#22d3ee"
                  strokeOpacity={hoverKey === fp.key ? 0.9 : 0.4}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* FK ghost nodes */}
            {Object.entries(fkNodes).map(([target, pos]) => (
              <g key={`g-${target}`}>
                <circle cx={pos.x} cy={pos.y} r="14" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="2 2" />
                <text x={pos.x} y={pos.y + 3} textAnchor="middle" fontSize="9" fill="#22d3ee" className="font-mono">
                  {target}
                </text>
              </g>
            ))}

            {/* Group nodes */}
            {layout.groupPositions.map((gp) => {
              const color = GROUP_FILL(gp.group);
              const isHoveredGroup = hovered?.group === gp.group;
              return (
                <g key={`g-${gp.group}`}>
                  <circle
                    cx={gp.x}
                    cy={gp.y}
                    r={isHoveredGroup ? 17 : 14}
                    fill={color}
                    fillOpacity="0.18"
                    stroke={color}
                    strokeWidth={isHoveredGroup ? 2 : 1.4}
                  />
                  <text x={gp.x} y={gp.y + 28} textAnchor="middle" fontSize="10" fill="#e5e7eb" className="pointer-events-none font-medium">
                    {gp.group}
                  </text>
                  <text x={gp.x} y={gp.y + 3} textAnchor="middle" fontSize="9" fill={color} className="pointer-events-none font-bold">
                    {gp.count}
                  </text>
                </g>
              );
            })}

            {/* Field nodes */}
            {layout.fieldPositions.map((fp) => {
              const color = GROUP_FILL(fp.group);
              const isHover = hoverKey === fp.key;
              const ringColor = MODE_HEX[fp.mode] ?? '#94a3b8';
              return (
                <g
                  key={`f-${fp.key}`}
                  onMouseEnter={() => setHoverKey(fp.key)}
                  onMouseLeave={() => setHoverKey(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={fp.x}
                    cy={fp.y}
                    r={isHover ? 7 : 4.5}
                    fill={color}
                    fillOpacity={isHover ? 0.95 : 0.7}
                    stroke={ringColor}
                    strokeWidth={isHover ? 2 : 1.2}
                  />
                  {isHover && (
                    <text
                      x={fp.x}
                      y={fp.y - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#e5e7eb"
                      className="pointer-events-none font-medium"
                    >
                      {fp.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Entity hub (center, on top) */}
            <circle cx={CX} cy={CY} r="26" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
            <text x={CX} y={CY + 4} textAnchor="middle" fontSize="12" fill="#e0e7ff" className="font-mono font-semibold">
              {entity}
            </text>
            <text x={CX} y={CY + 18} textAnchor="middle" fontSize="9" fill="#a5b4fc">
              {spec.length} fields
            </text>
          </svg>
        </div>

        {/* Side panel — legend + hover detail */}
        <aside className="space-y-2">
          <div className="rounded-xl border border-white/5 bg-white/[.02] p-2.5">
            <div className="text-[9px] uppercase tracking-wider text-[var(--muted)]/70">Mode ring</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(["input", "derive", "auto", "compute", "ro"] as const).map((m) => (
                <SchemaModeBadge key={m} mode={m} />
              ))}
            </div>
            <div className="mt-2 text-[9px] uppercase tracking-wider text-[var(--muted)]/70">Groups</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {groups.map((g) => (
                <SchemaGroupBadge key={g} group={g} className="text-[9px]" />
              ))}
            </div>
            <div className="mt-2 border-t border-white/5 pt-1.5 text-[9px] text-[var(--muted)]/70">
              FK lines: <span className="font-mono text-cyan-300">— — —</span>
            </div>
          </div>

          <div className="min-h-[140px] rounded-xl border border-white/5 bg-white/[.02] p-2.5">
            <div className="text-[9px] uppercase tracking-wider text-[var(--muted)]/70">Hover detail</div>
            {hoveredField ? (
              <div className="mt-1 space-y-1 text-[10px]">
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const fi = resolveFieldSpecIcon(hoveredField);
                    const FieldIcon = fi.icon;
                    return <FieldIcon size={12} className={fi.className} aria-hidden />;
                  })()}
                  <span className="font-semibold">{hoveredField.label}</span>
                </div>
                <div className="font-mono text-indigo-300">{hoveredField.col}</div>
                <div className="flex flex-wrap gap-1 text-[9px]">
                  <SchemaGroupBadge group={hoveredField.group} />
                  <SchemaModeBadge mode={hoveredField.mode as import("../../../lib/hub-schema-spec").Mode} />
                  <span className="rounded-full bg-white/[.04] px-1.5 py-0.5 font-mono text-[var(--muted)]">
                    {hoveredField.type}
                  </span>
                </div>
                {detectFk(hoveredField.col) && (
                  <div className="text-[9px] text-cyan-300">
                    → references <span className="font-mono">{detectFk(hoveredField.col)}</span>
                  </div>
                )}
                {hoveredField.source && (
                  <div className="text-[9px] text-[var(--muted)]/80 leading-snug">{hoveredField.source}</div>
                )}
              </div>
            ) : (
              <div className="mt-2 text-[10px] text-[var(--muted)]/50">Hover a node to inspect.</div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────

type FieldPos = { key: string; col: string; label: string; group: string; mode: string; x: number; y: number };
type GroupPos = { group: string; count: number; x: number; y: number; angle: number };

function computeLayout(spec: FieldSpec[], groups: readonly string[]): {
  groupPositions: GroupPos[];
  fieldPositions: FieldPos[];
} {
  // Only consider groups that have at least one field
  const activeGroups = groups.filter((g) => spec.some((f) => f.group === g));
  const G = activeGroups.length;

  const groupPositions: GroupPos[] = activeGroups.map((group, i) => {
    const angle = (i / G) * 2 * Math.PI - Math.PI / 2;
    return {
      group,
      count: spec.filter((f) => f.group === group).length,
      x: CX + R_GROUP * Math.cos(angle),
      y: CY + R_GROUP * Math.sin(angle),
      angle,
    };
  });

  const fieldPositions: FieldPos[] = [];
  for (const gp of groupPositions) {
    const fields = spec.filter((f) => f.group === gp.group);
    // Fan fields outward from the group node, spread over a small arc
    const N = fields.length;
    const spread = Math.min((Math.PI * 2) / G * 0.85, Math.PI / 2);
    for (let i = 0; i < N; i++) {
      const t = N === 1 ? 0 : (i / (N - 1)) - 0.5; // -0.5..+0.5
      const angle = gp.angle + t * spread;
      // Use radial distance — fields sit outside the group node
      const r = R_FIELD + (i % 2 === 0 ? 0 : 16); // alternate inner/outer for crowding
      const f = fields[i];
      fieldPositions.push({
        key: f.key,
        col: f.col,
        label: f.label,
        group: gp.group,
        mode: f.mode,
        x: gp.x + r * Math.cos(angle),
        y: gp.y + r * Math.sin(angle),
      });
    }
  }
  return { groupPositions, fieldPositions };
}

function collectFkTargets(spec: FieldSpec[]): Record<string, { x: number; y: number }> {
  const targets = new Set<string>();
  for (const f of spec) {
    const t = detectFk(f.col);
    if (t) targets.add(t);
  }
  const list = Array.from(targets);
  const out: Record<string, { x: number; y: number }> = {};
  const R = 220;
  list.forEach((t, i) => {
    // Place ghost nodes near the right edge, vertically spaced
    const angle = -Math.PI / 4 + (i / Math.max(1, list.length - 1)) * (Math.PI / 2);
    out[t] = {
      x: CX + R * Math.cos(angle),
      y: CY + R * Math.sin(angle),
    };
  });
  return out;
}
