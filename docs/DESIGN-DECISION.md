# Hub UI — Design decisions

## Chốt: **P0008 Orders shell** (2026-05-24)

| Item | Choice |
|------|--------|
| Reference | **P0008-Sales-Console** `/orders` (ListPageLayout) |
| Shell | Sidebar `w-60` + `AppTabHeader` (sticky) + `KpiStrip` + charts + `FilterBar` |
| Stack | Tailwind 3.4 + `p0008-globals.css` + `lucide-react` (ported `sales-shell/`) |
| Cards | `HubToolCard` — same hover/border/grid as `OrderCard` |
| Palette | `--bg` / `--panel` tokens (P0008 globals) |

Legacy macOS traffic-light sidebar và `hub-page-stats` đã thay bằng layout Orders.

Legacy `hub-ui/` spectrum preview đã gỡ (2026-05); tham chiếu card: **Design Template → Hub Card** + production `HubToolCard.tsx`.
