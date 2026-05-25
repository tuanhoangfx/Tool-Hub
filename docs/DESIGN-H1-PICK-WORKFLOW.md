# Hub UI workflow — hoàn tất

**Đã chốt S1 / P0008 shell.** Không còn vòng chọn variant spectrum card.

## Production (2026)

| Piece | Path |
|-------|------|
| Hub card | `src/features/hub/HubToolCard.tsx` |
| Hub list page | `src/features/hub/HubListPage.tsx` |
| Badges | `src/lib/badge-registry.ts` + `MetricBadge` |
| Tool Links | `src/features/overview/ToolLinksTable.tsx` |

**Removed:** `ToolCard.tsx`, `StoreTab.tsx`, `hub-spectrum.css`, `tool-card.css`.

## Design Template (reference)

- `src/features/system-hub/design-template/` — lazy-loaded when System tab = **Design Template** or **Schema**.
- `hub-card/`, `hub-header/`, `tool-links/`, `badge-icons/` — previews (lazy-loaded).

Mở rộng: chỉnh `HubToolCard` / `badge-registry`; không khôi phục `ToolCard` trừ khi user yêu cầu design round mới.
