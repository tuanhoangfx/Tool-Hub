import { useCallback, useEffect, useMemo, useState } from "react";
import { Database } from "lucide-react";
import {
  groupsForEntity,
  specForEntity,
  type HubEntity,
} from "../../lib/hub-schema-spec";
import { readHubListPrefs } from "../../lib/url-prefs";
import { MiniBarChart, type FilterDef, type FilterValues } from "../../components/sales-shell";
import { DEFAULT_HUB_CHART_KEYS } from "../hub/hub-prefs";
import { SchemaGraph } from "./components/SchemaGraph";
import { SpecTable } from "./components/SpecTable";
import { SystemHubShell } from "./SystemHubShell";
import { filterSchemaSpec, schemaCharts, schemaKpis } from "./system-hub-aggregates";

const ENTITIES: HubEntity[] = ["catalog", "manifest", "runtime"];

function readSchemaTable(): HubEntity {
  if (typeof window === "undefined") return "catalog";
  const t = new URLSearchParams(window.location.search).get("table");
  return ENTITIES.includes(t as HubEntity) ? (t as HubEntity) : "catalog";
}

function visibleChartKeys(set: Set<string> | null) {
  return set ?? DEFAULT_HUB_CHART_KEYS;
}

export function SystemSchemaPanel() {
  const [current, setCurrent] = useState<HubEntity>(() => readSchemaTable());
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>(() => ({
    entity: [readSchemaTable()],
  }));
  const [prefs, setPrefs] = useState(readHubListPrefs);

  useEffect(() => {
    const sync = () => setPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const fullSpec = useMemo(() => specForEntity(current), [current]);
  const groups = useMemo(() => groupsForEntity(current), [current]);
  const spec = useMemo(() => filterSchemaSpec(fullSpec, query), [fullSpec, query]);
  const kpis = useMemo(() => schemaKpis(fullSpec, groups.length), [fullSpec, groups.length]);
  const charts = useMemo(() => schemaCharts(fullSpec), [fullSpec]);

  const selectEntity = useCallback((entity: HubEntity) => {
    setCurrent(entity);
    setFilterValues((v) => ({ ...v, entity: [entity] }));
    const p = new URLSearchParams(window.location.search);
    p.set("screen", "system");
    p.set("stab", "schema");
    p.set("table", entity);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, []);

  const entityFilters = useMemo((): FilterDef[] => {
    return [
      {
        key: "entity",
        label: "Table",
        options: ENTITIES.map((e) => ({ value: e, label: e })),
        showAllLabel: false,
      },
    ];
  }, []);

  const kpiItems = useMemo(
    () => [
      { prefKey: "total", label: "Fields", value: kpis.fields, icon: Database, tone: "indigo" as const },
      { prefKey: "ready", label: "Groups", value: kpis.groups, icon: Database, tone: "emerald" as const },
      { prefKey: "releases", label: "Input fields", value: kpis.input, icon: Database, tone: "amber" as const },
      { prefKey: "drift", label: "With options", value: kpis.options, icon: Database, tone: "purple" as const },
    ],
    [kpis],
  );

  const visCharts = visibleChartKeys(prefs.charts);
  const handleFilterValuesChange = useCallback(
    (next: FilterValues) => {
      const entity = next.entity?.[0] as HubEntity | undefined;
      if (entity && ENTITIES.includes(entity)) {
        selectEntity(entity);
        return;
      }
      setFilterValues(next);
    },
    [selectEntity],
  );

  return (
    <SystemHubShell
      placeholder="Search field, column, type, mode, source…"
      filters={entityFilters}
      query={query}
      onQueryChange={setQuery}
      values={filterValues}
      onValuesChange={handleFilterValuesChange}
      kpiItems={kpiItems}
      charts={
        <>
          {visCharts.has("health_bar") ? <MiniBarChart title="By mode" items={charts.mode.slice(0, 8)} /> : null}
          {visCharts.has("category_bar") ? <MiniBarChart title="By group" items={charts.group.slice(0, 8)} /> : null}
        </>
      }
    >
      <div className="space-y-3 pb-8">
        <SchemaGraph spec={fullSpec} groups={groups} entity={current} overrides={0} customs={0} compact />

        <section className="rounded-2xl border border-white/5 bg-[var(--panel)] p-3">
          <SpecTable spec={spec} groups={groups} tableName={current} compact />
        </section>
      </div>
    </SystemHubShell>
  );
}
