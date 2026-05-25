import { useMemo, useState } from "react";
import {
  groupsForEntity,
  specForEntity,
  type HubEntity,
} from "../../lib/hub-schema-spec";
import { SchemaGraph } from "./components/SchemaGraph";
import { SchemaSidebar } from "./components/SchemaSidebar";
import { SpecTable } from "./components/SpecTable";

const ENTITIES: HubEntity[] = ["catalog", "manifest", "runtime"];

function readSchemaTable(): HubEntity {
  if (typeof window === "undefined") return "catalog";
  const t = new URLSearchParams(window.location.search).get("table");
  return ENTITIES.includes(t as HubEntity) ? (t as HubEntity) : "catalog";
}

export function SystemSchemaPanel() {
  const [current, setCurrent] = useState<HubEntity>(() => readSchemaTable());

  const counts = useMemo(
    () =>
      ENTITIES.map((entity) => ({
        entity,
        fields: specForEntity(entity).length,
        overrides: 0,
      })),
    [],
  );

  const spec = specForEntity(current);
  const groups = groupsForEntity(current);

  function selectEntity(entity: HubEntity) {
    setCurrent(entity);
    const p = new URLSearchParams(window.location.search);
    p.set("screen", "system");
    p.set("stab", "schema");
    p.set("table", entity);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }

  return (
    <div className="space-y-3 pb-12">
      <SchemaGraph spec={spec} groups={groups} entity={current} overrides={0} customs={0} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
        <SchemaSidebar counts={counts} current={current} onSelect={selectEntity} />

        <section className="rounded-2xl border border-white/5 bg-[var(--panel)] p-4">
          <SpecTable spec={spec} groups={groups} tableName={current} />
        </section>
      </div>
    </div>
  );
}
