# P0004 Tool Hub — Agent catalog (Hub UI + workspace agent context)

**Design source:** this repo (`src/components/sales-shell`, `features/hub`).  
**UI trong app:** System → **Agent** (manifest build từ workspace rules/skills/commands).  
**Một lệnh gộp:** Cursor **`/hub-ui`** — không cần @ từng file.

---

## Command bundles (gọi một lúc)

| Cursor command | Script | Đọc gì (agent) | Chạy gì |
|----------------|--------|----------------|---------|
| **`/hub-ui`** | `node Tool/scripts/hub-ui-stack.cjs` | AGENTS.md + `p0004-hub-ui-standard.mdc` + `sync-p0004-ui-shell/SKILL.md` + `packages/hub-ui/README.md` | vendor sync + `agent:manifest` |
| **`/hub-ui P0006 overview`** | `hub-ui-stack.cjs P0006 overview` | Cùng trên | + `sync-hub-ui-screen.cjs` + layer 3 checklist |
| **`/sync-hub-ui P0006 overview`** | `sync-hub-ui-screen.cjs` only | `hub-ui.md` / AGENTS § Layer 3 | vendor + theme + tsc |
| **`/hub-ui catalog`** | — | Chỉ bảng dưới | Không sửa code |

```powershell
# Terminal (không cần Cursor)
cd E:\Dev\Tool\P0004-Tool-Hub
pnpm hub-ui:stack
pnpm hub-ui:stack -- P0006 overview   # nếu thêm wrapper; hoặc:
node E:\Dev\Tool\scripts\hub-ui-stack.cjs P0006 overview
```

---

## Rules (`.cursor/rules/`)

| File | Always apply | Khi nào dùng |
|------|--------------|--------------|
| **`p0004-hub-ui-standard.mdc`** | No | **Entry Hub UI** — clone shell, `/hub-ui`, 3 layers |
| `dev-workspace-compact.mdc` | Yes | Mọi task workspace (version, 3 đề xuất, browser) |
| `dev-workspace.mdc` | No | Chi tiết §0–§7, ship, Hub UI pointer |
| `p0006-aichathub.mdc` | No (globs P0006) | Domain P0006 — không thay rule Hub UI |

---

## Skills (`.cursor/skills/`)

| Skill | Trigger (tóm tắt) |
|-------|---------------------|
| **`sync-p0004-ui-shell`** | đồng bộ / clone / làm giống P0004 UI, FilterBar, loading Hub |
| `sync-p0004-ui-shell/reference.md` | Manifest file paths, § Clone 100%, data loading |
| `p00xx-ship-keywords` | Git / Push / Release + mã P00xx |
| `p00xx-release-workflow` | Release/deploy tool |
| `browser-verify-until-done` | Fix UI đến khi browser pass |
| `workspace-design-preview-gate` | Chỉ khi user yêu cầu 5 design mẫu |
| `tool-icon-identity-workflow` | Scan/thiết kế icon tool |

**Subagent (tùy chọn):** `.cursor/agents/p0004-ui-sync.md` — trùng skill `sync-p0004-ui-shell`; ưu tiên **`/hub-ui`**.

---

## Code dùng chung

### Package `@tool-workspace/hub-ui`

| Path | Vai trò |
|------|---------|
| **`E:\Dev\packages\hub-ui`** | Source chính (P0006 `workspace:*`) |
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

Mẫu đầy đủ: `Tool/P0006-AIChatHub/apps/console` (`TabScreenChrome.tsx`, `hub-ui-setup.ts`).

---

## Keyboard shortcuts (Hub standard)

| Key | Action |
|-----|--------|
| **F** | Focus tab search |
| **N** | Add / create (when screen registers `onNew`) |
| **E** | Edit / action on selection (Users → Edit; Hub → Refresh selected) |
| **Esc** | Close modal |

Doc: `docs/HUB-KEYBOARD-SHORTCUTS.md` · code: `packages/hub-ui/src/keyboard/` · System → Agent toolbar: `HubKeyboardHints`.

---

## Verify

| App | URL |
|-----|-----|
| P0004 Hub | http://127.0.0.1:5176/ |
| P0006 | http://127.0.0.1:5178/?screen=overview |
| P0020 | http://127.0.0.1:5177/ |

Header, KPI `mt-5`, section-rule pill, filter sticky, `hub-users-table` row height.

---

## Working rules (mọi task — agent không được quên)

| Lớp | Cơ chế |
|-----|--------|
| **Always Apply** | `.cursor/rules/dev-workspace-compact.mdc` §1 |
| **Hooks** | `audit-agent-response.ps1` → `verify-working-rules-on-stop.ps1` (max 2 follow-up) |
| **Human checklist** | `.cursor/README-RULES.md` |

**Mỗi reply:** tiếng Việt · cuối reply **`1.` `2.` `3.`** · dòng cuối **`Version:`** — kể cả task ngắn.  
**§0:** bump + CHANGELOG khi sửa `Tool/P00xx` / `Extension/E00xx`. Thực hiện đề xuất khi **ok 1**, **ok 1 2**, …

Stub: `Rules/rules/Working_Rules.md` (không cần @).

---

## Trong UI P0004 (System → Agent)

Sau `pnpm agent:manifest` hoặc `pnpm hub-ui:stack`:

- Filter **Kind → Command** — `/hub-ui`, `/sync-hub-ui`, …
- Search **`hub-ui`** — rules, skills, scripts, `AGENTS.md`, package README

*Không có panel bundle riêng trên UI — command rows trong bảng là đủ.*
