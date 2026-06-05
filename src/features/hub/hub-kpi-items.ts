import type { KpiTileData } from "../../components/sales-shell";
import { resolveHubKpiIcon } from "../../lib/badge-registry";
import type { hubKpis } from "./hub-aggregates";

type HubKpiNumbers = ReturnType<typeof hubKpis>;

const HUB_KPI_TILES: Array<{
  key: string;
  label: string;
  tone: KpiTileData["tone"];
  pick: (k: HubKpiNumbers) => number;
}> = [
  { key: "total", label: "Tools (shown)", tone: "indigo", pick: (k) => k.total },
  { key: "ready", label: "Ready", tone: "emerald", pick: (k) => k.ready },
  { key: "releases", label: "With release", tone: "amber", pick: (k) => k.releases },
  { key: "drift", label: "Drift alerts", tone: "rose", pick: (k) => k.drift },
  { key: "local_only", label: "Local only", tone: "purple", pick: (k) => k.localOnly },
  { key: "link_gaps", label: "Link gaps", tone: "rose", pick: (k) => k.linkGaps },
  { key: "draft", label: "Draft", tone: "amber", pick: (k) => k.draft },
  { key: "hosted", label: "Hosted (VPS/Vercel)", tone: "indigo", pick: (k) => k.hosted },
];

/** All Hub KPI tiles (System Overview + Library); filter with `visKpi` / Display prefs. */
export function buildHubKpiItems(kpis: HubKpiNumbers): KpiTileData[] {
  const items: KpiTileData[] = [];
  for (const row of HUB_KPI_TILES) {
    const meta = resolveHubKpiIcon(row.key);
    if (!meta) continue;
    items.push({
      prefKey: row.key,
      label: row.label,
      value: row.pick(kpis),
      icon: meta.icon,
      tone: row.tone,
    });
  }
  return items;
}
