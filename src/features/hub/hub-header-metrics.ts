import { AlertTriangle, CheckCircle2, Link2, Rocket } from "lucide-react";
import type { TabHeaderStatItem } from "../../components/sales-shell/AppTabHeader";
import { HUB_HEADER_STAT_DEFS, type HubHeaderStatKey } from "./hub-prefs";
import type { HubHeaderKpi } from "./HubStickyHeader";

const STAT_DEFS: Record<
  HubHeaderStatKey,
  { icon: typeof CheckCircle2; label: string; toneClass: string; pick: (k: HubHeaderKpi) => number }
> = {
  ready: { icon: CheckCircle2, label: "Ready", toneClass: "text-emerald-400", pick: (k) => k.ready },
  releases: { icon: Rocket, label: "Releases", toneClass: "text-amber-400", pick: (k) => k.releases },
  drift: { icon: AlertTriangle, label: "Drift", toneClass: "text-rose-400", pick: (k) => k.drift },
  link_gaps: { icon: Link2, label: "Link gaps", toneClass: "text-indigo-400", pick: (k) => k.linkGaps },
};

export function buildHubHeaderStats(visibleKeys: Set<string>, kpi: HubHeaderKpi): TabHeaderStatItem[] {
  return HUB_HEADER_STAT_DEFS.filter((h) => visibleKeys.has(h.key))
    .map((h) => {
      const def = STAT_DEFS[h.key as HubHeaderStatKey];
      return {
        key: h.key,
        icon: def.icon,
        label: def.label,
        value: def.pick(kpi),
        toneClass: def.toneClass,
      };
    });
}
