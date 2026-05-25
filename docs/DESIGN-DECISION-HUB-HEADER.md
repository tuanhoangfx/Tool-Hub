# Design decision — Hub sticky header

**Approved:** V2 — Compact command rail  
**Date:** 2026-05-24  
**Production:** `src/features/hub/HubStickyHeader.tsx`

## Layout (locked)

Single sticky row (`h-11`, `sticky top-0`, backdrop blur):

| Zone | Content |
|------|---------|
| Left | `LayoutGrid` + **Hub** |
| Meta | Registry (live dot + label) · Session MM:SS |
| Center (md+) | KPI pill: Ready · Drift · Releases · Link gaps (from filtered tools) |
| Right | `{shown}/{total}` · Refresh · Display prefs |

## Data sources

- Registry: `localRegistry.generatedAt` via App → `registryLabel` / `registryLive`
- Session: `usePageSessionSeconds()` (pauses when tab hidden)
- KPI + shown: `hubKpis(filtered)` + list lengths

## Not in V2 scope

- Latest activity marquee (V4)
- History / bell icon actions (V1)
- Twin-bar second title row (V1)

## Preview reference

Design Template `hub-header` · `hheader=V2` remains for comparison; status **locked**.
