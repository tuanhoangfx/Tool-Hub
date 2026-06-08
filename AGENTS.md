# P0004 Tool Hub — Agent catalog (Hub UI + workspace agent context)

**Design source:** this repo (`src/components/sales-shell`, `features/hub`).  
**UI trong app:** System → **Agent** (`pnpm agent:manifest` → `public/agent-manifest.json`).  
**Hub UI doc:** `packages/hub-ui/README.md` — scripts only, no Cursor sync-ui skill/rule.

---

## Hub UI — one command

```powershell
cd E:\Dev\Tool\P0004-Tool-Hub
pnpm hub-ui:stack                              # vendor + manifest
node E:\Dev\Tool\scripts\hub-ui-stack.cjs P0016 overview   # + screen scaffold
```

Then: finish layer 3 in target app · `hub-ui-css-check.mjs` · `hub-ui-parity-check.mjs`.

---

## Workspace agent stack (repo = source of truth)

| Layer | Path |
|-------|------|
| Rule | `.cursor/rules/dev-workspace-compact.mdc` (Always Apply) |
| Commands | `.cursor/commands/*.md` → `/ship`, `/onboard-tool`, `/bump-version`, `/design-5` |
| Skills | `.cursor/skills/*/SKILL.md` — `ship-until-done`, `p00xx-ship-keywords`, `p00xx-clone-hub-shell`, `p00xx-tool-onboard` |
| Subagents | `.cursor/agents/*.md` (2) |
| Playbooks | `Tool/docs/playbooks/*.md` |
| Ship script | `Tool/scripts/ship-product.ps1` |

**Refresh Agent tab:** `pnpm agent:manifest` or System → Agent → Refresh.  
**Not in manifest:** Cursor Settings UI commands / bundled `electron-pro` subagents — see `.cursor/CURSOR-SETTINGS-CLEANUP.md`.
| P0016 domain | `.cursor/rules/p0006-aichathub.mdc` (globs — rename when rule file updated) |

---

## Code dùng chung

### Package `@tool-workspace/hub-ui`

| Path | Vai trò |
|------|---------|
| **`E:\Dev\packages\hub-ui`** | Source chính (P0016 `workspace:*`) |
| `Tool/P0004-Tool-Hub/vendor/hub-ui` | Bản copy P0004/P0020 (`file:./vendor/hub-ui`) |

**API:** `packages/hub-ui/README.md`

| Export | Layer |
|--------|-------|
| `AppTabHeader`, `FilterBar`, `HubTabChrome`, `KpiStrip`, `HubDisplayPrefs` | 1 Shell |
| `HubTabScreenBody`, `HubDataTable`, `HubPanel`, `HubDirectoryCard`, `HubAlert` | 3 Content |
| CSS: `hub-shell-layout`, `hub-app-tab-header`, `hub-users-table`, … | 2 |

**Refresh từ P0004 shell edits:**

```powershell
node E:\Dev\Tool\scripts\sync-hub-ui-vendor.cjs
```

Content/components chỉ ở `packages/hub-ui` — script cũng fan-out từ đó.

### Scripts (`Tool/scripts/`)

| Script | Mục đích |
|--------|----------|
| **`hub-ui-stack.cjs`** | Vendor + agent manifest (+ optional screen) |
| `sync-hub-ui-screen.cjs` | Clone 1 tool/screen: vendor + theme + tsc + checklist |
| `sync-hub-ui-vendor.cjs` | P0004 shell → `packages/hub-ui` + `vendor/hub-ui` |
| `sync-hub-theme-from-p0004.cjs` | Theme + `styles/*` → app `src/` |
| `ship-product.ps1` | Git / Push / Release |

### P0004 scripts (repo này)

| Script | Mục đích |
|--------|----------|
| **`pnpm agent:manifest`** | Build `public/agent-manifest.json` (System → Agent tab) |
| **`pnpm hub-ui:stack`** | `hub-ui-stack.cjs` + manifest |
| `pnpm open` | Dev :5176 (daemon) |
| `pnpm scan:local` | Workspace registry |

### Packages khác

| Package | Path | Dùng cho |
|---------|------|----------|
| `@dev/hub-load` | `Tool/packages/hub-load` | Prefetch, cache helpers (P0004 boot) |

### P0004 canonical paths (layer 3 reference)

| Pattern | Path |
|---------|------|
| Hub list | `src/features/hub/HubListPage.tsx` |
| Users table | `src/features/identity/UserDirectoryTable.tsx`, `hub-users-table.css` |
| System | `src/features/system-hub/SystemHubScreen.tsx` |
| Filters | `src/lib/badge-registry.ts`, `filter-option-counts.ts` |
| Agent tab data | `scripts/sync-agent-manifest.mjs` → `public/agent-manifest.json` |

---

## Ba lớp clone (100% pixel)

| Lớp | Tự động? | Cách đạt |
|-----|----------|----------|
| **1 Shell** | Một phần (`sync-hub-ui-vendor`) | `HubTabChrome`, `FilterBar`, header, DisplayPrefs adapter |
| **2 CSS** | `sync-hub-theme-from-p0004.cjs` | `p0008-globals`, `styles/*`, hub-ui CSS imports |
| **3 JSX** | **Không** — agent sửa screen | `HubTabScreenBody`, `HubDataTable`, `HubPanel` |

---

## Cài hub-ui vào tool mới

```json
"@tool-workspace/hub-ui": "workspace:*"
```

```ts
// vite — alias tới packages/hub-ui/src
import { setupHubUi } from "./lib/hub-ui-setup"; // configureFilterIcons + chrome prefs
```

Mẫu đầy đủ: `Tool/P0016-ChatCenter/src` (`HubTabChrome`, `hub-ui-setup.ts`).

---

## Keyboard shortcuts (Hub standard)

| Key | Action |
|-----|--------|
| **F** | Focus tab search |
| **Ctrl+Q** | Clear search + filters (works in search input too) |
| **S** | Open tab header Settings panel |
| **N** | Add / create (when screen registers `onNew`) |
| **E** | Edit / action on selection (Users → Edit; Hub → Refresh selected) |
| **Esc** | Close modal |

Doc: `docs/HUB-KEYBOARD-SHORTCUTS.md` · code: `packages/hub-ui/src/keyboard/` · app: `useHubActiveScreenSync(screen, systemTab)`.

---

## Verify

| App | URL |
|-----|-----|
| P0004 Hub | http://127.0.0.1:5176/ |
| P0016 | http://127.0.0.1:5186/inbox |
| P0020 | http://127.0.0.1:5177/ |

Header, KPI `mt-5`, section-rule pill, filter sticky, `hub-users-table` row height.

---

## Working rules

**Single rule:** `.cursor/rules/dev-workspace-compact.mdc` (Always Apply) · hooks in `.cursor/hooks.json`

---

## Trong UI P0004 (System → Agent)

Sau `pnpm agent:manifest` hoặc `pnpm hub-ui:stack`:

- Search **`hub-ui`** — scripts, `AGENTS.md`, `packages/hub-ui/README.md`
- Ship: **`/ship`** or keyword `Release P0004`

*Không có panel bundle riêng trên UI — command rows trong bảng là đủ.*
