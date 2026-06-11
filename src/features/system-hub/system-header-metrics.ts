import {
  AlertTriangle,
  BookOpen,
  Bot,
  CheckCircle2,
  Database,
  Gauge,
  LayoutGrid,
  Link2,
  Rocket,
  ScrollText,
} from "lucide-react";
import { semanticHeaderStat, type TabHeaderStatItem } from "@tool-workspace/hub-ui";
import type { PrefItem } from "../../components/sales-shell/DisplayPrefs";
import { agentManifestCache } from "../../lib/agent-manifest-cache";
import { groupsForEntity, specForEntity } from "../../lib/hub-schema-spec";
import { readSchemaEntity } from "./components/SystemTabs";
import type { HubEntity } from "../../lib/hub-schema-spec";

const SCHEMA_ENTITIES: HubEntity[] = ["catalog", "manifest", "runtime"];
import type { ResolvedTool } from "../../types";
import { hubKpis } from "../hub/hub-aggregates";
import { buildHubHeaderStats, type HubHeaderKpi } from "../hub/hub-header-metrics";
import { HUB_HEADER_STAT_DEFS, type HubHeaderStatKey } from "../hub/hub-prefs";
import { agentContextKpis } from "./agent-context/agent-context-aggregates";
import { readSupabaseQuotaStaleCache } from "./supabase-quota-client-cache";
import { resolveProjectMetricsSource } from "./supabase-project-metrics-source";
import type { SystemTab } from "./components/SystemTabs";
import { schemaKpis } from "./system-hub-aggregates";
import { buildHostingDeployRows, hostingRowsForQuotaTab } from "./hosting-quota-build";

export type SystemHeaderStatKey =
  | HubHeaderStatKey
  | "fields"
  | "groups"
  | "entities"
  | "projects"
  | "live_metrics"
  | "quota_errors"
  | "rules"
  | "skills"
  | "always"
  | "catalog_skills"
  | "catalog_ready"
  | "catalog_triggers"
  | "templates"
  | "locked"
  | "preview";

export function systemHeaderStatDefs(tab: SystemTab): PrefItem[] {
  switch (tab) {
    case "overview":
      return HUB_HEADER_STAT_DEFS;
    case "server":
      return [
        { key: "projects", label: "Deployments" },
        { key: "live_metrics", label: "Live URL" },
        { key: "quota_errors", label: "Drift" },
      ];
    case "schema":
      return [
        { key: "fields", label: "Fields" },
        { key: "groups", label: "Groups" },
        { key: "entities", label: "Entities" },
      ];
    case "supabase-quota":
      return [
        { key: "projects", label: "Projects" },
        { key: "live_metrics", label: "Live metrics" },
        { key: "quota_errors", label: "Errors" },
      ];
    case "agent":
      return [
        { key: "rules", label: "Rules" },
        { key: "skills", label: "Skills" },
        { key: "always", label: "Always on" },
      ];
    case "skills":
      return [
        { key: "catalog_skills", label: "Catalog skills" },
        { key: "catalog_ready", label: "Ready" },
        { key: "catalog_triggers", label: "With triggers" },
      ];
    case "template":
      return [
        { key: "templates", label: "Templates" },
        { key: "locked", label: "Locked" },
        { key: "preview", label: "In preview" },
      ];
    default:
      return HUB_HEADER_STAT_DEFS;
  }
}

export function defaultSystemHeaderStatKeys(tab: SystemTab): Set<string> {
  switch (tab) {
    case "schema":
      return new Set(["fields", "entities"]);
    case "server":
    case "supabase-quota":
      return new Set(["projects", "live_metrics"]);
    case "agent":
      return new Set(["rules", "skills"]);
    case "skills":
      return new Set(["catalog_skills", "catalog_ready"]);
    case "template":
      return new Set(["templates", "locked"]);
    default:
      return new Set(["ready", "releases"]);
  }
}

function hubKpiFromTools(tools: ResolvedTool[]): HubHeaderKpi {
  const k = hubKpis(tools);
  return { ready: k.ready, drift: k.drift, releases: k.releases, linkGaps: k.linkGaps };
}

