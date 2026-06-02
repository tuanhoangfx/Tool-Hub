# Design preview: Agent context (System tab)

**Feature id:** `agent-context`  
**Route:** `http://127.0.0.1:5176/system/template` (variants `V1`–`V5` via picker or `/system/template/3`)

## Variants

| ID | Direction | Modal |
|----|-----------|--------|
| V1 | Full Hub chrome (FilterBar, KPI, 4 charts, section rule) + table/card | Row/card → modal |
| V2 | Same chrome · grouped cards by kind | Card → modal |
| V3 | Same chrome · split explorer | Button → modal |
| V4 | Same chrome · kind chips in filter row | Item → modal |
| V5 | Same chrome · inline TOC console | Expand → modal |

**Shared analytics (all variants):** `Items (shown)`, Rules, Skills, Always on · charts: By kind, By scope, Apply mode, Size (lines). Counts follow **filtered** set like Hub.

## Production scope (after lock)

- New System sub-tab **Agent** (or section under Overview) — read-only
- `scripts/sync-agent-manifest.mjs` → `public/agent-manifest.json`
- `pnpm build` runs `rules:sync` + agent manifest scan
- No mock files in repo after lock

## Lock

User message: `Design: V1` … `Design: V5` → implement production → remove `agent-context-mock*` + registry entry.
