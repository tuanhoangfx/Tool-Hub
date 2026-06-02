import { useEffect, useRef, useState } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Activity,
  Layers,
  Rocket,
  Link2,
  AlertTriangle,
  ShieldCheck,
  BriefcaseBusiness,
  Package,
} from "lucide-react";
import type { FilterIconMeta } from "../../lib/badge-registry";
import { resolveFilterAllIcon, resolveFilterOptionIcon } from "../../lib/badge-registry";
import { compactIconSize } from "../../lib/ui-scale";

export type FilterOption = { value: string; label: string; color?: string; count?: number };
export type FilterDef = {
  key: string;
  label: string;
  options: FilterOption[];
  showAllLabel?: boolean;
  /** Items matching query + other active filters (shown on “All …” row). */
  totalCount?: number;
};

const FILTER_ICONS: Record<string, React.ElementType> = {
  health: Activity,
  category: Layers,
  deploy: Rocket,
  role: ShieldCheck,
  tool: Package,
  project: BriefcaseBusiness,
  status: Activity,
  drift: AlertTriangle,
  kind: Link2,
  links: Link2,
  sync: Rocket,
  org: Layers,
  region: Layers,
  plan: Layers,
  entity: Layers,
  group: Layers,
};

export type FilterValues = Record<string, string[]>;

type FilterBarProps = {
  placeholder?: string;
  filters?: FilterDef[];
  query: string;
  onQueryChange: (q: string) => void;
  values: FilterValues;
  onValuesChange: (next: FilterValues) => void;
  /** Row 1 trailing (view toggle, counts) — used with layout="hub". */
  toolbar?: React.ReactNode;
  /** Row 2 leading — before filter dropdowns in hub layout. */
  row2Leading?: React.ReactNode;
  /** Row 2 trailing actions — right side of filter row (before Clear filters). */
  row2Actions?: React.ReactNode;
  /** Single-row trailing (legacy / Links panel). */
  trailing?: React.ReactNode;
  layout?: "inline" | "hub";
  /** Hub: sticky below tab header; section divider sits under this block. */
  pinSticky?: boolean;
  /** When pinSticky, offset for sticky tab header above. */
  headerPinned?: boolean;
  /** Panel only (inside shared sticky chrome with header). */
  embedded?: boolean;
};

export function FilterBar({
  placeholder = "Search...",
  filters = [],
  query,
  onQueryChange,
  values,
  onValuesChange,
  toolbar,
  row2Leading,
  row2Actions,
  trailing,
  layout = "inline",
  pinSticky = false,
  headerPinned = true,
  embedded = false,
}: FilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function setFilter(key: string, selected: string[]) {
    const next = { ...values };
    if (selected.length === 0) delete next[key];
    else next[key] = selected;
    onValuesChange(next);
  }

  function clearAll() {
    onQueryChange("");
    onValuesChange({});
  }

  const hasActive = query !== "" || filters.some((f) => (values[f.key]?.length ?? 0) > 0);
  const activeCount =
    (query ? 1 : 0) + filters.reduce((n, f) => n + (values[f.key]?.length ?? 0), 0);

  const searchField = (
    <div className="relative min-w-[var(--hub-search-min-w)] flex-1">
      <Search size={compactIconSize(14)} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--muted)]" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        className="field w-full"
        style={{ paddingLeft: 31, paddingRight: query ? 25 : 50 }}
      />
      {!query ? (
        <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 sm:flex">
          <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-[var(--muted)]">Ctrl</kbd>
          <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-[var(--muted)]">K</kbd>
        </span>
      ) : null}
      {query ? (
        <button
          type="button"
          onClick={() => onQueryChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]"
        >
          <X size={compactIconSize(12)} />
        </button>
      ) : null}
    </div>
  );

  const clearFiltersBtn = hasActive ? (
    <button
      type="button"
      onClick={clearAll}
      className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/20"
      title="Clear search and all filters"
    >
      Clear filters
      <span className="grid h-4 min-w-[var(--hub-count-badge-min-w)] place-items-center rounded-full bg-rose-500/80 px-1 text-[9px] font-bold text-white">
        {activeCount}
      </span>
    </button>
  ) : null;

  const filterDropdowns = filters.map((f) => (
    <MultiFilterDropdown
      key={f.key}
      filter={f}
      selected={values[f.key] ?? []}
      onChange={(vals) => setFilter(f.key, vals)}
    />
  ));

  if (layout === "hub") {
    const stickyTop = headerPinned ? "top-[var(--app-tab-header-sticky-h)]" : "top-0";
    const panel = (
      <div className="space-y-2 rounded-2xl border border-white/5 bg-[var(--panel)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {searchField}
          {toolbar ? <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">{toolbar}</div> : null}
        </div>
        <div className="flex min-h-[var(--hub-control-h)] flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {row2Leading ? <div className="flex shrink-0 flex-wrap items-center gap-2">{row2Leading}</div> : null}
            {filterDropdowns}
            {clearFiltersBtn}
          </div>
          {row2Actions ? (
            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">{row2Actions}</div>
          ) : null}
        </div>
      </div>
    );

    if (embedded) {
      return <div className="px-6 pb-3 pt-0">{panel}</div>;
    }

    if (!pinSticky) return panel;

    return (
      <div
        className={`hub-filter-sticky sticky z-[35] -mx-6 border-b border-white/5 bg-[var(--bg)] px-6 pb-3 pt-0 ${stickyTop}`}
      >
        {panel}
      </div>
    );
  }

  const filterRow = (
    <>
      {filterDropdowns}
      {clearFiltersBtn}
    </>
  );

  return (
    <div className="space-y-2 rounded-2xl border border-white/5 bg-[var(--panel)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchField}
        {filterRow}
        {trailing ? <div className="ml-auto flex items-center gap-2">{trailing}</div> : null}
      </div>
      {hasActive ? (
        <ActivePills
          query={query}
          onClearQ={() => onQueryChange("")}
          filters={filters}
          values={values}
          onClearAll={clearAll}
          onRemove={setFilter}
        />
      ) : null}
    </div>
  );
}

