import { CheckCircle2, Database, Lock, Palette } from "lucide-react";
import type { TabHeaderStatItem } from "../../components/sales-shell/AppTabHeader";
import { listActiveDesignFeatures } from "./design-template/design-registry";
import { isDesignLocked } from "../../lib/design-template-state";
import type { SystemHeaderStatKey } from "./system-prefs";

const SCHEMA_ENTITY_COUNT = 3;

export type SystemHeaderMetrics = {
  tools: number;
  templates: number;
  locked: number;
  schema: number;
};

export function computeSystemHeaderMetrics(toolCount: number): SystemHeaderMetrics {
  const active = listActiveDesignFeatures();
  const locked = active.filter((f) => isDesignLocked(f.id)).length;
  return {
    tools: toolCount,
    templates: active.length,
    locked,
    schema: SCHEMA_ENTITY_COUNT,
  };
}

const STAT_DEFS: Record<
  SystemHeaderStatKey,
  { icon: typeof CheckCircle2; label: string; toneClass: string; pick: (m: SystemHeaderMetrics) => number }
> = {
  tools: { icon: CheckCircle2, label: "Tools", toneClass: "text-emerald-400", pick: (m) => m.tools },
  templates: { icon: Palette, label: "Templates", toneClass: "text-indigo-400", pick: (m) => m.templates },
  locked: { icon: Lock, label: "Locked", toneClass: "text-amber-400", pick: (m) => m.locked },
  schema: { icon: Database, label: "Schema", toneClass: "text-cyan-400", pick: (m) => m.schema },
};

export function buildSystemHeaderStats(
  visibleKeys: Set<string>,
  metrics: SystemHeaderMetrics,
): TabHeaderStatItem[] {
  return [...visibleKeys]
    .filter((k): k is SystemHeaderStatKey => k in STAT_DEFS)
    .map((key) => {
      const def = STAT_DEFS[key];
      return {
        key,
        icon: def.icon,
        label: def.label,
        value: def.pick(metrics),
        toneClass: def.toneClass,
      };
    });
}
