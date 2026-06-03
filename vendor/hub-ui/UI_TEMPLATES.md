# Hub UI screen templates

Pick **one template per screen** in `tool.manifest.json` → `uiScreens[]`.  
Clone flow: sync shell (A) → apply template (B) → config only (C).

## App shell (layer A — all templates)

Always sync before any screen:

```bash
node E:/Dev/Tool/scripts/sync-hub-ui-vendor.cjs
node E:/Dev/Tool/scripts/sync-hub-theme-from-p0004.cjs --target <app>/src
```

Required CSS imports in app `styles.css`:

```css
@import "@tool-workspace/hub-ui/styles/hub-check-indicator.css";
@import "@tool-workspace/hub-ui/styles/hub-shell-layout.css";
@import "@tool-workspace/hub-ui/styles/hub-app-tab-header.css";
@import "@tool-workspace/hub-ui/styles/hub-fields.css";
@import "@tool-workspace/hub-ui/styles/hub-users-table.css";
```

Bootstrap: `HubLoaderRoot` + `configureFilterIcons` / `configureHubChromePrefs` (see `README.md`).

---

## Templates (layer B)

| ID | Vietnamese | Golden source | Package entry |
|----|------------|---------------|---------------|
| `directory` | Danh mục (card/table) | P0004 Users, Hub list; P0006 Bots, Groups, Channels | `HubDirectoryScreen` |
| `analytics` | Tổng quan KPI + chart (no TOC) | P0006 `OverviewScreen` | `HubDirectoryScreen` + `HubTabScreenBody` |
| `document-toc` | Tài liệu + TOC trái | P0004 `features/overview/` + `overview-toc.css` | App layout (not packaged yet) |
| `workspace-composer` | Soạn thảo (list \| editor) | P0020 `NotesWorkspaceScreen` | `FilterBar` + app rails |
| `dashboard` | Dashboard (time + charts) | P0008 Dashboard **after Hub retrofit** | `HubDirectoryScreen` + charts |
| `system-panels` | System sub-tabs + panels | P0004 `SystemHubScreen` | `HubTabChrome` + `HubPanel` |
| `inbox-split` | Inbox master-detail | P0006 `InboxScreen` | `HubTabChrome` + `bodyFlex` |
| `auth-gate` | Login / gate | P0020 `NotesAuthGate` | App-only |

Types: `src/ui-template-types.ts` → `HubUiTemplate`, `GOLDEN_SOURCES`.

---

## `directory` — golden checklist

**Do**

- Use `HubDirectoryScreen` (or app `TabScreenChrome` that wraps it + product header).
- `FilterBar` with `layout="hub"`, faceted counts, `ViewToggle` + `HubResultCount` in toolbar.
- Body: `HubDataTable` or `HubDirectoryCard` in `card-grid` — not ad-hoc `hub-card` divs.
- Optional: KPI row + mini charts above section rule (`HubTabScreenBody` props).

**Do not**

- Copy `UserManagementScreen.tsx` wholesale into another repo.
- Local duplicate of `ViewToggle` (fix Vite cache with `dev:force`, do not fork).
- Inline sticky chrome (`hub-chrome-sticky` manual stack) when `HubDirectoryScreen` exists.

**Parity verify**

```bash
node E:/Dev/Tool/scripts/hub-ui-parity-check.mjs --code P0006 --screen groups --template directory
```

Side-by-side: Hub :5176 Users vs target screen.

---

## Manifest `uiScreens`

```json
"uiScreens": [
  { "screen": "bots", "template": "directory", "golden": "P0006/bots" },
  { "screen": "overview", "template": "analytics", "golden": "P0006/overview" },
  { "screen": "notes", "template": "workspace-composer", "golden": "P0020/notes" }
]
```

Schema: `Tool/schemas/tool-manifest.schema.json`  
Catalog defaults: `Tool/schemas/ui-screens.catalog.json`

Agent: read `template` before `sync-hub-ui-screen.cjs`.

---

## Clone workflow (agent)

1. Read `uiScreens` for target screen → `template` + `golden`.
2. Run `node Tool/scripts/sync-hub-ui-screen.cjs P00xx <screen>`.
3. Implement layer B using package exports from `GOLDEN_SOURCES[template]`.
4. Run `hub-ui-parity-check.mjs`.
5. Browser verify Hub vs target (header, filter sticky, table row height, KPI `mt-5`).

---

## Anti-patterns

| Anti-pattern | Why it drifts |
|--------------|----------------|
| Sync CSS only | Layer 3 JSX still hand-rolled |
| Mix `analytics` layout with TOC left | Wrong template |
| Two hubs: P0004 src + package not synced | Forgot `sync-hub-ui-vendor.cjs` |
| `components/hub/` local forks | Bypass package |

---

## Related

- `.cursor/skills/sync-p0004-ui-shell/SKILL.md`
- `.cursor/rules/p0004-hub-ui-standard.mdc`
- `Tool/scripts/sync-hub-ui-screen.cjs`
