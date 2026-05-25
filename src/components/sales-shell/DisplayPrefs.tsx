import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Check, Clock, Settings, Sliders } from "lucide-react";
import {
  DEFAULT_HUB_HEADER_STAT_KEYS,
  HUB_HEADER_STAT_DEFS,
} from "../../features/hub/hub-prefs";
import { readSystemTab, type SystemTab } from "../../features/system-hub/components/SystemTabs";
import {
  patchSystemTabDisplay,
  resetSystemTabDisplay,
  readSystemTabDisplay,
} from "../../features/system-hub/system-display-prefs";
import {
  DEFAULT_SYSTEM_HEADER_STAT_KEYS,
  SYSTEM_HEADER_STAT_DEFS,
} from "../../features/system-hub/system-prefs";
import { readAppScreen, type AppScreen } from "../../lib/app-screen";
import { LIMIT_OPTIONS, patchHubListPrefs, readHubListPrefs, TIME_RANGES } from "../../lib/url-prefs";

export type PrefItem = { key: string; label: string };

type Tab = "general" | "display";

export function DisplayPrefs({
  kpis,
  charts,
  filters,
  headerStats: headerStatsProp,
  showRange = true,
  showLimit = true,
  showHeaderPin = true,
  defaultKpiKeys,
  defaultChartKeys,
  defaultFilterKeys,
  defaultHeaderStatKeys,
  menuPlacement = "bottom",
  compact = false,
  sidebarRow = false,
}: {
  kpis?: PrefItem[];
  charts?: PrefItem[];
  filters?: PrefItem[];
  headerStats?: PrefItem[];
  /** Pin tab header (Hub / System) — URL `hpin=0` to disable. */
  showHeaderPin?: boolean;
  showRange?: boolean;
  showLimit?: boolean;
  defaultKpiKeys?: Set<string>;
  defaultChartKeys?: Set<string>;
  defaultFilterKeys?: Set<string>;
  defaultHeaderStatKeys?: Set<string>;
  /** Open menu above trigger (for bottom dock). */
  menuPlacement?: "bottom" | "top";
  /** Icon-only trigger (legacy). */
  compact?: boolean;
  /** Full-width sidebar footer row (icon + label). */
  sidebarRow?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("general");
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const [screen, setScreen] = useState<AppScreen>(() => readAppScreen());
  const [systemTab, setSystemTab] = useState<SystemTab>(() => readSystemTab());
  const [sidebarPanelStyle, setSidebarPanelStyle] = useState<CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncScreen = () => {
      setScreen(readAppScreen());
      setSystemTab(readSystemTab());
    };
    window.addEventListener("popstate", syncScreen);
    window.addEventListener("system-display-change", syncScreen);
    return () => {
      window.removeEventListener("popstate", syncScreen);
      window.removeEventListener("system-display-change", syncScreen);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open || !sidebarRow || !ref.current) return;

    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSidebarPanelStyle({
        position: "fixed",
        left: rect.right + 8,
        bottom: Math.max(8, window.innerHeight - rect.bottom),
        zIndex: 1100,
        maxHeight: "min(70vh, 28rem)",
        width: "18rem",
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, sidebarRow]);

  useEffect(() => {
    const sync = () => setPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const rawKpi = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("kpi") : null;
  const rawCharts = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("charts") : null;
  const rawFilters = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("hfilt") : null;
  const isSystem = screen === "system";
  const rawHeaderStats =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get(isSystem ? "sstat" : "hstat")
      : null;
  const rawHpin = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("hpin") : null;
  const rawSpin = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("spin") : null;
  const rawNavicon = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("navicon") : null;
  const visKpi = prefs.kpi;
  const visCharts = prefs.charts;
  const systemDisplay = isSystem ? readSystemTabDisplay(systemTab) : null;
  const visKpiEffective = isSystem ? systemDisplay?.kpi ?? null : visKpi;
  const visChartsEffective = isSystem ? systemDisplay?.charts ?? null : visCharts;
  const visHubFilters = prefs.hubFilters;
  const headerStats =
    headerStatsProp ?? (isSystem ? SYSTEM_HEADER_STAT_DEFS : HUB_HEADER_STAT_DEFS);
  const headerStatDefaults =
    defaultHeaderStatKeys ?? (isSystem ? DEFAULT_SYSTEM_HEADER_STAT_KEYS : DEFAULT_HUB_HEADER_STAT_KEYS);
  const visHeaderStats = isSystem ? prefs.systemHeaderStats : prefs.headerStats;
  const headerStatParam = isSystem ? "sstat" : "hstat";

  function update(patch: Record<string, string | null>) {
    patchHubListPrefs(patch);
    setPrefs(readHubListPrefs());
  }

  function defaultsFor(allItems: PrefItem[], defaults?: Set<string>) {
    return defaults ?? new Set(allItems.map((i) => i.key));
  }

  function toggle(
    param: "kpi" | "charts" | "hfilt" | "hstat" | "sstat",
    allItems: PrefItem[],
    defaults: Set<string>,
    key: string,
  ) {
    const cur =
      param === "kpi"
        ? visKpiEffective
        : param === "charts"
          ? visChartsEffective
          : param === "hstat" || param === "sstat"
            ? visHeaderStats
            : visHubFilters;
    let next: Set<string>;
    if (cur === null) {
      next = new Set(defaults);
      if (next.has(key)) next.delete(key);
      else next.add(key);
    } else {
      next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
    }
    const allDefault = next.size === defaults.size && [...next].every((k) => defaults.has(k));
    if (isSystem && (param === "kpi" || param === "charts")) {
      patchSystemTabDisplay(systemTab, {
        [param]: allDefault ? null : [...next],
      });
      return;
    }
    if (allDefault) {
      update({ [param]: null });
    } else {
      update({ [param]: [...next].join(",") });
    }
  }

  function isVisible(set: Set<string> | null, defaults: Set<string>, key: string) {
    return set === null ? defaults.has(key) : set.has(key);
  }

  const kpiDefaults = defaultsFor(kpis ?? [], defaultKpiKeys);
  const chartsDefaults = defaultsFor(charts ?? [], defaultChartKeys);
  const filterDefaults = defaultsFor(filters ?? [], defaultFilterKeys);
  const visKpiCount = visKpiEffective === null ? kpiDefaults.size : visKpiEffective.size;
  const visChartsCount = visChartsEffective === null ? chartsDefaults.size : visChartsEffective.size;
  const visFilterCount = visHubFilters === null ? filterDefaults.size : visHubFilters.size;
  const visHeaderStatCount = visHeaderStats === null ? headerStatDefaults.size : visHeaderStats.size;
  const headerStatLabel = isSystem ? "System header" : "Hub header";

  const activeCount =
    (showRange && prefs.range !== "30d" ? 1 : 0) +
    (showLimit && prefs.limit !== 100 ? 1 : 0) +
    (rawKpi !== null ? 1 : 0) +
    (rawCharts !== null ? 1 : 0) +
    (rawFilters !== null ? 1 : 0) +
    (rawHeaderStats !== null ? 1 : 0) +
    (showHeaderPin && rawHpin !== null ? 1 : 0) +
    (!isSystem && rawSpin === "0" ? 1 : 0) +
    (rawNavicon === "0" ? 1 : 0);

  const triggerClass = sidebarRow
    ? "relative flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--text)]"
    : compact
      ? "btn btn-ghost relative px-2.5"
      : "btn btn-ghost";

  const panelShellClass =
    "overflow-y-auto rounded-xl border border-white/10 bg-[var(--bg)] p-3 shadow-2xl shadow-black/40";
  const anchoredPanelClass =
    menuPlacement === "top"
      ? `absolute right-0 bottom-full z-50 mb-1.5 max-h-[min(70vh,28rem)] w-72 ${panelShellClass}`
      : `absolute right-0 top-full z-50 mt-1.5 max-h-[min(70vh,28rem)] w-72 ${panelShellClass}`;

  const settingsPanel = open ? (
    <div
      ref={panelRef}
      className={sidebarRow ? panelShellClass : anchoredPanelClass}
      style={sidebarRow ? sidebarPanelStyle : undefined}
    >
          <div className="mb-2.5 flex gap-1 rounded-lg bg-white/[.03] p-0.5">
            <TabButton active={tab === "general"} onClick={() => setTab("general")} icon={<Sliders size={12} />}>
              General
            </TabButton>
            <TabButton active={tab === "display"} onClick={() => setTab("display")} icon={<BarChart3 size={12} />}>
              Display
            </TabButton>
          </div>

          {tab === "general" ? (
            <>
              {showRange ? (
                <Section icon={<Clock size={11} />} label="Time range">
                  <div className="grid grid-cols-3 gap-1">
                    {TIME_RANGES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => update({ range: r.value === "30d" ? null : r.value })}
                        className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                          prefs.range === r.value
                            ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40"
                            : "bg-white/[.03] text-[var(--muted)] hover:bg-white/[.06] hover:text-[var(--text)]"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </Section>
              ) : null}

              {showLimit ? (
                <Section label="Rows">
                  <div className="grid grid-cols-5 gap-1">
                    {LIMIT_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => update({ limit: n === 100 ? null : String(n) })}
                        className={`rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition-colors ${
                          prefs.limit === n
                            ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40"
                            : "bg-white/[.03] text-[var(--muted)] hover:bg-white/[.06] hover:text-[var(--text)]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </Section>
              ) : null}

              {showHeaderPin ? (
                <Section label="Header">
                  <ToggleRow
                    label="Pin header (sticky)"
                    on={prefs.headerPin}
                    onChange={() => update({ hpin: prefs.headerPin ? "0" : null })}
                  />
                  <ToggleRow
                    label="Pin search bar (sticky)"
                    on={prefs.searchPin}
                    onChange={() => update({ spin: prefs.searchPin ? "0" : null })}
                  />
                  <ToggleRow
                    label="Show submenu +/- icon"
                    on={prefs.navToggleIcon}
                    onChange={() => update({ navicon: prefs.navToggleIcon ? "0" : null })}
                  />
                </Section>
              ) : null}
            </>
          ) : null}

          {tab === "display" ? (
            <>
              {kpis && kpis.length > 0 ? (
                <Section label={`KPI (${visKpiCount}/${kpis.length})`}>
                  <div className="space-y-0.5">
                    {kpis.map((k) => (
                      <ToggleRow
                        key={k.key}
                        label={k.label}
                        on={isVisible(visKpiEffective, kpiDefaults, k.key)}
                        onChange={() => toggle("kpi", kpis, kpiDefaults, k.key)}
                      />
                    ))}
                  </div>
                </Section>
              ) : null}

              {charts && charts.length > 0 ? (
                <Section label={`Charts (${visChartsCount}/${charts.length})`}>
                  <div className="space-y-0.5">
                    {charts.map((c) => (
                      <ToggleRow
                        key={c.key}
                        label={c.label}
                        on={isVisible(visChartsEffective, chartsDefaults, c.key)}
                        onChange={() => toggle("charts", charts, chartsDefaults, c.key)}
                      />
                    ))}
                  </div>
                </Section>
              ) : null}

              {filters && filters.length > 0 ? (
                <Section label={`Filters (${visFilterCount}/${filters.length})`}>
                  <div className="space-y-0.5">
                    {filters.map((f) => (
                      <ToggleRow
                        key={f.key}
                        label={f.label}
                        on={isVisible(visHubFilters, filterDefaults, f.key)}
                        onChange={() => toggle("hfilt", filters, filterDefaults, f.key)}
                      />
                    ))}
                  </div>
                </Section>
              ) : null}

              {headerStats.length > 0 ? (
                <Section label={`${headerStatLabel} (${visHeaderStatCount}/${headerStats.length})`}>
                  <div className="space-y-0.5">
                    {headerStats.map((h) => (
                      <ToggleRow
                        key={h.key}
                        label={h.label}
                        on={isVisible(visHeaderStats, headerStatDefaults, h.key)}
                        onChange={() =>
                          toggle(
                            headerStatParam as "hstat" | "sstat",
                            headerStats,
                            headerStatDefaults,
                            h.key,
                          )
                        }
                      />
                    ))}
                  </div>
                </Section>
              ) : null}
            </>
          ) : null}

          <button
            type="button"
            onClick={() => {
              if (isSystem) resetSystemTabDisplay();
              update({
                range: null,
                limit: null,
                kpi: null,
                charts: null,
                hfilt: null,
                hstat: null,
                sstat: null,
                hpin: null,
                spin: null,
                navicon: null,
              });
            }}
            className="mt-2 w-full rounded-md border border-white/10 px-2 py-1.5 text-[10px] text-[var(--muted)] hover:bg-white/[.05] hover:text-[var(--text)]"
          >
            Reset to defaults
          </button>
    </div>
  ) : null;

  return (
    <div ref={ref} className={sidebarRow ? "relative w-full" : "relative"}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={triggerClass} title="Display settings">
        <Settings size={sidebarRow ? 15 : 14} className={sidebarRow ? "shrink-0 text-amber-400/95" : undefined} />
        {sidebarRow || !compact ? <span className={sidebarRow ? "flex-1 text-left" : "hidden sm:inline"}>Settings</span> : null}
        {activeCount > 0 ? (
          <span
            className={
              compact && !sidebarRow
                ? "absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-indigo-500 px-0.5 text-[9px] font-bold text-white"
                : sidebarRow
                  ? "ml-auto shrink-0 rounded-full bg-indigo-500/30 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-indigo-200"
                  : "rounded-full bg-indigo-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-200"
            }
          >
            {activeCount}
          </span>
        ) : null}
      </button>

      {sidebarRow && settingsPanel
        ? createPortal(settingsPanel, document.body)
        : settingsPanel}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
        active
          ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/30"
          : "text-[var(--muted)] hover:bg-white/[.04] hover:text-[var(--text)]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Section({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors hover:bg-white/[.05]"
    >
      <span
        className={`grid h-4 w-4 place-items-center rounded border ${on ? "border-indigo-400 bg-indigo-500/30" : "border-white/15 bg-white/[.03]"}`}
      >
        {on ? <Check size={10} className="text-indigo-200" /> : null}
      </span>
      <span className={on ? "text-[var(--text)]" : "text-[var(--muted)]"}>{label}</span>
    </button>
  );
}
