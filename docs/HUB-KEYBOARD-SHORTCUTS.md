# Hub keyboard shortcuts (workspace standard)

Synced across P0004 Hub UI via `@tool-workspace/hub-ui`.

| Key | Action | Where |
|-----|--------|--------|
| **F** | Focus main tab search (FilterBar) | All Hub list tabs with FilterBar |
| **N** | Add / create (primary row action) | Users → Add; screens with `onNew` handler |
| **E** | Edit selection (when rows checked) | Users → Edit; Hub → Refresh selected tools |
| **Esc** | Close open modal | Tool detail, user access, agent context, Supabase detail |

## Implementation

- Module: `packages/hub-ui/src/keyboard/hub-keyboard-shortcuts.ts`
- App shell: `setHubActiveScreen("library" | "users" | "system")` on sidebar change (`App.tsx`)
- Search: `FilterBar` with `shortcutScope` matching active tab
- N / E: `useHubPageShortcuts("library", { … })` per screen (keep-mounted safe)
- Esc: each modal `useEffect` on `Escape` (unchanged)

## Tab Hub (`library`)

| Key | Action |
|-----|--------|
| F | Focus Hub search |
| E | Refresh **selected tools** (tick rows first; needs `onRefreshTool`) |
| N | — (not wired on Hub catalog) |

## Not global

- Does not fire inside `<input>`, `<textarea>`, or `contenteditable`
- **N** / **E** only when the screen registers handlers (Agent tab: F + Esc only)

## UI hint

- Search field shows **F** badge (replaces Ctrl+K)
- System → Agent toolbar: `HubKeyboardHints` legend
