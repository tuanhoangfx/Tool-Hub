# @tool-workspace/hub-ui

Shared Hub shell UI extracted from **P0004 Tool Hub** (`src/components/sales-shell` + display-prefs).

## Install (per app)

```json
"@tool-workspace/hub-ui": "file:./vendor/hub-ui"
```

Vite / tsconfig:

```json
"@tool-workspace/hub-ui": ["vendor/hub-ui/src/index.ts"],
"@tool-workspace/hub-ui/*": ["vendor/hub-ui/src/*"]
```

## CSS (required)

In app `main` or global CSS:

```css
@import "./theme/p0008-globals.css";
@import "@tool-workspace/hub-ui/styles/hub-check-indicator.css";
```

Also copy P0004 `src/styles/base.css`, `layout.css`, `controls.css`, `cards.css`, `visual.css`, `library.css` (see `sync-p0004-ui-shell/reference.md` § Clone 100%).

## Keep in sync with P0004

After changing shell components in P0004:

```bash
node E:/Dev/Tool/scripts/sync-hub-ui-vendor.cjs
node E:/Dev/Tool/scripts/sync-hub-ui-vendor.cjs --target E:/Dev/Tool/P0020-Data-Box/vendor/hub-ui
```

Canonical implementations live in **`P0004/src/components/sales-shell`** until a workspace-level `packages/hub-ui` exists.

## In this package (portable)

`AppTabHeader`, `WorkspaceTabHeader`, `HubDisplayPrefs`, `HubLoadingView`, KPI/charts (`KpiStrip`, `MiniBarChart`, `MiniDonut`), `MetricBadge`, `ViewToggle`, `HubResultCount`, `ui-scale`, loader DOM + CSS.

Types only: `FilterIconMeta`, `BadgeSpec` (`types/filter-badge.ts`). Full icon maps stay in each app.

## App-specific (copy from P0004 `src`, not vendor)

| Piece | P0004 | Other tools |
|-------|-------|-------------|
| Sidebar + footer | `SalesSidebar.tsx` | `WorkspaceSidebar.tsx` (see P0020) |
| FilterBar + faceted counts | `FilterBar.tsx`, `filter-option-counts.ts` | copy + wire domain filters |
| Filter / badge icons | `badge-registry.ts` | copy + extend per tool |
| System sub-nav, time/limit | `SystemTabSubNav`, `HubTimeRangeSelect`, `HubRowLimitSelect` | Hub/System only |
| Display prefs wiring | `DisplayPrefs.tsx` | thin adapter over `HubDisplayPrefs` |
| Hub list / cards | `HubToolCard.tsx`, `hub-aggregates` | domain-specific |

## Clone workflow

Skill: `.cursor/skills/sync-p0004-ui-shell`  
Rule: `.cursor/rules/p0004-hub-ui-standard.mdc`  
Agent: `p0004-ui-sync`
