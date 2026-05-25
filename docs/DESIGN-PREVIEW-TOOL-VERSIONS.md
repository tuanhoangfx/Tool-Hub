# Design preview — Tool Versions table

**Status:** Preview  
**Tab:** System → Design Template → **Tool Versions**  
**URL:** `?screen=system&stab=template&dtpl=tool-versions&vver=V1` … `V5`

## Pattern

Giống **Tool Links** (`ToolLinksPanel` / `ToolLinksTable.tsx`):

- **Mỗi dòng** = một nguồn / trường version (registry, package.json, manifest, release, changelog, pushed_at, …)
- **Cột** = trường dữ liệu tương ứng (status badge, group, source, field, version value, updated, drift, actions copy/open)

Mock rows: `tool-versions/mock.ts` → `MOCK_VERSION_ROWS` (`ToolVersionRow`).

## Variants (cùng dạng bảng, khác bộ cột)

| ID | Layout |
|----|--------|
| **V1** | Link-parity: Status · Type · Group · Source · Version · Actions |
| **V2** | Full: + Field · Updated |
| **V3** | Full + cột **Drift** |
| **V4** | V3 + **FilterBar** (group, status) |
| **V5** | V3 + **Published** · **Size** |

Component: `VersionsTablePanel.tsx`.

## Lock

`Design: V1` … `V5` → `DESIGN-DECISION-TOOL-VERSIONS.md` → `ToolVersionsPanel.tsx` trong tool modal (data từ `resolveTool` / `createVersionAlerts`).
