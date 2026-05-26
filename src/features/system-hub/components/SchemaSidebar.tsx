import { Box, Database, Layers } from "lucide-react";
import type { HubEntity } from "../../../lib/hub-schema-spec";
import { compactIconSize } from "../../../lib/ui-scale";

const ENTITY_META: Record<HubEntity, { label: string; icon: typeof Database; tone: string }> = {
  catalog: { label: "catalog", icon: Database, tone: "text-indigo-300" },
  manifest: { label: "manifest", icon: Box, tone: "text-emerald-300" },
  runtime: { label: "runtime", icon: Layers, tone: "text-purple-300" },
};

export function SchemaSidebar({
  counts,
  current,
  onSelect,
  pending,
}: {
  counts: { entity: HubEntity; fields: number; overrides: number }[];
  current: HubEntity;
  onSelect: (entity: HubEntity) => void;
  pending?: boolean;
}) {
  return (
    <aside className="space-y-2">
      <div className="px-1 pb-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
        Tables {pending ? <span className="ml-1 animate-pulse text-indigo-300">·</span> : null}
      </div>
      {counts.map(({ entity, fields, overrides }) => {
        const meta = ENTITY_META[entity];
        const Icon = meta.icon;
        const active = current === entity;
        return (
          <button
            key={entity}
            type="button"
            onClick={() => onSelect(entity)}
            className={`group block w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
              active
                ? "border-indigo-500/40 bg-indigo-500/10"
                : "border-white/5 bg-[var(--panel)] hover:border-white/10 hover:bg-white/[.04]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon size={compactIconSize(14)} className={active ? "text-indigo-300" : meta.tone} />
              <span className={`font-mono text-[13px] ${active ? "text-indigo-200" : "text-[var(--text)]"}`}>
                {meta.label}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px]">
              <span className="rounded-full bg-white/[.04] px-1.5 py-0.5 text-[var(--muted)]">{fields} fields</span>
              {overrides > 0 ? (
                <span className="rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-indigo-300">
                  {overrides} override{overrides === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </aside>
  );
}
