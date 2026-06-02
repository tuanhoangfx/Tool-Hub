import type { FilterDef, FilterValues } from "../../components/sales-shell";
import { enrichFilterDefs } from "../../lib/filter-option-counts";
import type { OrgRow, ProjectRow } from "./SystemSupabaseQuotaPanel.types";
import { effectivePlanLabel, parseProjectRestriction } from "./supabase-quota-metrics";

function normLabel(v: string | null | undefined) {
  return (v ?? "").trim() || "—";
}

export function matchesQuotaProject(
  project: ProjectRow,
  query: string,
  filters: FilterValues,
  organizations: OrgRow[],
  getTools?: (project: ProjectRow) => string[],
): boolean {
  const q = query.trim().toLowerCase();
  const orgPick = filters.org;
  const ownerPick = filters.owner;
  const toolPick = filters.tool;
  const regionPick = filters.region;
  const planPick = filters.plan;
  const healthPick = filters.health?.[0] as "ok" | "restricted" | "unhealthy" | "error" | undefined;

  if (orgPick?.length && !orgPick.includes(project.orgSlug)) return false;
  if (ownerPick?.length && !ownerPick.includes(normLabel(project.ownerEmail))) return false;
  if (toolPick?.length) {
    const tools = getTools ? getTools(project) : [];
    if (!toolPick.some((t) => tools.includes(t))) return false;
  }
  if (regionPick?.length && !regionPick.includes(normLabel(project.region))) return false;
  if (
    planPick?.length &&
    !planPick.includes(normLabel(effectivePlanLabel(project, organizations.find((o) => o.slug === project.orgSlug))))
  ) {
    return false;
  }
  const restriction = parseProjectRestriction(project);
  if (healthPick === "ok" && (project.error || restriction.restricted || restriction.overallStatus === "unhealthy")) {
    return false;
  }
  if (healthPick === "restricted" && !restriction.restricted) return false;
  if (
    healthPick === "unhealthy" &&
    (restriction.restricted || project.error || restriction.overallStatus !== "unhealthy")
  ) {
    return false;
  }
  if (healthPick === "error" && !project.error) return false;

  if (!q) return true;
  const hay = [
    project.orgSlug,
    project.projectName,
    project.projectRef,
    project.ownerEmail,
    project.accountId,
    ...(project.tools ?? []),
    project.region,
    project.plan,
    project.orgPlan,
    effectivePlanLabel(project, organizations.find((o) => o.slug === project.orgSlug)),
    project.error,
  ]
    .filter((x) => x != null && x !== "")
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function matchesQuotaOption(
  project: ProjectRow,
  filterKey: string,
  value: string,
  organizations: OrgRow[],
  getTools?: (project: ProjectRow) => string[],
): boolean {
  if (filterKey === "org") return project.orgSlug === value;
  if (filterKey === "owner") return normLabel(project.ownerEmail) === value;
  if (filterKey === "tool") {
    const tools = getTools ? getTools(project) : [];
    return tools.includes(value);
  }
  if (filterKey === "region") return normLabel(project.region) === value;
  if (filterKey === "plan") {
    return normLabel(effectivePlanLabel(project, organizations.find((o) => o.slug === project.orgSlug))) === value;
  }
  if (filterKey === "health") {
    const restriction = parseProjectRestriction(project);
    if (value === "ok") return !project.error && !restriction.restricted && restriction.overallStatus !== "unhealthy";
    if (value === "restricted") return restriction.restricted;
    if (value === "unhealthy") {
      return !restriction.restricted && !project.error && restriction.overallStatus === "unhealthy";
    }
    if (value === "error") return Boolean(project.error);
  }
  return true;
}

export function quotaFiltersWithCounts(
  projects: ProjectRow[],
  organizations: OrgRow[],
  baseDefs: FilterDef[],
  query: string,
  values: FilterValues,
  getTools?: (project: ProjectRow) => string[],
): FilterDef[] {
  return enrichFilterDefs(
    projects,
    baseDefs,
    query,
    values,
    (p, q, f) => matchesQuotaProject(p, q, f, organizations, getTools),
    (p, key, val) => matchesQuotaOption(p, key, val, organizations, getTools),
  );
}