export function buildSystemHeaderStats(
  tab: SystemTab,
  tools: ResolvedTool[],
  visibleKeys: Set<string>,
): TabHeaderStatItem[] {
  if (tab === "overview") {
    return buildHubHeaderStats(visibleKeys, hubKpiFromTools(tools));
  }

  if (tab === "server") {
    const rows = hostingRowsForQuotaTab(buildHostingDeployRows(tools));
    const withUrl = rows.filter((r) => Boolean(r.publicUrl)).length;
    const drift = rows.filter((r) => r.driftCount > 0).length;
    const defs = [
      { key: "projects" as const, icon: Gauge, label: "deployments", toneClass: "text-indigo-300", value: rows.length },
      { key: "live_metrics" as const, icon: CheckCircle2, label: "live URL", toneClass: "text-emerald-300", value: withUrl },
      { key: "quota_errors" as const, icon: AlertTriangle, label: "drift", toneClass: "text-rose-300", value: drift },
    ];
    return defs
      .filter((d) => visibleKeys.has(d.key))
      .map((d) => ({ key: d.key, icon: d.icon, label: d.label, value: d.value, toneClass: d.toneClass }));
  }

  if (tab === "schema") {
    const entity = readSchemaEntity();
    const spec = specForEntity(entity);
    const kpis = schemaKpis(spec, groupsForEntity(entity).length);
    const defs: Array<{
      key: SystemHeaderStatKey;
      icon: typeof Database;
      label: string;
      toneClass: string;
      value: number;
    }> = [
      { key: "fields", icon: Database, label: "fields", toneClass: "text-indigo-300", value: kpis.fields },
      { key: "groups", icon: Database, label: "groups", toneClass: "text-emerald-300", value: kpis.groups },
      {
        key: "entities",
        icon: LayoutGrid,
        label: "entities",
        toneClass: "text-violet-300",
        value: SCHEMA_ENTITIES.length,
      },
    ];
    return defs
      .filter((d) => visibleKeys.has(d.key))
      .map((d) => ({ key: d.key, icon: d.icon, label: d.label, value: d.value, toneClass: d.toneClass }));
  }

  if (tab === "supabase-quota") {
    const payload = readSupabaseQuotaStaleCache();
    const projects = payload?.projects ?? [];
    const withMetrics = projects.filter((p) => resolveProjectMetricsSource(p) === "live").length;
    const errors = projects.filter((p) => Boolean(p.error)).length;
    const defs = [
      { key: "projects" as const, icon: Gauge, label: "projects", toneClass: "text-indigo-300", value: projects.length },
      {
        key: "live_metrics" as const,
        icon: CheckCircle2,
        label: "live",
        toneClass: "text-emerald-300",
        value: withMetrics,
      },
      { key: "quota_errors" as const, icon: AlertTriangle, label: "errors", toneClass: "text-rose-300", value: errors },
    ];
    return defs
      .filter((d) => visibleKeys.has(d.key))
      .map((d) => ({ key: d.key, icon: d.icon, label: d.label, value: d.value, toneClass: d.toneClass }));
  }

  if (tab === "agent") {
    const items = agentManifestCache.readStale()?.items ?? [];
    const kpis = agentContextKpis(items);
    const defs = [
      { key: "rules" as const, ...semanticHeaderStat("kpi.agent.rules"), label: "rules", value: kpis.rules },
      { key: "skills" as const, ...semanticHeaderStat("kpi.agent.skills"), label: "skills", value: kpis.skills },
      { key: "always" as const, ...semanticHeaderStat("kpi.agent.always"), label: "always", value: kpis.always },
    ];
    return defs
      .filter((d) => visibleKeys.has(d.key))
      .map((d) => ({ key: d.key, icon: d.icon, label: d.label, value: d.value, toneClass: d.toneClass }));
  }

  if (tab === "skills") {
    const items = agentManifestCache.readStale()?.items ?? [];
    const catalog = items.filter((i) => i.tags?.includes("catalog-skill"));
    const defs = [
      {
        key: "catalog_skills" as const,
        ...semanticHeaderStat("kpi.agent.skills"),
        label: "catalog",
        value: catalog.length,
      },
      {
        key: "catalog_ready" as const,
        ...semanticHeaderStat("template.published"),
        label: "ready",
        value: catalog.filter((i) => i.tags?.includes("ready")).length,
      },
      {
        key: "catalog_triggers" as const,
        ...semanticHeaderStat("template.features"),
        label: "triggers",
        value: catalog.filter((i) => Boolean(i.trigger?.trim())).length,
      },
    ];
    return defs
      .filter((d) => visibleKeys.has(d.key))
      .map((d) => ({ key: d.key, icon: d.icon, label: d.label, value: d.value, toneClass: d.toneClass }));
  }

  if (tab === "template") {
    const defs = [
      { key: "templates" as const, ...semanticHeaderStat("template.total"), label: "templates", value: 0 },
      { key: "locked" as const, ...semanticHeaderStat("template.locked"), label: "locked", value: 0 },
      { key: "preview" as const, ...semanticHeaderStat("template.preview"), label: "preview", value: 0 },
    ];
    return defs
      .filter((d) => visibleKeys.has(d.key))
      .map((d) => ({ key: d.key, icon: d.icon, label: d.label, value: d.value, toneClass: d.toneClass }));
  }

  return buildHubHeaderStats(visibleKeys, hubKpiFromTools(tools));
}
