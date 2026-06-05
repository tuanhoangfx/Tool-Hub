# Hub keyboard shortcuts (workspace standard)

Synced across Hub tools via `@tool-workspace/hub-ui` (single source: `packages/hub-ui/src/keyboard/`).

| Key | Action | Where |
|-----|--------|--------|
| **F** | Focus main tab search (FilterBar) | All Hub list tabs with FilterBar |
| **Ctrl+Q** | Clear search query and all active filters | Same scope as **F** |
| **N** | Add / create (primary row action) | Users → Add; screens with `onNew` handler |
| **S** | Open tab header Settings panel | Tab chrome (not sidebar global Settings) |
| **E** | Edit selection (when rows checked) | Users → Edit; Hub → Refresh selected tools |
| **Esc** | Blur FilterBar search when focused; otherwise close open modal | Search field after **F**; modals unchanged when search not focused |

## Cross-tool sync

| Tool | Dependency | App shell | Filter scope |
|------|------------|-----------|--------------|
| P0004 | `vendor/hub-ui` | `useHubActiveScreenSync(screen, systemTab)` | `library` / `users` / `system-<tab>` |
| P0020 | `vendor/hub-ui` | `useHubActiveScreenSync(activeNav)` | `notes` / `twofa` / `cookie` / `system` |
| P0006 | `workspace:*` | `useHubActiveScreenSync(screen)` | per tab via `TabScreenChrome` |
| P0008 | `vendor/hub-ui` | `HubKeyboardScopeSync` (pathname) | `products` / `orders` / `buyers` / `dashboard` |

After editing keyboard code: `node E:\Dev\Tool\scripts\sync-hub-ui-vendor.cjs` (fans out vendors). Do **not** edit `vendor/hub-ui` keyboard files by hand. Pre-commit hook `check-hub-ui-keyboard-sync.cjs` blocks commit when vendor ≠ packages (skip: `TOOL_HUB_SKIP_KEYBOARD_SYNC_HOOK=1`).

## Implementation

- Module: `packages/hub-ui/src/keyboard/hub-keyboard-shortcuts.ts`
- App shell: `useHubActiveScreenSync(screen, systemTab)` in `App.tsx` — scope `library` | `users` | `system-<tab>`
- System FilterBar: `hubSystemShortcutScope(tabId)` in `SystemHubShell` (must match active screen)
- Search: `FilterBar` with `shortcutScope` matching active tab
- Clear: `registerHubSearchClear` from `FilterBar` (**Ctrl+Q**; works in search input too)
- Settings: `registerHubSettingsOpen` from `HubDisplayPrefs` when `scope !== "global"`
- N / E: `useHubPageShortcuts("<scope>", { … })` per screen (keep-mounted safe)
- Esc: each modal `useEffect` on `Escape` (unchanged)

## Tab Hub (`library`)

| Key | Action |
|-----|--------|
| F | Focus Hub search |
| Ctrl+Q | Clear Hub search + filters |
| S | Open Settings |
| E | Refresh **selected tools** (tick rows first; needs `onRefreshTool`) |
| N | — (not wired on Hub catalog) |

## Tab Users (`users`)

| Key | Action |
|-----|--------|
| F / Ctrl+Q / S | Search / clear / Settings |
| N | Add user (admin) |
| E | Edit selected user |

## System sub-tabs (`system-<tab>`)

| Sub-tab | Scope | F / Ctrl+Q | S | N / E |
|---------|--------|------------|---|-------|
| Overview | `system-overview` | Yes | Yes | — |
| Schema | `system-schema` | Yes | Yes | — |
| Supabase Quota | `system-supabase-quota` | Yes | Yes | — |
| Server | `system-server` | Yes | Yes | — |
| Agent | `system-agent` | Yes | Yes | — |
| Design Template | `system-template` | — (no FilterBar) | Yes | — |

## UI hint

- Search field shows **F** badge (replaces Ctrl+K)
