# Design Decision — Tool Versions table

**Date:** 2026-05-24  
**Locked:** **V4** — FilterBar (sync filter)  
**Model (2026-05):** **Lịch sử version** — mỗi dòng một phiên bản, không phải mỗi nguồn đọc.

## Production

- `src/features/overview/ToolVersionsPanel.tsx`
- `src/features/overview/tool-versions.ts` (`collectVersionHistory`)
- `src/features/overview/version-filters.ts`
- `src/features/overview/use-version-filter-prefs.ts`
- `src/lib/version-badges.ts`

## Section

Tool modal / Overview TOC: **Versions** (`id=versions`), after Links.

## Columns (pipeline)

Sync · Version · Released · Title · **Mnf · Pkg · CL · Git · Push · Rel** · Ghi chú · Actions

| Cột | Ý nghĩa |
|-----|---------|
| Mnf | `tool.manifest.json` |
| Pkg | `package.json` |
| CL | CHANGELOG mục Version |
| Git | Tag GitHub hoặc Commit trong changelog |
| Push | Metadata/code trên remote (hoặc đã release) |
| Rel | GitHub Release |

Data: CHANGELOG + `/releases` + `/tags` + remote package/manifest.

## Excluded

- Ma trận “mỗi nguồn một dòng” (package.json, pushed_at, …)
