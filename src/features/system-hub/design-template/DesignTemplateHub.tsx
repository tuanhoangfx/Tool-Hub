import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lock, Palette } from "lucide-react";
import { MiniDonut, type FilterDef, type FilterValues } from "../../../components/sales-shell";
import { readHubListPrefs } from "../../../lib/url-prefs";
import { DEFAULT_HUB_CHART_KEYS } from "../../hub/hub-prefs";
import { filterTemplates, templateCharts, templateKpis } from "../system-hub-aggregates";
import { SystemHubShell } from "../SystemHubShell";
import { LOCKED_UI_DECISIONS } from "./locked-decisions";
import { DESIGN_TEMPLATES, readDesignTemplateId, setDesignTemplateId } from "./templates";
import { ToolVersionsPreviewHub } from "./tool-versions/ToolVersionsPreviewHub";
import "./design-template.css";

function LockedTemplateNotice({ label, choice }: { label: string; choice?: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-[12px] text-emerald-200/90">
      <div className="flex items-center gap-2">
        <Lock size={14} aria-hidden />
        <strong>{label}</strong> is locked in production.
      </div>
      {choice ? <p className="mt-1 text-[11px]">Choice: {choice}</p> : null}
      <p className="mt-1 text-[10px] text-[var(--muted)]">Edit the production path listed under Locked decisions below.</p>
    </div>
  );
}

function visibleChartKeys(set: Set<string> | null) {
  return set ?? DEFAULT_HUB_CHART_KEYS;
}

export function DesignTemplateHub() {
  const [templateId, setTemplateId] = useState(() => readDesignTemplateId());
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [prefs, setPrefs] = useState(readHubListPrefs);

  useEffect(() => {
    const onPop = () => {
      setTemplateId(readDesignTemplateId());
      setPrefs(readHubListPrefs());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const filteredTemplates = useMemo(() => {
    let list = filterTemplates(DESIGN_TEMPLATES, query);
    const status = filterValues.status;
    if (status?.length) {
      list = list.filter((t) => status.includes(t.status));
    }
    return list;
  }, [query, filterValues.status]);

  const kpis = useMemo(() => templateKpis(DESIGN_TEMPLATES), []);
  const charts = useMemo(() => templateCharts(DESIGN_TEMPLATES), []);

  const activeTemplate = DESIGN_TEMPLATES.find((t) => t.id === templateId) ?? DESIGN_TEMPLATES[0];
  const visCharts = visibleChartKeys(prefs.charts);

  const statusFilters = useMemo((): FilterDef[] => {
    return [
      {
        key: "status",
        label: "Status",
        options: [
          { value: "locked", label: "Locked" },
          { value: "preview", label: "Preview" },
        ],
        showAllLabel: true,
      },
    ];
  }, []);

  const kpiItems = useMemo(
    () => [
      { prefKey: "total", label: "Templates", value: kpis.total, icon: Palette, tone: "indigo" as const },
      { prefKey: "ready", label: "Locked", value: kpis.locked, icon: Lock, tone: "emerald" as const },
      { prefKey: "releases", label: "In preview", value: kpis.preview, icon: CheckCircle2, tone: "amber" as const },
    ],
    [kpis],
  );

  return (
    <SystemHubShell
      placeholder="Search template name, feature, status…"
      filters={statusFilters}
      query={query}
      onQueryChange={setQuery}
      values={filterValues}
      onValuesChange={setFilterValues}
      kpiItems={kpiItems}
      charts={visCharts.has("status_donut") ? <MiniDonut title="Template status" items={charts.status} /> : null}
    >
      <div className="design-template-hub space-y-4">
        <div className="dt-template-grid">
          {filteredTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`dt-template-card ${templateId === t.id ? "active" : ""}`}
              onClick={() => {
                setDesignTemplateId(t.id);
                setTemplateId(t.id);
              }}
            >
              <div className="dt-template-card-head">
                <span className="dt-template-label">{t.label}</span>
                <span className={`dt-status ${t.status === "locked" ? "dt-status--locked" : "dt-status--preview"}`}>
                  {t.status}
                </span>
              </div>
              <p className="dt-template-feature">{t.blurb}</p>
              {t.lockedChoice ? (
                <p className="dt-template-meta">
                  <CheckCircle2 size={10} className="inline" /> {t.lockedChoice}
                </p>
              ) : null}
            </button>
          ))}
        </div>

        {activeTemplate.status === "locked" ? (
          <LockedTemplateNotice label={activeTemplate.label} choice={activeTemplate.lockedChoice} />
        ) : activeTemplate.id === "tool-versions" ? (
          <ToolVersionsPreviewHub />
        ) : null}

        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Locked in production</h3>
          <ul className="space-y-2">
            {LOCKED_UI_DECISIONS.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-white/5 bg-[var(--panel)] px-4 py-3 transition-colors hover:border-white/10"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text)]">{row.label}</span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
                    <Lock size={10} aria-hidden />
                    locked
                  </span>
                  <span className="text-[11px] text-indigo-200/90">{row.choice}</span>
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-cyan-300/90">{row.production}</p>
                {row.doc ? <p className="mt-0.5 text-[10px] text-[var(--muted)]">{row.doc}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SystemHubShell>
  );
}
