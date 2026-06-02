import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  Clock,
  Columns3,
  Filter,
  Gauge,
  LayoutDashboard,
  PanelTop,
  Rows3,
  Settings,
  Sliders,
} from "lucide-react";
import { LIMIT_OPTIONS, TIME_RANGES } from "./constants";
import { Section, SectionIcon, TabButton, ToggleRow } from "./primitives";
import type { HubDisplayPrefsProps, PrefItem } from "./types";
import { compactIconSize } from "../ui-scale";

type BuiltinTab = "general" | "display" | "table";

function parseSet(raw: string | null): Set<string> | null {
  if (raw === null) return null;
  return new Set(raw.split(",").filter(Boolean));
}

function searchParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function HubDisplayPrefs({
  kpis,
  charts,
  filters,
  headerStats: headerStatsProp = [],
  showHeaderPin = true,
  showRange = true,
  showLimit = true,
  showNavToggle = true,
  hideSearchPinOnSystem = false,
  defaultKpiKeys,
  defaultChartKeys,
  defaultFilterKeys,
  defaultHeaderStatKeys,
  menuPlacement = "bottom",
  compact = false,
  sidebarRow = false,
  scope = "tab",
  filterParam = "hfilt",
  filtersFromUrl = false,
  readPrefs,
  patchPrefs,
  getScreen,
  getSystemTab,
  systemDisplay,
  generalExtras,
  tablePanel,
  tableActiveCount = 0,
  headerStatLabel = (isSystem) => (isSystem ? "System header" : "Hub header"),
  onLog,
  mainSelector = ".hub-main",
  title = "Settings",
  panelWidth = 420,
  maxPanelHeight = "min(80vh, 42rem)",
  extraTabs = [],
}: HubDisplayPrefsProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<string>("general");
  const [prefs, setPrefs] = useState(readPrefs);
  const [screen, setScreen] = useState(getScreen);
  const [systemTab, setSystemTab] = useState(() => getSystemTab?.() ?? "");
  const [sidebarPanelStyle, setSidebarPanelStyle] = useState<CSSProperties>({});
  const [headerPanelStyle, setHeaderPanelStyle] = useState<CSSProperties>({});
  const [resolvedPanelWidth, setResolvedPanelWidth] = useState(panelWidth);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      setScreen(getScreen());
      if (getSystemTab) setSystemTab(getSystemTab());
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("system-display-change", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("system-display-change", sync);
    };
  }, [getScreen, getSystemTab]);

  useLayoutEffect(() => {
    if (!open || !ref.current) return;

    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const resolvedWidth = panelWidth;
      const mainRect = document.querySelector(mainSelector)?.getBoundingClientRect();
      const minLeft = sidebarRow ? 8 : Math.max(8, (mainRect?.left ?? 0) + 8);

      if (!sidebarRow) {
        const availableWidth = Math.max(160, window.innerWidth - minLeft - 8);
        const width = Math.min(resolvedWidth, availableWidth);
        setResolvedPanelWidth(width);
        const left = Math.min(Math.max(rect.right - width, minLeft), window.innerWidth - width - 8);
        setHeaderPanelStyle({
          position: "fixed",
          left,
          top: menuPlacement === "bottom" ? rect.bottom + 6 : undefined,
          bottom: menuPlacement === "top" ? Math.max(8, window.innerHeight - rect.top + 6) : undefined,
          zIndex: 1100,
          maxHeight: maxPanelHeight,
          width,
        });
        return;
      }

      setSidebarPanelStyle({
        position: "fixed",
        left: rect.right + 8,
        bottom: Math.max(8, window.innerHeight - rect.bottom),
        zIndex: 1100,
        maxHeight: maxPanelHeight,
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
  }, [mainSelector, maxPanelHeight, menuPlacement, open, panelWidth, sidebarRow]);

  useEffect(() => {
    const sync = () => setPrefs(readPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [readPrefs]);

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

  const isSystem = screen === "system";
  const rawKpi = searchParam("kpi");
  const rawCharts = searchParam("charts");
  const rawFilters = searchParam(filterParam);
  const rawHeaderStats = searchParam(isSystem ? "sstat" : "hstat");
  const rawHpin = searchParam("hpin");
  const rawSpin = searchParam("spin");
  const rawNavicon = searchParam("navicon");

  const systemSlice = isSystem && systemDisplay && systemTab ? systemDisplay.read(systemTab) : null;
  const visKpiEffective = isSystem && systemDisplay ? systemSlice?.kpi ?? null : prefs.kpi;
  const visChartsEffective = isSystem && systemDisplay ? systemSlice?.charts ?? null : prefs.charts;
  const visHubFilters = filtersFromUrl ? parseSet(rawFilters) : (prefs.hubFilters ?? null);

  const isGlobalScope = scope === "global";
  const tabKpis = isGlobalScope ? [] : (kpis ?? []);
  const tabCharts = isGlobalScope ? [] : (charts ?? []);
  const tabFilters = isGlobalScope ? [] : (filters ?? []);
  const headerStats = isGlobalScope ? [] : headerStatsProp;
  const headerStatDefaults = isGlobalScope ? new Set<string>() : (defaultHeaderStatKeys ?? new Set<string>());
  const visHeaderStats = isSystem ? prefs.systemHeaderStats : prefs.headerStats;
  const headerStatParam = isSystem ? "sstat" : "hstat";

  const logScope = isGlobalScope ? "Tool" : isSystem ? `System / ${systemTab}` : "Hub";

  function emitLog(message: string) {
    onLog?.(logScope, message);
  }

  function update(patch: Record<string, string | null>, logMessage = "Updated display settings") {
    patchPrefs(patch, logMessage);
    setPrefs(readPrefs());
    emitLog(logMessage);
  }

  function defaultsFor(allItems: PrefItem[], defaults?: Set<string>) {
    return defaults ?? new Set(allItems.map((i) => i.key));
  }

  function toggleSetParam(
    param: string,
    cur: Set<string> | null,
    allItems: PrefItem[],
    defaults: Set<string>,
    key: string,
  ) {
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
    return { next, allDefault };
  }

  function toggle(
    param: "kpi" | "charts" | "hstat" | "sstat" | typeof filterParam,
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

    const { next, allDefault } = toggleSetParam(param, cur, allItems, defaults, key);

    if (isSystem && systemDisplay && systemTab && (param === "kpi" || param === "charts")) {
      systemDisplay.patch(systemTab, {
        [param]: allDefault ? null : [...next],
      });
      emitLog(`Updated ${systemTab} display`);
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

  const kpiDefaults = defaultsFor(tabKpis, defaultKpiKeys);
  const chartsDefaults = defaultsFor(tabCharts, defaultChartKeys);
  const filterDefaults = defaultsFor(tabFilters, defaultFilterKeys);
  const visKpiCount = visKpiEffective === null ? kpiDefaults.size : visKpiEffective.size;
  const visChartsCount = visChartsEffective === null ? chartsDefaults.size : visChartsEffective.size;
  const visFilterCount = visHubFilters === null ? filterDefaults.size : visHubFilters.size;
  const visHeaderStatCount = visHeaderStats === null ? headerStatDefaults.size : visHeaderStats.size;

  const hasGeneralPanel = isGlobalScope
    ? showHeaderPin
    : showRange || showLimit || showHeaderPin || Boolean(generalExtras);
  const hasDisplayPanel =
    !isGlobalScope && (tabKpis.length > 0 || tabCharts.length > 0 || tabFilters.length > 0 || headerStats.length > 0);
  const hasTablePanel = Boolean(tablePanel) && !isGlobalScope;
  const extraTabIds = extraTabs.map((t) => t.id);
  const activeExtraTab = extraTabs.find((t) => t.id === tab);

  useEffect(() => {
    if (!open) return;
    const validIds = new Set<string>(["general", "display", "table", ...extraTabIds]);
    if (validIds.has(tab)) {
      if (tab === "general" && !hasGeneralPanel) {
        if (extraTabs[0]) setTab(extraTabs[0].id);
        else if (hasDisplayPanel) setTab("display");
        else if (hasTablePanel) setTab("table");
      } else if (tab === "display" && !hasDisplayPanel) {
        if (hasGeneralPanel) setTab("general");
        else if (extraTabs[0]) setTab(extraTabs[0].id);
        else if (hasTablePanel) setTab("table");
      }
      return;
    }
    if (hasGeneralPanel) setTab("general");
    else if (extraTabs[0]) setTab(extraTabs[0].id);
    else if (hasDisplayPanel) setTab("display");
    else if (hasTablePanel) setTab("table");
  }, [extraTabIds, extraTabs, hasDisplayPanel, hasGeneralPanel, hasTablePanel, open, tab]);

  const activeCount =
    (isGlobalScope
      ? (showHeaderPin && rawHpin !== null ? 1 : 0) +
        (rawSpin === "0" ? 1 : 0) +
        (showNavToggle && rawNavicon === "0" ? 1 : 0)
      : (showRange && prefs.range !== "30d" ? 1 : 0) +
        (showLimit && prefs.limit !== 100 ? 1 : 0) +
        (rawKpi !== null ? 1 : 0) +
        (rawCharts !== null ? 1 : 0) +
        (rawFilters !== null ? 1 : 0) +
        (rawHeaderStats !== null ? 1 : 0)) + (tableActiveCount > 0 ? 1 : 0);

  const triggerClass = sidebarRow
    ? "relative flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--text)]"
    : compact
      ? "btn btn-ghost relative border-amber-400/20 bg-amber-500/10 px-2.5 text-amber-200 hover:bg-amber-500/15"
      : "btn btn-ghost border-amber-400/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15 hover:text-amber-100";

  const panelShellClass =
    "overflow-y-auto rounded-xl border border-white/10 bg-[var(--bg)] p-3 shadow-2xl shadow-black/40";

  const tabCount =
    (hasGeneralPanel ? 1 : 0) + extraTabs.length + (hasDisplayPanel ? 1 : 0) + (hasTablePanel ? 1 : 0);

  type SettingsTabOption = { id: string; label: string; icon: ReactNode };

  const settingsTabOptions: SettingsTabOption[] = [
    ...(hasGeneralPanel
      ? [{ id: "general", label: "General", icon: <Sliders size={compactIconSize(12)} /> }]
      : []),
    ...extraTabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon })),
    ...(hasDisplayPanel
      ? [{ id: "display", label: "Display", icon: <BarChart3 size={compactIconSize(12)} /> }]
      : []),
    ...(hasTablePanel
      ? [{ id: "table", label: "Table", icon: <Columns3 size={compactIconSize(12)} /> }]
      : []),
  ];

  const useScrollableTabBar =
    tabCount > 3 || settingsTabOptions.reduce((sum, opt) => sum + opt.label.length, 0) * 9 > resolvedPanelWidth - 24;

  /** 20px total below tab bar (mb-5); no extra padding on body. */
  const tabBarGapClass = tabCount > 1 ? "mb-5" : "";

  const settingsPanel = open ? (
    <div
      ref={panelRef}
      className={panelShellClass}
      style={sidebarRow ? sidebarPanelStyle : headerPanelStyle}
    >
      {tabCount > 1 ? (
        useScrollableTabBar ? (
          <div className={`-mx-0.5 overflow-x-auto [scrollbar-width:thin] ${tabBarGapClass}`}>
            <div className="flex min-w-min flex-nowrap gap-1 rounded-lg bg-white/[.03] p-0.5">
              {settingsTabOptions.map((opt) => (
                <TabButton
                  key={opt.id}
                  active={tab === opt.id}
                  onClick={() => setTab(opt.id)}
                  icon={opt.icon}
                  scrollable
                >
                  {opt.label}
                </TabButton>
              ))}
            </div>
          </div>
        ) : (
          <div className={`flex flex-wrap gap-1 rounded-lg bg-white/[.03] p-0.5 ${tabBarGapClass}`}>
            {settingsTabOptions.map((opt) => (
              <TabButton
                key={opt.id}
                active={tab === opt.id}
                onClick={() => setTab(opt.id)}
                icon={opt.icon}
              >
                {opt.label}
              </TabButton>
            ))}
          </div>
        )
      ) : null}

      {tab === "general" && hasGeneralPanel ? (
        <>
          {showRange ? (
            <Section icon={<SectionIcon icon={Clock} className="text-sky-300" />} label="Time range">
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
            <Section icon={<SectionIcon icon={Rows3} className="text-violet-300" />} label="Rows">
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
            <Section icon={<SectionIcon icon={PanelTop} className="text-amber-300" />} label="Header">
              <ToggleRow
                label="Pin header (sticky)"
                on={prefs.headerPin}
                onChange={() => update({ hpin: prefs.headerPin ? "0" : null })}
              />
              {!(hideSearchPinOnSystem && isSystem) ? (
                <ToggleRow
                  label="Pin search bar (sticky)"
                  on={prefs.searchPin}
                  onChange={() => update({ spin: prefs.searchPin ? "0" : null })}
                />
              ) : null}
              {showNavToggle && prefs.navToggleIcon !== undefined ? (
                <ToggleRow
                  label="Show submenu +/- icon"
                  on={prefs.navToggleIcon}
                  onChange={() => update({ navicon: prefs.navToggleIcon ? "0" : null })}
                />
              ) : null}
            </Section>
          ) : null}

          {generalExtras}
        </>
      ) : null}

      {activeExtraTab ? activeExtraTab.content : null}

      {tab === "display" && hasDisplayPanel ? (
        <>
          {tabKpis.length > 0 ? (
            <Section icon={<SectionIcon icon={Gauge} className="text-emerald-300" />} label={`KPI (${visKpiCount}/${tabKpis.length})`}>
              <div className="space-y-0.5">
                {tabKpis.map((k) => (
                  <ToggleRow
                    key={k.key}
                    label={k.label}
                    on={isVisible(visKpiEffective, kpiDefaults, k.key)}
                    onChange={() => toggle("kpi", tabKpis, kpiDefaults, k.key)}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {tabCharts.length > 0 ? (
            <Section icon={<SectionIcon icon={BarChart3} className="text-indigo-300" />} label={`Charts (${visChartsCount}/${tabCharts.length})`}>
              <div className="space-y-0.5">
                {tabCharts.map((c) => (
                  <ToggleRow
                    key={c.key}
                    label={c.label}
                    on={isVisible(visChartsEffective, chartsDefaults, c.key)}
                    onChange={() => toggle("charts", tabCharts, chartsDefaults, c.key)}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {tabFilters.length > 0 ? (
            <Section icon={<SectionIcon icon={Filter} className="text-cyan-300" />} label={`Filters (${visFilterCount}/${tabFilters.length})`}>
              <div className="space-y-0.5">
                {tabFilters.map((f) => (
                  <ToggleRow
                    key={f.key}
                    label={f.label}
                    on={isVisible(visHubFilters, filterDefaults, f.key)}
                    onChange={() => toggle(filterParam, tabFilters, filterDefaults, f.key)}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {headerStats.length > 0 ? (
            <Section
              icon={<SectionIcon icon={LayoutDashboard} className="text-orange-300" />}
              label={`${headerStatLabel(isSystem)} (${visHeaderStatCount}/${headerStats.length})`}
            >
              <div className="space-y-0.5">
                {headerStats.map((h) => (
                  <ToggleRow
                    key={h.key}
                    label={h.label}
                    on={isVisible(visHeaderStats, headerStatDefaults, h.key)}
                    onChange={() => toggle(headerStatParam, headerStats, headerStatDefaults, h.key)}
                  />
                ))}
              </div>
            </Section>
          ) : null}
        </>
      ) : null}

      {tab === "table" && hasTablePanel ? tablePanel : null}

      <button
        type="button"
        onClick={() => {
          if (isGlobalScope) {
            const patch: Record<string, string | null> = { hpin: null, spin: null };
            if (showNavToggle) patch.navicon = null;
            update(patch, "Reset global settings");
            return;
          }

          if (isSystem && systemDisplay && systemTab) {
            systemDisplay.reset(systemTab);
            update({ sstat: null }, `Reset ${systemTab} display settings`);
            return;
          }

          const patch: Record<string, string | null> = {
            kpi: null,
            charts: null,
            [filterParam]: null,
            hstat: null,
          };
          if (showRange) patch.range = null;
          if (showLimit) patch.limit = null;
          update(patch, "Reset display settings");
        }}
        className="mt-2 w-full rounded-md border border-white/10 px-2 py-1.5 text-[10px] text-[var(--muted)] hover:bg-white/[.05] hover:text-[var(--text)]"
      >
        Reset to defaults
      </button>
    </div>
  ) : null;

  return (
    <div ref={ref} className={sidebarRow ? "relative w-full" : "relative"}>
      <button type="button" onClick={() => setOpen((open) => !open)} className={triggerClass} title={title}>
        <Settings size={compactIconSize(sidebarRow ? 15 : 14)} className="shrink-0 text-amber-300" />
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

      {settingsPanel ? createPortal(settingsPanel, document.body) : null}
    </div>
  );
}
