# Design Preview — Hub sticky header

**Status:** Preview (pick V1–V5 before production)  
**Route:** System → Design Template → **Hub Header · V1–V5**  
**URL:** `?screen=system&stab=template&dtpl=hub-header&hheader=V1`

Reference: [P0019 Work Performance](../../P0019-Work-Performance/components/Header.tsx) + `TopBar` (sticky, session info, KPI ticker, primary CTA).

## Mock signals (all variants)

| Signal | Preview | Production source |
|--------|---------|-------------------|
| Registry | live dot + timestamp | `localRegistry.generatedAt` |
| Session | MM:SS timer | page-visible interval |
| Workspace | `E:\Dev\Tool` | registry root / env |
| KPI chips | Ready · Drift · Releases · Link gaps | `hubKpis(filtered)` |
| Shown | `11/13` | `filtered.length` / `allTools.length` |
| Latest | P0009 pushed 2m… | recent `updatedAt` tools |
| Actions | Refresh · Display · History · Alerts | `refreshAll`, `DisplayPrefs`, drift list |

## Variants

| ID | Name | Layout |
|----|------|--------|
| **V1** | P0019 twin bar | Top strip (registry + session + KPI + gradient Refresh) + title row (Hub inline + Settings) |
| **V2** | Compact rail | Single 44px row — maximum density |
| **V3** | Accent band | Gradient stats band + frosted title row |
| **V4** | Activity ticker | Scrolling latest tool events center; stats footer |
| **V5** | Bento board | 3-column card: meta · 2×2 stat tiles · action stack |

All use `sticky top-0 z-30 backdrop-blur` (demo: scroll inner box).

## Approval

Reply: `Design: V1` … `Design: V5` → create `docs/DESIGN-DECISION-HUB-HEADER.md` → implement `HubStickyHeader` in `HubListPage.tsx`.
