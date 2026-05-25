import type { BarItem } from "../../components/sales-shell";
import { resolveChartLegendIcon } from "../../lib/badge-registry";
import type { FieldSpec } from "../../lib/hub-schema-spec";
import { hubCharts, hubKpis } from "../hub/hub-aggregates";
import type { DesignTemplateEntry } from "./design-template/templates";
import type { ResolvedTool } from "../../types";

const CHART_COLORS = ["#818cf8", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#f43f5e"];

function breakdown(labels: string[]): BarItem[] {
  const map = new Map<string, number>();
  for (const label of labels) {
    const key = label || "—";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value], i) => ({
      label,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
      iconMeta: resolveChartLegendIcon(label),
    }))
    .sort((a, b) => b.value - a.value);
}

export { hubKpis, hubCharts };

export function schemaKpis(spec: FieldSpec[], groupCount: number) {
  const input = spec.filter((f) => f.mode === "input").length;
  const pk = spec.filter((f) => f.pk).length;
  const withOptions = spec.filter((f) => f.options?.length).length;
  return {
    fields: spec.length,
    groups: groupCount,
    input,
    pk,
    options: withOptions,
  };
}

export function schemaCharts(spec: FieldSpec[]) {
  return {
    mode: breakdown(spec.map((f) => f.mode)),
    group: breakdown(spec.map((f) => f.group)),
  };
}

export function filterSchemaSpec(spec: FieldSpec[], query: string): FieldSpec[] {
  const q = query.trim().toLowerCase();
  if (!q) return spec;
  return spec.filter((f) => {
    const hay = [f.key, f.label, f.col, f.type, f.mode, f.source, f.group, ...(f.options ?? [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function templateKpis(templates: DesignTemplateEntry[]) {
  const locked = templates.filter((t) => t.status === "locked").length;
  const preview = templates.filter((t) => t.status === "preview").length;
  return { total: templates.length, locked, preview };
}

export function templateCharts(templates: DesignTemplateEntry[]) {
  return {
    status: breakdown(templates.map((t) => (t.status === "locked" ? "Locked" : "Preview"))),
  };
}

export function filterTemplates(templates: DesignTemplateEntry[], query: string): DesignTemplateEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return templates;
  return templates.filter((t) => {
    const hay = [t.id, t.label, t.blurb, t.status, t.lockedChoice ?? ""].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

export function filterToolsForSystem(
  tools: ResolvedTool[],
  query: string,
  toolIds: string[] | undefined,
): ResolvedTool[] {
  const q = query.trim().toLowerCase();
  return tools.filter((t) => {
    if (toolIds?.length && !toolIds.includes(t.id)) return false;
    if (!q) return true;
    const hay = [t.name, t.code, t.repo, t.summary, t.category, ...t.tags].join(" ").toLowerCase();
    return hay.includes(q);
  });
}