function FilterIconGlyph({ meta, size = compactIconSize(14) }: { meta: FilterIconMeta; size?: number }) {
  const Icon = meta.icon;
  return <Icon size={size} className={`shrink-0 ${meta.className}`} aria-hidden />;
}

function FilterOptionCount({ value }: { value?: number }) {
  if (value === undefined) return null;
  return (
    <span className="ml-auto shrink-0 tabular-nums text-[10px] font-medium text-[var(--muted)]">{value}</span>
  );
}

function FilterOptionGlyph({ filterKey, option }: { filterKey: string; option: FilterOption }) {
  const meta = resolveFilterOptionIcon(filterKey, option);
  if (!meta) {
    return option.color ? (
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: option.color }} aria-hidden />
    ) : null;
  }
  return <FilterIconGlyph meta={meta} />;
}

function resolveFilterTriggerIcon(filter: FilterDef, selected: string[]): FilterIconMeta | null {
  if (selected.length === 1) {
    const opt = filter.options.find((o) => o.value === selected[0]);
    if (opt) {
      const icon = resolveFilterOptionIcon(filter.key, opt);
      if (icon) return icon;
    }
  }
  const allIcon = resolveFilterAllIcon(filter.key);
  if (allIcon) return allIcon;
  const Fallback = FILTER_ICONS[filter.key];
  if (Fallback) return { icon: Fallback, className: "opacity-75" };
  return null;
}

