import { useCallback, useEffect, useMemo, useState } from "react";
import { Database } from "lucide-react";
import { semanticKpiIcon } from "@tool-workspace/hub-ui";
import {
  groupsForEntity,
  specForEntity,
  type HubEntity,
} from "../../lib/hub-schema-spec";
import { readHubListPrefs } from "../../lib/url-prefs";
import { readSchemaEntity, setSchemaEntity } from "./components/SystemTabs";
import {
  HubResultCount,
  HubTimeRangeSelect,
  MiniBarChart,
  ViewToggle,
  type FilterDef,
  type FilterValues,
  type HubViewMode,
} from "../../components/sales-shell";
import { useSessionState } from "../../hooks";
import { SchemaGraph } from "./components/SchemaGraph";
import { SpecTable } from "./components/SpecTable";
import { SystemHubShell } from "./SystemHubShell";
import { filterSchemaSpec, schemaCharts, schemaKpis } from "./system-hub-aggregates";

function entityFieldCount(entity: HubEntity, query: string) {
  return filterSchemaSpec(specForEntity(entity), query).length;
}

const ENTITIES: HubEntity[] = ["catalog", "manifest", "runtime"];

export function SystemSchemaPanel() {
  const [current, setCurrent] = useState<HubEntity>(() => readSchemaEntity());
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>(() => ({
    entity: [readSchemaEntity()],
  }));
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:schema:viewMode", "table");

  useEffect(() => {
    const sync = () => {
      setPrefs(readHubListPrefs());
      const entity = readSchemaEntity();
      setCurrent(entity);
      setFilterValues((v) => ({ ...v, entity: [entity] }));
    };
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
    setSchemaEntity(entity);
  }, []);

  const entityFilters = useMemo((): FilterDef[] => {
    const options = ENTITIES.map((e) => ({
      value: e,
      label: e,
      count: entityFieldCount(e, query),
    }));
    return [
      {
        key: "entity",
        label: "Table",
        options,
        showAllLabel: false,
        totalCount: options.reduce((sum, o) => sum + (o.count ?? 0), 0),
      },
    ];
  }, [query]);

  const kpiItems = useMemo(
    () => [
      { prefKey: "fields", label: "Fields (shown)", value: kpis.fields, ...semanticKpiIcon("kpi.schema.fields") },
      { prefKey: "groups", label: "Groups", value: kpis.groups, ...semanticKpiIcon("kpi.schema.groups") },
      { prefKey: "input", label: "Input fields", value: kpis.input, ...semanticKpiIcon("kpi.schema.input") },
      { prefKey: "options", label: "With options", value: kpis.options, ...semanticKpiIcon("kpi.schema.options") },
      { prefKey: "pk", label: "Primary keys", value: kpis.pk, ...semanticKpiIcon("kpi.schema.pk") },
      { prefKey: "auto", label: "Auto fields", value: kpis.auto, ...semanticKpiIcon("kpi.schema.auto") },
      { prefKey: "derive", label: "Derived / compute", value: kpis.derive, ...semanticKpiIcon("kpi.schema.derive") },
      { prefKey: "readonly", label: "Read-only", value: kpis.readonly, ...semanticKpiIcon("kpi.schema.readonly") },
    ],
    [kpis],
  );

  const chartSlots = useMemo(
    () => ({
      health_bar: <MiniBarChart title="By mode" items={charts.mode.slice(0, 8)} />,
      category_bar: <MiniBarChart title="By group" items={charts.group.slice(0, 8)} />,
    }),
    [charts],
  );

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
      tabId="schema"
      placeholder="Search Schema by field, column, type, mode, source..."
      filters={entityFilters}
      query={query}
      onQueryChange={setQuery}
      values={filterValues}
      onValuesChange={handleFilterValuesChange}
      toolbar={
        <>
          <HubTimeRangeSelect value={prefs.range} />
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <HubResultCount icon={Database} shown={spec.length} total={fullSpec.length} label="fields" />
        </>
      }
      kpiItems={kpiItems}
      chartSlots={chartSlots}
    >
      <div className="space-y-3">
        {viewMode === "card" ? (
          <SchemaGraph spec={fullSpec} groups={groups} entity={current} overrides={0} customs={0} />
        ) : null}
        <section className={`rounded-2xl border border-white/5 bg-[var(--panel)] ${viewMode === "table" ? "p-3" : "p-4"}`}>
          <SpecTable spec={spec} groups={groups} tableName={current} compact={viewMode === "table"} />
        </section>
      </div>
    </SystemHubShell>
  );
}
