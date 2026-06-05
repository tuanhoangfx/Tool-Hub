# System tab shell (P0004 golden parity)

Every **System** sub-tab and future tabs must use `SystemHubShell` — same chrome, spacing, and Display prefs as **Hub / Users**.

## Checklist for a new System tab

1. Add `SystemTab` id in `components/SystemTabs.tsx`.
2. Register KPI/chart defs in `system-display-prefs.ts` (`systemDisplayDefs` switch + defaults).
3. Render panel with:

```tsx
<SystemHubShell
  tabId="your-tab"
  placeholder="Search…"
  filters={filterDefs}
  query={query}
  onQueryChange={setQuery}
  values={filterValues}
  onValuesChange={setFilterValues}
  toolbar={<>… ViewToggle · HubResultCount · actions</>}
  kpiItems={[{ prefKey: "total", label: "…", value: n, … }]}
  chartSlots={{
    health_bar: <MiniBarChart … />,
    category_bar: …,
    deploy_donut: …,
    status_donut: …,
  }}
  sectionRuleLabel="Optional override"
>
  {body}
</SystemHubShell>
```

4. **Do not** filter KPI/charts in the panel — `SystemHubShell` uses `useSystemTabDisplayState(tabId)` + Settings → Display (System scope).
5. **Do not** use `readHubListPrefs().kpi/charts` for visibility on System tabs.
6. **Do not** add local `mt-5`, `pt-4`, `pb-8`, or duplicate section dividers — use `sectionRuleLabel` on the shell.
7. Map `prefKey` on each KPI tile to keys in `system-display-prefs.ts` for that tab.
8. Map chart slots to `health_bar` | `category_bar` | `deploy_donut` | `status_donut` (Display prefs labels per tab).

## Sticky filter

When header + search pin are on, only the **active** tab's filter is portaled into `HubTabChrome` (`tabId === readSystemTab()`). Do not wrap the portal anchor with `px-6` — `FilterBar` `embedded` already applies Hub padding.

When pins are off, the active filter renders in `HubTabChrome` `filterBar` via `useRegisterSystemTabFilter` (same slot as Hub `HubDirectoryScreen`), **not** inside `hub-tab-content-zone`.

## Keyboard shortcuts

- `SystemHubShell` sets `FilterBar` `shortcutScope={hubSystemShortcutScope(tabId)}` → `system-<tab>`.
- App shell must call `useHubActiveScreenSync(screen, systemTab)` so **F** / **Ctrl+Q** / **S** match the active System sub-tab (same as Hub / Users).
- Tabs with `showFilter={false}` (Design Template): **S** only.

## Reference tabs

| Tab | File |
|-----|------|
| Overview | `SystemOverviewPanel.tsx` |
| Schema | `SystemSchemaPanel.tsx` |
| Supabase Quota | `SystemSupabaseQuotaPanel.tsx` |
| Server | `SystemServerPanel.tsx` |
| Agent | `SystemAgentContextPanel.tsx` |
| Design Template | `design-template/DesignTemplatePage.tsx` (`showFilter={false}`) |