function MultiFilterDropdown({
  filter,
  selected,
  onChange,
}: {
  filter: FilterDef;
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const filtered = filter.options.filter((o) => !search || o.label.toLowerCase().includes(search.toLowerCase()));
  const allValues = filter.options.map((o) => o.value);
  const allSelected = selected.length > 0 && selected.length === allValues.length;
  const someSelected = selected.length > 0 && !allSelected;

  function toggle(v: string) {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  }
  function toggleAll() {
    if (allSelected) onChange([]);
    else onChange(allValues);
  }

  const buttonLabel = (() => {
    if (selected.length === 0) return filter.showAllLabel ? `All ${filter.label}` : filter.label;
    if (selected.length === 1) {
      const opt = filter.options.find((o) => o.value === selected[0]);
      return `${filter.label}: ${opt?.label ?? selected[0]}`;
    }
    return `${filter.label}: ${selected.length} selected`;
  })();

  const triggerIcon = resolveFilterTriggerIcon(filter, selected);
  const allIcon = resolveFilterAllIcon(filter.key);
  const showTotalOnTrigger = selected.length === 0 && filter.totalCount !== undefined;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-[var(--hub-control-h)] items-center gap-1.5 rounded-lg border px-3 text-xs transition-colors ${
          selected.length > 0
            ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200"
            : "border-white/10 bg-[var(--panel-2)] text-[var(--text)] hover:bg-white/5"
        }`}
      >
        {triggerIcon ? <FilterIconGlyph meta={triggerIcon} size={compactIconSize(12)} /> : null}
        <span>{buttonLabel}</span>
        {showTotalOnTrigger ? (
          <span className="shrink-0 tabular-nums text-[10px] font-medium text-[var(--muted)]">{filter.totalCount}</span>
        ) : null}
        {selected.length > 1 ? (
          <span className="grid h-4 min-w-[var(--hub-count-badge-min-w)] place-items-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white">
            {selected.length}
          </span>
        ) : null}
        <ChevronDown size={compactIconSize(12)} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="anim-pop absolute left-0 top-full z-30 mt-1 w-72 rounded-xl border border-white/10 bg-[var(--panel)] shadow-xl shadow-black/40">
          <div className="border-b border-white/5 p-2">
            <div className="relative">
              <Search size={compactIconSize(12)} className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${filter.label.toLowerCase()}...`}
                className="field text-xs"
                style={{ paddingLeft: 25, paddingTop: 4, paddingBottom: 4 }}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-72 overflow-auto p-1">
            <button
              type="button"
              onClick={toggleAll}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-white/5"
            >
              <Circle checked={allSelected} indeterminate={someSelected} />
              {allIcon ? <FilterIconGlyph meta={allIcon} /> : null}
              <span>All {filter.label}</span>
              <FilterOptionCount
                value={
                  filter.totalCount ??
                  (filter.options.some((o) => o.count !== undefined)
                    ? filter.options.reduce((sum, o) => sum + (o.count ?? 0), 0)
                    : filter.options.length)
                }
              />
            </button>
            <div className="my-1 border-t border-white/5" />
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-white/5"
              >
                <Circle checked={selected.includes(o.value)} />
                <FilterOptionGlyph filterKey={filter.key} option={o} />
                <span className="flex-1 truncate text-left" title={o.label}>
                  {o.label}
                </span>
                <FilterOptionCount value={o.count} />
              </button>
            ))}
            {filtered.length === 0 ? <div className="py-4 text-center text-xs text-[var(--muted)]">No matches</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Circle({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) {
  return (
    <div
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-all ${
        checked
          ? "border-indigo-400 bg-indigo-500"
          : indeterminate
            ? "border-indigo-400 bg-indigo-500/30"
            : "border-white/25"
      }`}
    >
      {checked || indeterminate ? (
        indeterminate ? (
          <div className="h-1 w-2 rounded-full bg-white" />
        ) : (
          <Check size={compactIconSize(9)} className="text-white" />
        )
      ) : null}
    </div>
  );
}

function ActivePills({
  query,
  onClearQ,
  filters,
  values,
  onClearAll,
  onRemove,
}: {
  query: string;
  onClearQ: () => void;
  filters: FilterDef[];
  values: FilterValues;
  onClearAll: () => void;
  onRemove: (key: string, selected: string[]) => void;
}) {
  const activeItems: { key: string; value: string; label: string; iconMeta: FilterIconMeta | null }[] = [];
  for (const f of filters) {
    for (const v of values[f.key] ?? []) {
      const opt = f.options.find((o) => o.value === v);
      activeItems.push({
        key: f.key,
        value: v,
        label: `${f.label}: ${opt?.label ?? v}`,
        iconMeta: opt ? resolveFilterOptionIcon(f.key, opt) : null,
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-2 text-xs">
      <SlidersHorizontal size={compactIconSize(10)} className="text-[var(--muted)]" />
      <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Active:</span>
      {query ? (
        <button
          type="button"
          onClick={onClearQ}
          className="badge cursor-pointer border border-indigo-500/30 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25"
        >
          q: &quot;{query}&quot; <X size={compactIconSize(10)} className="ml-1" />
        </button>
      ) : null}
      {activeItems.map((it) => {
        const PillIcon = it.iconMeta?.icon;
        return (
        <button
          key={`${it.key}:${it.value}`}
          type="button"
          onClick={() => onRemove(it.key, (values[it.key] ?? []).filter((v) => v !== it.value))}
          className="badge inline-flex cursor-pointer items-center gap-1 border border-white/15 bg-white/10 hover:bg-white/15"
        >
          {PillIcon ? <PillIcon size={compactIconSize(10)} className={it.iconMeta!.className} aria-hidden /> : null}
          {it.label} <X size={compactIconSize(10)} className="ml-0.5" />
        </button>
        );
      })}
      <button type="button" onClick={onClearAll} className="ml-auto text-[10px] text-rose-300 hover:underline">
        Clear all
      </button>
    </div>
  );
}
