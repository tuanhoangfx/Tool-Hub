import { GROUP_TONE, TYPE_TONE, slug, type FieldSpec, type Mode } from "../../../lib/hub-schema-spec";
import { resolveDeployBadge } from "../../../lib/badge-registry";
import { resolveFieldSpecIcon, resolveHealthStatusIcon } from "../../../lib/badge-registry";
import { MetricBadge } from "../../../components/sales-shell/MetricBadge";
import { SchemaGroupBadge, SchemaModeBadge } from "./SchemaBadges";

const DEPLOY_OPTION_KEYS = new Set(["vercel", "github-pages", "vps", "github-release", "local"]);

function SchemaOptionBadge({ value }: { value: string }) {
  if (DEPLOY_OPTION_KEYS.has(value)) {
    const b = resolveDeployBadge(value);
    return (
      <MetricBadge label={b.label} iconMeta={b.iconMeta} tone={b.tone} className="text-[9px] font-mono" />
    );
  }
  const health = resolveHealthStatusIcon(value);
  if (health) {
    return (
      <MetricBadge
        label={value}
        iconMeta={health}
        tone={value === "Ready" || value === "Active" ? "ok" : "neutral"}
        className="text-[9px]"
      />
    );
  }
  return <span className="rounded bg-white/5 px-1 text-[9px] font-mono">{value}</span>;
}

export function SpecTable({
  spec,
  groups,
  tableName,
  compact = false,
}: {
  spec: FieldSpec[];
  groups: readonly string[];
  tableName: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--text)]">
          <code className="font-mono text-indigo-300">{tableName}</code>
        </h3>
        <span className="text-[10px] text-[var(--muted)]">
          <strong className="text-[var(--text)]">{spec.length}</strong> fields ·{" "}
          <strong className="text-[var(--text)]">{groups.length}</strong> groups
        </span>
      </div>

      <div className={`flex flex-wrap items-center gap-1.5 rounded-lg border border-white/5 bg-white/[.02] ${compact ? "p-1.5" : "p-2"}`}>
        <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Jump:</span>
        {groups.map((g) => {
          const count = spec.filter((f) => f.group === g).length;
          return (
            <a key={g} href={`#${tableName}-${slug(g)}`} className="transition-opacity hover:opacity-80">
              <SchemaGroupBadge group={g} suffix={`(${count})`} className="rounded-full px-2" />
            </a>
          );
        })}
      </div>

      {groups.map((g) => {
        const fields = spec.filter((f) => f.group === g);
        if (fields.length === 0) return null;
        const t = GROUP_TONE[g];
        const borderLeft = t ? `border-l-4 ${t.border}` : "border-l-4 border-white/20";
        const bgSection = t ? t.bg : "bg-white/[.02]";

        return (
          <section
            key={g}
            id={`${tableName}-${slug(g)}`}
            className={`overflow-hidden rounded-xl ${borderLeft} border-y border-r border-white/10 ${bgSection}`}
          >
            <div className={`flex items-center justify-between gap-2 border-b border-white/10 ${compact ? "px-2 py-1" : "px-3 py-2"}`}>
              <div className="flex items-center gap-2">
                {t ? <span className={`inline-block h-2 w-2 rounded-full ${t.bar}`} /> : null}
                <SchemaGroupBadge group={g} />
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--muted)]">{fields.length} fields</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(["input", "derive", "auto", "compute", "ro"] as Mode[]).map((m) => {
                  const n = fields.filter((f) => f.mode === m).length;
                  if (n === 0) return null;
                  return <SchemaModeBadge key={m} mode={m} count={n} />;
                })}
              </div>
            </div>

            <div className="rounded-lg border border-white/5 p-2">
            <div className={`overflow-x-auto rounded-md bg-black/10 ${compact ? "max-h-[min(42vh,22rem)] overflow-y-auto" : ""}`}>
              <table className={`w-full ${compact ? "text-[10px]" : "text-[11px]"}`}>
                <thead className="sticky top-0 z-[1] bg-[var(--panel)] text-[9px] uppercase tracking-wider text-[var(--muted)]/70">
                  <tr>
                    <th className={`w-8 px-2 text-left ${compact ? "py-1" : "py-1.5"}`}>#</th>
                    <th className={`w-52 px-2 text-left ${compact ? "py-1" : "py-1.5"}`}>Field</th>
                    <th className={`w-40 px-2 text-left ${compact ? "py-1" : "py-1.5"}`}>DB col</th>
                    <th className={`w-16 px-2 text-left ${compact ? "py-1" : "py-1.5"}`}>Type</th>
                    <th className={`w-24 px-2 text-left ${compact ? "py-1" : "py-1.5"}`}>Mode</th>
                    <th className={`w-20 px-2 text-left ${compact ? "py-1" : "py-1.5"}`}>Default</th>
                    <th className={`px-2 text-left ${compact ? "py-1" : "py-1.5"}`}>Source / Logic</th>
                    <th className={`w-44 px-2 text-left ${compact ? "py-1" : "py-1.5"}`}>Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fields.map((f) => {
                    const globalIdx = spec.findIndex((s) => s.key === f.key) + 1;
                    const cellPy = compact ? "py-1" : "py-1.5";
                    return (
                      <tr key={f.key} className="hover:bg-white/[.03]">
                        <td className={`px-2 align-top tabular-nums text-[var(--muted)]/60 ${cellPy}`}>{globalIdx}</td>
                        <td className={`px-2 align-top ${cellPy}`}>
                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const fieldIcon = resolveFieldSpecIcon(f);
                              const FieldIcon = fieldIcon.icon;
                              return <FieldIcon size={12} className={`shrink-0 ${fieldIcon.className}`} aria-hidden />;
                            })()}
                            <span className="font-medium">{f.label}</span>
                            {f.pk ? (
                              <span className="rounded bg-amber-500/20 px-1 text-[9px] font-bold text-amber-300">PK</span>
                            ) : null}
                          </div>
                        </td>
                        <td className={`px-2 align-top font-mono text-[10px] text-indigo-300 ${cellPy}`}>{f.col}</td>
                        <td className={`px-2 align-top font-mono text-[10px] ${TYPE_TONE[f.type] ?? ""} ${cellPy}`}>{f.type}</td>
                        <td className={`px-2 align-top ${cellPy}`}>
                          <SchemaModeBadge mode={f.mode} />
                        </td>
                        <td className={`px-2 align-top font-mono text-[10px] text-[var(--muted)] ${cellPy}`}>{f.default ?? "—"}</td>
                        <td className={`px-2 align-top text-[10px] leading-snug text-[var(--muted)]/90 ${cellPy}`}>{f.source ?? "—"}</td>
                        <td className={`px-2 align-top ${cellPy}`}>
                          {f.options ? (
                            <div className="flex flex-wrap gap-0.5">
                              {f.options.slice(0, 3).map((o) => (
                                <SchemaOptionBadge key={o} value={o} />
                              ))}
                              {f.options.length > 3 ? (
                                <span className="rounded bg-indigo-500/15 px-1 text-[9px] text-indigo-300">
                                  +{f.options.length - 3}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[var(--muted)]/40">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
