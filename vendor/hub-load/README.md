# @dev/hub-load

Client load utilities for P00xx Hub tools: caches, background refresh, lazy tab prefetch, virtual scroll windows.

## `useVirtualWindow`

Generic scroll-window hook for long lists and directory tables.

### Layout modes

| `layout` | Use case | Render pattern |
|----------|----------|----------------|
| `offset` | Notes rail, card lists with gap | `transform: translateY(offsetY)` on inner list |
| `pad` | `hub-users-table` tbody | Spacer `<tr>` with `height: padTop/padBottom` |

### Options

```ts
useVirtualWindow(items, {
  threshold: 48,      // enable when items.length >= threshold
  overscan: 8,        // extra rows above/below viewport
  rowHeight: 48,      // px per row (pad layout)
  rowGap: 2,          // px between rows (offset layout stride only)
  layout: "offset",   // "offset" | "pad"
  initialVisible: 32, // first paint window before scroll measure
});
```

### Helpers

- `virtualWindowStride(rowHeight, rowGap?)` — row height + gap
- `virtualWindowContentHeight(count, rowHeight, rowGap?)` — total scroll height (offset)
- `isVirtualIndexInView(el, index, rowHeight, stride, margin?)`
- `scrollVirtualIndexIntoView(el, index, rowHeight, stride, behavior?, margin?)`

### P0020 references

- **Notes rail** — `useNotesListVirtualWindow` → `layout: "offset"`, `threshold: 48`, `rowGap: 2`
- **2FA table** — `useTwofaTableVirtualWindow` → `layout: "pad"`, `threshold: 100`, `rowHeight: 52`

### AI onboard checklist

1. Prefer `useVirtualWindow` from `@dev/hub-load` — do not copy scroll math into tools.
2. Keep tool-specific thresholds in a thin wrapper (`useXxxVirtualWindow.ts`).
3. For tables, use `pad` + sticky `thead` (see `hub-twofa-table-virtual-scroll` in P0020).
4. Pair with hover/scroll prefetch for row detail (Notes: `noteDetailPrefetch`).

## Other exports

See `src/index.ts` — `createClientCache`, `useBackgroundRefresh`, `createModulePrefetch`, `useCrossTabVaultReload`, etc.
