import type { FilterDef, FilterValues } from "../../components/sales-shell";
import { enrichFilterDefs } from "../../lib/filter-option-counts";
import type { HostingDeployRow } from "./hosting-quota-types";

function norm(v: string | null | undefined) {
  return (v ?? "").trim() || "—";
}

export function matchesHostingRow(row: HostingDeployRow, query: string, filters: FilterValues): boolean {
  const q = query.trim().toLowerCase();
  const providerPick = filters.provider;
  const hostPick = filters.host;
  const toolPick = filters.tool;
  const healthPick = filters.health?.[0] as "ok" | "drift" | "gap" | "error" | undefined;

  if (providerPick?.length && !providerPick.includes(row.provider)) return false;
  if (hostPick?.length && !hostPick.includes(norm(row.hostSlug))) return false;
  if (toolPick?.length && !toolPick.some((t) => row.toolCodes.includes(t))) return false;

  if (healthPick === "ok" && (row.driftCount > 0 || row.error || row.linkGap)) return false;
  if (healthPick === "drift" && row.driftCount === 0) return false;
  if (healthPick === "gap" && !row.linkGap) return false;
  if (healthPick === "error" && !row.error) return false;

  if (!q) return true;
  const hay = [
    row.name,
    row.ref,
    row.hostSlug,
    row.providerLabel,
    row.region,
    row.plan,
    row.publicUrl,
    ...row.toolCodes,
    row.healthLabel,
    row.status,
    row.note,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function hostingFiltersWithCounts(
  rows: HostingDeployRow[],
  filtersBase: FilterDef[],
  query: string,
  filterValues: FilterValues,
): FilterDef[] {
  return enrichFilterDefs(
    rows,
    filtersBase,
    query,
    filterValues,
    matchesHostingRow,
    (row, key, optionValue) => {
      const fv: FilterValues = { ...filterValues, [key]: [optionValue] };
      return matchesHostingRow(row, query, fv);
    },
  );
}
