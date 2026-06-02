# FilterBar panel pattern (P0004)

Use this for **any Hub table inside a tab or modal** that needs search + faceted filters (Hub list, System Links, Users tool access modal, etc.).

## Contract

1. **`FilterDef[]`** — one def per dimension; `showAllLabel: true` when “All {label}” applies.
2. **`matches*(item, query, filters)`** — search haystack + dimension checks.
3. **`matches*Option(item, filterKey, value)`** — for faceted counts only.
4. **`enrichFilterDefs`** (via `filter-option-counts.ts` or a thin `*FiltersWithCounts` wrapper).
5. **`FilterBar`** with `layout="hub"`, English placeholder, optional `row2Leading` (bulk Edit/Delete), optional `trailing` (actions + `shown/total`).
6. **Icons** — `badge-registry.ts`: `FILTER_ALL[filterKey]` + `resolveFilterOptionIcon` cases.

## Reference implementations

| Surface | Filter module | Prefs |
|---------|---------------|-------|
| Tool Links (detail modal) | `tool-link-filters.ts` | `use-link-filter-prefs.ts` |
| Users directory | `user-filter-counts.ts` | (screen state) |
| User access modal | `tool-access-filters.ts` | `use-tool-access-filter-prefs.ts` |
| Hub tools list | `hub-aggregates.ts` | hub prefs |

## Empty state

When `filtered.length === 0`, show a single muted message:

> No {items} match search or filters.

## New filter keys

Before shipping, add to `badge-registry.ts`:

- `FILTER_ALL.<key>`
- `resolveFilterOptionIcon` case for `<key>`
