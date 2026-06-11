import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  HubDesignTemplateEmpty,
  HubPaginatedCardGrid,
  hubDirectoryListResetKey,
  semanticKpiIcon,
} from "@tool-workspace/hub-ui";
import type { KpiTileData } from "../../components/sales-shell";
import { readHubListPrefs } from "../../lib/url-prefs";
import { matchesTimeRange } from "../hub/hub-aggregates";
import { SystemHubShell } from "./SystemHubShell";
import { AgentContextCard } from "./agent-context/AgentContextCard";
import { AgentContextDetailModal } from "./agent-context/AgentContextDetailModal";
import type { AgentContextItem } from "./agent-context/types";
import { useAgentManifest } from "./agent-context/useAgentManifest";

function isCatalogSkill(item: AgentContextItem): boolean {
  return item.tags.includes("catalog-skill");
}

/** System → Skills — SSOT rows from ui-patterns.catalog.json → skills[]. */
export function SystemSkillsCatalogPanel() {
  const { items, loading, error, reload } = useAgentManifest();
  const [detail, setDetail] = useState<AgentContextItem | null>(null);
  const [prefs, setPrefs] = useState(readHubListPrefs);

  useEffect(() => {
    const sync = () => setPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const catalogSkills = useMemo(() => items.filter(isCatalogSkill), [items]);

  const filtered = useMemo(
    () => catalogSkills.filter((item) => matchesTimeRange(item.updatedAt, prefs.range)),
    [catalogSkills, prefs.range],
  );

  const listResetKey = useMemo(
    () => hubDirectoryListResetKey("", {}, prefs.range, filtered.length),
    [prefs.range, filtered.length],
  );

  const kpiItems = useMemo<KpiTileData[]>(
    () => [
      {
        prefKey: "total",
        label: "Catalog skills",
        value: filtered.length,
        ...semanticKpiIcon("kpi.agent.skills"),
      },
      {
        prefKey: "ready",
        label: "Ready",
        value: filtered.filter((i) => i.tags.includes("ready")).length,
        ...semanticKpiIcon("template.published"),
      },
      {
        prefKey: "triggers",
        label: "With triggers",
        value: filtered.filter((i) => Boolean(i.trigger?.trim())).length,
        ...semanticKpiIcon("template.features"),
      },
    ],
    [filtered],
  );

  const openDetail = useCallback((item: AgentContextItem) => setDetail(item), []);
  const noopSelect = useCallback(() => {}, []);

  return (
    <>
      <SystemHubShell tabId="skills" showFilter={false} sectionRuleLabel="Skills catalog" kpiItems={kpiItems}>
        {error ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {error}{" "}
            <button type="button" className="underline" onClick={() => void reload()}>
              Retry sync
            </button>
          </div>
        ) : null}
        {loading && filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--muted)]">Loading skills catalog…</p>
        ) : !loading && filtered.length === 0 ? (
          <HubDesignTemplateEmpty
            title="No catalog skills"
            description={
              <>
                Add entries to <code className="text-indigo-300">Tool/schemas/ui-patterns.catalog.json</code> →{" "}
                <code className="text-indigo-300">skills[]</code>, then run{" "}
                <code className="text-indigo-300">pnpm agent:manifest</code>.
              </>
            }
            hint="Registry skills are separate from .cursor/skills files — both appear under Agent → Kind: Skill."
          />
        ) : (
          <HubPaginatedCardGrid items={filtered} resetKey={listResetKey} ariaLabel="Skills catalog">
            {(pageItems) =>
              pageItems.map((item) => (
                <AgentContextCard
                  key={item.id}
                  item={item}
                  selected={false}
                  onToggleSelect={noopSelect}
                  onOpen={openDetail}
                />
              ))
            }
          </HubPaginatedCardGrid>
        )}
      </SystemHubShell>
      <AgentContextDetailModal item={detail} onClose={() => setDetail(null)} />
    </>
  );
}

export const SKILLS_CATALOG_TAB_ICON = Sparkles;
