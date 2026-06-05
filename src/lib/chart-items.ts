import type { FilterIconMeta } from "./badge-registry";
import { CHART_OTHERS_LABEL, resolveChartLegendIcon } from "./badge-registry";

/** Chart row — top N + rolled-up remainder (max 4 rows, no scroll). */
export type ChartRow = {
  label: string;
  value: number;
  color?: string;
  iconMeta?: FilterIconMeta | null;
};

const OTHERS_COLOR = "#64748b";

export function withChartLegendIcon<T extends ChartRow>(row: T): T {
  const iconMeta = resolveChartLegendIcon(row.label);
  const color = row.label === CHART_OTHERS_LABEL ? (row.color ?? OTHERS_COLOR) : row.color;
  return iconMeta ? { ...row, iconMeta, color } : { ...row, color };
}

export function topChartItems<T extends ChartRow>(items: T[], topN = 3, othersLabel = CHART_OTHERS_LABEL): T[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  if (sorted.length <= topN + 1) return sorted.map(withChartLegendIcon);
  const head = sorted.slice(0, topN).map(withChartLegendIcon);
  const rest = sorted.slice(topN);
  const othersValue = rest.reduce((sum, row) => sum + row.value, 0);
  return [...head, withChartLegendIcon({ label: othersLabel, value: othersValue, color: OTHERS_COLOR } as T)];
}

/** Top 3 + Others, then attach canonical legend icons (Hub / System / Users charts). */
export function prepareChartItems<T extends ChartRow>(items: T[]): T[] {
  return topChartItems(items);
}
