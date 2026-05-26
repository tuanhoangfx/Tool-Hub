export const HUB_COMPACT_SCALE = 0.9;

export function compactIconSize(px: number): number {
  return Math.max(1, Math.round(px * HUB_COMPACT_SCALE));
}
