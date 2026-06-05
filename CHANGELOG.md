# Changelog

## 2026-06-05 - Git commit version stamp

- Version: `5.1.2`
- Timestamp: 2026-06-05 08:23 (UTC+7)
- Commit: pending
- Type: Patch
- Status: Draft

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-05 - Workspace ship 4-tier + browser verify all tools

- Version: `5.1.1`
- Type: Major
- Product: P0004
- Prompt: ok 1 2 3 — Push WIP, fix blockers, Release Major, browser-verify-until-done
- Commit: pending
- Status: Draft

### Changes

- Ship pipeline: Git / Push / Deploy / Release (4 tiers); `ship-product.ps1` Deploy + skip build when no script.
- `verify-production-smoke.mjs`: redirect chain + Vercel 307 soft-OK.
- Hub UI WIP pushed; agent-manifest + workspace catalog synced.

### Verification

- `corepack pnpm build` — passed
- Browser: 16/16 local dev URLs probed OK; 15/16 MCP verify pass (P0002 Electron preload)

---

## 2026-06-05 - MiniDonut grid parity with bar charts

- Version: `4.2.10`
- Type: Patch
- Product: P0004

### Changes

- MiniDonut uses the same 3-column grid as `hub-chart-row`: labels column 1, donut `justify-self: end` column 2, counts column 3 (right edge).

---
## 2026-06-05 - Hub Manifest/Links columns + donut layout + Local icon

- Version: `4.2.9`
- Type: Patch
- Product: P0004

### Changes

- Hub tools table: **Manifest** (missing/full links) and **Links** (quick actions) as separate columns.
- MiniDonut: legend left (`hub-chart-row`), donut on the right — same rhythm as bar charts.
- **Local** category: `HardDrive` icon in By Category chart and code badges.

### Verification

- Browser: Hub table + chart band

---
## 2026-06-05 - Keyboard shortcuts on all System sub-tabs

- Version: `4.2.8`
- Type: Patch
- Product: P0004

### Changes

- `useHubActiveScreenSync` + `hubSystemShortcutScope` — F / Ctrl+Q / S work on every System tab with FilterBar (Overview, Schema, Quota, Server, Agent).
- App shell tracks `systemTab` from URL; scope matches `SystemHubShell` FilterBar registration.

### Verification

- `pnpm exec tsc --noEmit` — pass
- Browser: System → Schema — F focus search — pass

---
## 2026-06-05 - Remove Agent tab keyboard hints bar

- Version: `4.2.7`
- Type: Patch
- Product: P0004

### Changes

- System → Agent: remove `HubKeyboardHints` from filter toolbar (shortcuts still work; no on-screen legend).

---
## 2026-06-05 - Hub tools table column spacing (Agent parity)

- Version: `4.2.6`
- Type: Patch
- Product: P0004

### Changes

- Hub directory table: `hub-users-table--hub-tools` colgroup + % column widths (Agent model), `min-width: 72rem`, `overflow-x-auto`, cell `overflow: hidden`; Links cell uses full column width.

### Verification

- Browser: Hub table view — columns no longer overlap

---
## 2026-06-05 - Clear shortcut: C → Ctrl+Q

- Version: `4.2.5`
- Type: Patch
- Product: P0004

### Changes

- Hub clear search/filters: **Ctrl+Q** (was **C**) in `hub-keyboard-shortcuts.ts` + docs.

### Verification

- `pnpm exec tsc --noEmit` — pass

---
## 2026-06-05 - Hub keyboard shortcuts C / S + system tab scope

- Version: `4.2.4`
- Type: Patch
- Product: P0004

### Changes

- Sync `@tool-workspace/hub-ui` keyboard module: **C** clear search/filters, **S** open tab Settings.
- `FilterBar` registers clear handler; `HubDisplayPrefs` registers Settings open (non-global scope).
- `setHubActiveScreen` uses `system-<tab>` when on System so **F** / **C** match `FilterBar` scope.

### Verification

- `pnpm exec tsc --noEmit` — pass
- Browser: Hub F/C/S; System → Agent F — pass

---
## 2026-06-05 - Git commit version stamp

- Version: `4.3.2`
- Timestamp: 2026-06-05 07:01 (UTC+7)
- Commit: `507a942`
- Type: Patch
- Status: Draft

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-05 - Retire P0005, sync ship docs and catalog

- Version: `4.3.1`
- Type: Minor
- Product: P0004
- Prompt: ok 1 2 3 — xóa P0005, gỡ script legacy P0007, Push doc cleanup
- Commit: `507a942`
- Status: Draft

### Changes

- Removed **P0005-zalo-ai-bot** from workspace; catalog/registry/ports no longer list P0005.
- Refreshed `agent-manifest`, `tools-launch`, `vps-inventory`, workspace snapshots via `scan:local`.
- Deleted Hub icon `public/icons/tools/P0005.svg`.

### Verification

- `corepack pnpm scan:local` — 19 projects, no P0005 entry
- `powershell -File Tool/scripts/ship-product.ps1 -Code P0004 -Keyword Push`

---

## 2026-06-05 - Remove P0017 ChatHubAI

- Version: `4.2.3`
- Type: Patch
- Product: P0004
- Prompt: Xóa Tool/P0017-ChatHubAI
- Commit: `e4aa5fc`
- Status: Committed

### Changes

- Deleted `P0017-ChatHubAI` folder and port **5181** from `workspace-ports.json`.
- Removed P0017 from Hub catalogs (`workspace-catalog`, `registry`, `local-registry`) and P0014-Hub-Shell mirrors.
- Extended snapshot guard (`sync-workspace-snapshots.cjs`) for P0017 / port 5181.
- Stopped P0016 Vite and P0004/P0006 dev briefly to clear shared pnpm hardlinks during folder delete.

### Verification

- Chat/API remains on **P0006-AIChatHub**; thin consoles: **P0016-ChatCenter**, **P0014-Hub-Shell**.

---

## 2026-06-05 - Git commit version stamp

- Version: `4.2.2`
- Timestamp: 2026-06-05 04:28 (UTC+7)
- Commit: `7d1a6b8`
- Type: Patch
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-05 - Remove P0018 and P0024 tools

- Version: `4.2.1`
- Type: Patch
- Product: P0004
- Prompt: Xóa Tool/P0018-AI-Project-Manager và Tool/P0024-ChatHubAI
- Commit: `7d1a6b8`
- Status: Draft

### Changes

- Deleted `P0018-AI-Project-Manager` (:5188) and `P0024-ChatHubAI` (:5180).
- Removed from `workspace-ports.json`, `TOOL-CODES.md`, Hub catalogs, snapshot guard.
- Stopped related Vite instances (shared pnpm rollup hardlink with P0017/P0016/P0014-Hub-Shell).

### Verification

- `Test-Path` both folders → false
- `node ../scripts/sync-workspace-snapshots.cjs`

### Rollback

- Re-clone from GitHub if needed.

---

## 2026-06-05 - Hub dev recover (esbuild / Vite crash)

- Version: `4.1.5`
- Type: Patch
- Product: P0004
- Prompt: Xử lý triệt để lỗi `[plugin:vite:esbuild] The service is no longer running` trên :5176
- Status: Local fix

### Changes

- Moved `vps-inventory.json` import to `src/data/` (Vite 7 forbids importing from `public/`).
- Added `dev:recover` / `ensure-dev --recover` (kill :5176 + clear `node_modules/.vite` + restart).
- Dev API `POST /api/hub-dev/recover` and Hub button **Restart Hub dev** (dev only).
- Vite `optimizeDeps` + `esbuild.target` for stabler transforms on `vendor/hub-ui`.

### Verification

- `node scripts/dev-recover.cjs` → Hub ready on :5176
- Reload `http://127.0.0.1:5176/` — no esbuild overlay

### Rollback

- Revert `SystemServerPanel` import path; remove recover middleware and scripts.

Version: 4.1.4 → 4.1.5

---

## 2026-06-05 - Remove P0014-ChatHubAI permanently

- Version: `4.1.4`
- Type: Patch
- Product: P0004
- Prompt: Xóa hoàn toàn Tool/P0014-ChatHubAI
- Commit: `98c02cf`
- Status: Committed

### Changes

- Deleted folder `Tool/P0014-ChatHubAI` (port 5184 freed).
- Removed P0014 from `workspace-ports.json`, `TOOL-CODES.md`, Hub catalogs and `workspace-snapshots`.
- Snapshot guard extended for P0014 / port 5184 / `chathub-ai` catalog id.

### Verification

- `Test-Path P0014-ChatHubAI` → false
- `node ../scripts/sync-workspace-snapshots.cjs`

### Rollback

- Re-clone `tuanhoangfx/chathub-ai` if a dedicated ChatHub console is needed again.

---

## 2026-06-05 - Git commit version stamp

- Version: `4.1.3`
- Timestamp: 2026-06-05 02:02 (UTC+7)
- Commit: `37cef95`
- Type: Patch
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-05 - Remove P0003-ChatHubAI permanently

- Version: `4.1.2`
- Type: Patch
- Product: P0004
- Prompt: Xóa hoàn toàn Tool/P0003-ChatHubAI
- Commit: `37cef95`
- Status: Draft

### Changes

- Deleted folder `Tool/P0003-ChatHubAI` (freed port 5180; stopped ensure-dev P0003 / shared rollup lock).
- Removed P0003 from `workspace-ports.json`, `TOOL-CODES.md`, Hub catalogs (`workspace-catalog`, `registry`, `local-registry`).
- Refreshed `workspace-snapshots`; fixed snapshot guard (no false positive on P0014 ChatHubAI).
- P0014 registry usage: `ensure-dev-product.cjs P0014` (replaces P0003).

### Verification

- `Test-Path P0003-ChatHubAI` → false
- `node ../scripts/sync-workspace-snapshots.cjs`

### Rollback

- Restore from git history or re-clone `tuanhoangfx/chathub-ai` as new code if needed (use P0014 instead).

---

## 2026-06-05 - Tool Hub 4.1 — agent catalog and workspace mirror

- Version: `4.1.1`
- Type: Major
- Product: P0004
- Prompt: Release P0004, P0020, E0001
- Commit: `23fdea4`
- Status: Verified
- Release: https://github.com/tuanhoangfx/Tool-Hub/releases/tag/v4.1.1

### Changes

- Agent tab manifest sync scans full `.cursor` stack (commands, agents, playbooks, ship scripts).
- Subagent kind filter and sort on Agent catalog.
- Supabase quota catalog snapshot refresh for Hub registry.

### Verification

- `corepack pnpm build` in P0004-Tool-Hub
- Production smoke via `verify-production-smoke.mjs`

### Rollback

- Revert to `v3.2.2` tag

---

## 2026-06-05 - Git commit version stamp

- Version: `3.2.2`
- Timestamp: 2026-06-05 01:16 (UTC+7)
- Commit: `482b60d`
- Type: Patch
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-05 - Agent manifest: full cursor stack scan

- Version: `3.2.1`
- Timestamp: 2026-06-05
- Type: Minor
- Product: P0004
- Prompt: ok 1 2 3 — verify Agent tab, Git P0004 (manifest + Subagent kind)
- Commit: `482b60d`
- Status: Draft

### Changes

- `sync-agent-manifest.mjs` — scan all `.cursor/commands`, `agents/`, playbooks, `ship-product.ps1` (bỏ lọc hub-only).
- Agent tab — kind `agent` (Subagent), filter Kind + sort.
- `.cursor/README.md`, `CURSOR-SETTINGS-CLEANUP.md` — workflow repo vs Settings.

### Verification

- `node scripts/sync-agent-manifest.mjs` → 32 items (10 cursor-tagged)
- `pnpm exec tsc --noEmit` in P0004-Tool-Hub

### Rollback

- `git checkout v3.1.2`

---

## 2026-06-05 - Workspace snapshots mirror (schemas + ports)

- Version: `3.1.2`
- Timestamp: 2026-06-05
- Type: Patch
- Product: P0004
- Prompt: Dọn workspace ngoài repo — sync Tool/schemas và workspace-ports vào Hub git
- Commit: `cd33e1c`
- Status: Committed

### Changes

- `Tool/scripts/sync-workspace-snapshots.cjs` — mirror `schemas/*.json`, `workspace-ports.json`, `TOOL-CODES.md` → `public/workspace-snapshots/`.
- `pnpm sync:snapshots` — guard không cho phép P0003/chathubai trong snapshot.
- Catalog scanner vẫn đọc source `E:\Dev\Tool\`; snapshot chỉ để audit/version control trên GitHub.

### Verification

- `node ../scripts/sync-workspace-snapshots.cjs` · grep P0003 trong snapshots → 0

### Rollback

- `git revert <sha>`

---

## 2026-06-05 - Release: https://github.com/tuanhoangfx/Tool-Hub/releases/tag/v3.1.1

- Version: `3.1.1`
- Timestamp: 2026-06-05
- Type: Major
- Product: P0004
- Prompt: Release P0004 — xóa ChatHubAI, đồng bộ registry/Agent manifest, deploy infi.io.vn
- Commit: `cd24c90`
- Status: Verified
- Release:

### Changes

- Gỡ **P0003 ChatHubAI** khỏi workspace catalog, Supabase map, agent-manifest clone lists.
- Agent tab: Kind cleanup, pattern rows, manifest sync (`agent-manifest-sync`, `sync-agent-manifest.mjs`).
- Hub UI vendor: FilterBar parity, confirm dialogs, system-hub agent context table.
- Registry schema: `deployTarget` **cloudflare** (P0011 Infix1 Mail).

### Verification

- `pnpm build` · `verify-production-smoke.mjs` · https://infi.io.vn/

### Rollback

- `git checkout v2.2.2` hoặc `git revert <sha>`

---

## 2026-06-05 - Git commit version stamp

- Version: `2.2.2`
- Timestamp: 2026-06-05 00:50 (UTC+7)
- Commit: `eab7bd9`
- Type: Patch
- Status: Draft

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-05 - Remove P0003 ChatHubAI from workspace catalog

- Version: `2.2.1`
- Timestamp: 2026-06-05
- Type: Minor
- Product: P0004
- Prompt: Xóa P0003-ChatHubAI; Git P0004 registry + rà Supabase orphan
- Commit: `eab7bd9`
- Status: Draft

### Changes

- Gỡ card **ChatHubAI** (`chathubai` / `P0003`) khỏi `workspace-catalog.json`, `registry.default.json`, `local-registry.json`.
- Gỡ binding **chathubai** khỏi `supabase-workspace-map.json` (project `fmnrafpzctuhxjaaomzt`).
- Cập nhật `agent-manifest.json` clone lists — bỏ tham chiếu P0003.

### Verification

- `node` service-role: `hub_tools` / `tool_access` không có row `P0003`.
- `pnpm build`

### Rollback

- `git revert <sha>` hoặc khôi phục thư mục `Tool/P0003-ChatHubAI` từ git history.

---

## 2026-06-04 - Agent Kind cleanup; remove Dashboard/Inbox patterns

- Version: `2.1.35`
- Timestamp: 2026-06-04
- Type: Patch
- Status: Draft

### Changes

- Removed Agent patterns **Dashboard**, **Inbox** → `deferredPatterns` (chuẩn hóa sau).
- Kind gộp: **doc** (`contract`+`file`), **command** (+ hub scripts); bỏ `script`, `contract`, `file`.
- Layer filter: chỉ **Screen** / **Modal**.
- Manifest: bỏ hub-ui README trùng UI_PATTERNS; bỏ skill/reference row trùng.

### Verification

- `pnpm agent:manifest` · Kind filter 5 mục · 6 pattern rows.

---

## 2026-06-04 - Dashboard + System: fewer Agent patterns (composed in-screen)

- Version: `2.1.34`
- Timestamp: 2026-06-04
- Type: Patch
- Status: Draft

### Changes

- **Dashboard:** merged analytics + sales → one pattern **Dashboard**, golden **P0008/dashboard**; P0006/dashboard = clone. Template alias `analytics` → `dashboard`.
- **System:** renamed **System**; Agent meta table + Supabase quota folded into `panels[]` / `composed[]` — no separate wide-metrics / meta-list Agent rows.
- **Overview + TOC:** tool links table composed in-screen (no panel-links-table row).
- Agent manifest ~**39** pattern rows (was ~43).

### Verification

- `pnpm agent:manifest` · Pattern Dashboard golden P0008 · one System row · no table-part patterns.

---

## 2026-06-04 - Directory: one pattern (card + table via ViewToggle)

- Version: `2.1.33`
- Timestamp: 2026-06-04
- Type: Patch
- Status: Draft

### Changes

- Pattern **`directory`** renamed **Directory** (not “card + table” / “card-only” split).
- Removed `exceptions[]` / Agent row `directory-card-only`; P0006/channels → **directory clone** (card view today).
- Docs + `ui-screens` registry: ViewToggle = card ↔ table, single golden `HubListPage`.

### Verification

- `pnpm agent:manifest` · one Directory pattern · Clone includes P0006/channels.

---

## 2026-06-04 - Agent Kind Pattern + Layer (unified ui-patterns catalog)

- Version: `2.1.32`
- Timestamp: 2026-06-04
- Type: Patch
- Status: Draft

### Changes

- Unified Hub UI catalog: `Tool/schemas/ui-patterns.catalog.json` replaces separate table/screen/component Agent rows.
- Agent manifest: Kind **pattern** + field **layer** (screen | table-part | modal | exception); column **Layer** in Agent table.
- Filters: Kind Pattern + Layer; removed Table / Screen / Component kinds.
- Contract row: `UI_PATTERNS.md` only (no UI_TABLES / UI_COMPONENTS / clone-registry contract duplicates).
- Deprecated: `ui-tables.catalog.json`, `ui-components.catalog.json` (pointer to ui-patterns); vendor sync fans out `UI_PATTERNS.md`.

### Verification

- `pnpm agent:manifest` · filter Kind Pattern · Layer Screen / Table part · directory golden + clones.

---

## 2026-06-04 - Agent Kind Screen (replace Template Contract)

- Version: `2.1.31`
- Timestamp: 2026-06-04
- Type: Patch
- Status: Draft

### Changes

- Screen templates: Kind **screen** (not contract) with Golden/Clone from `hubUiCloneRegistry`.
- Path → golden screen file (e.g. `ToolOverviewContent.tsx`).
- `document-toc` links table pattern **panel-links-table**; Overview TOC row Golden `P0004/overview-toc`.

### Verification

- `pnpm agent:manifest` · filter Kind Screen · Overview + TOC left.

---

## 2026-06-04 - Agent Lines column; manifest sync on Refresh

- Version: `2.1.30`
- Timestamp: 2026-06-04
- Type: Patch
- Status: Draft

### Changes

- Agent table: **Lines** sortable column (removed from Scope cell).
- Dev: `POST /api/agent/manifest-sync` — toolbar **Refresh** + sidebar Refresh rebuild `agent-manifest.json` then reload.

### Verification

- Vite dev → System → Agent → Refresh; sidebar Refresh on Agent tab.

---

## 2026-06-04 - Auth golden P0004/auth; clone registry; drop redundant components

- Version: `2.1.29`
- Timestamp: 2026-06-04
- Type: Patch
- Status: Draft

### Changes

- Auth gate golden → **P0004/auth** (`HubAuthGate.tsx`); P0020 `NotesAuthGate` = clone.
- `ui-screens.catalog.json` → `hubUiCloneRegistry` (audit P0003–P0008, P0020 + tools without Hub UI).
- Removed component patterns **AppTabHeader**, **Agent detail modal** (composed in directory-table / meta-list-table).
- Directory-table `composedChrome`; P0003 library/users added as clones.

### Verification

- `pnpm agent:manifest` · Kind Component → 6 rows; Auth gate Golden = P0004/auth.

---

## 2026-06-04 - Agent table: Golden + Clone columns; component patterns

- Version: `2.1.28`
- Timestamp: 2026-06-04
- Type: Patch
- Status: Draft

### Changes

- Agent context table: sortable **Golden** and **Clone** columns (from manifest).
- `ui-components.catalog.json` → `patterns[]` (same model as tables).
- `sync-agent-manifest.mjs` emits `golden`, `clone`, `cloneTooltip` on pattern rows.

### Verification

- `pnpm agent:manifest` · System → Agent → filter Kind Table/Component.

---

## 2026-06-04 - Table catalog: patterns + golden/clones (not per-screen names)

- Version: `2.1.27`
- Timestamp: 2026-06-04
- Type: Patch
- Status: Draft

### Changes

- `ui-tables.catalog.json` — `patterns[]` (e.g. `directory-table`); Hub tools = golden; Bots/2FA/Users = `clones[]` only.
- Agent manifest + `UI_TABLES.md` — 4 table patterns + 1 exception (not 12 named tables).

### Verification

- `pnpm agent:manifest` — Kind Table shows Directory table + clones in body.

---

## 2026-06-04 - UI catalogs: tables, components, screen templates

- Version: `2.1.26`
- Timestamp: 2026-06-04
- Type: Patch
- Status: Draft

### Changes

- `ui-tables.catalog.json` — 12 table goldens + `goldenScreenPath` (directory → `HubListPage`); P0020 cookie/2FA; P0008 legacy migrate rows.
- `ui-components.catalog.json` + `UI_COMPONENTS.md` — FilterBar, modals, chrome; Agent kind **component**.
- `ui-screens.catalog.json` — `templates[]` with golden screen paths; P0020 `cookie` screen.
- Golden scaffolds: `GoldenSystemPanelsScreen`, `GoldenAuthGateScreen`; FilterBar canonical in `packages/hub-ui`.
- `sync-agent-manifest.mjs` — component + screen template rows in Agent tab.

### Verification

- `pnpm agent:manifest` · `node Tool/scripts/sync-hub-ui-vendor.cjs` · `pnpm exec tsc --noEmit`

---

## 2026-06-04 - Git commit version stamp

- Version: `2.1.22`
- Timestamp: 2026-06-04 00:57 (UTC+7)
- Commit: `8cb47c0`
- Type: Patch
- Status: Draft

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-04 - Git commit version stamp

- Version: `2.1.21`
- Timestamp: 2026-06-04 00:49 (UTC+7)
- Commit: `5c04f26`
- Type: Patch
- Status: Draft

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-04 - Git commit version stamp

- Version: `2.1.20`
- Timestamp: 2026-06-04 00:38 (UTC+7)
- Commit: `4685174`
- Type: Patch
- Status: Draft

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-03 - Hub identity: User ID login, link email, admin reset

- Version: `2.1.19`
- Type: Patch
- Product: P0004
- Prompt: Đăng ký ID|Pass, liên kết mail, đổi pass OTP; admin Add/reset user
- Commit: `4685174`
- Status: Draft

### Changes

- Sign in/up with **User ID** or email (`hub-login.ts`, `HubAuthGate`).
- Account modal: link email, change password via 6-digit email OTP (`HubUserModal`).
- Admin: create users by login_id and/or email; bulk `login_id|name|role`; reset password API.
- Migration `20260603120000_hub_login_id.sql` — `profiles.login_id`, `contact_email`.

Version: 2.1.18 → 2.1.19

## 2026-06-03 - Agent tab: Hub table goldens (kind Table)

- Version: `2.1.18`
- Type: Patch
- Product: P0004
- Prompt: Liệt kê loại bảng vào tab Agent như command/skill
- Commit: pending
- Status: Draft

### Changes

- `Tool/schemas/ui-tables.catalog.json` — 6 table goldens + Channels exception.
- `packages/hub-ui/UI_TABLES.md` — human-readable table catalog.
- `sync-agent-manifest.mjs` — kind `table` rows + `UI_TABLES.md` contract.
- Agent UI: filter Kind **Table**, badges/icons, sort order.

Version: 2.1.17 → 2.1.18

## 2026-06-03 - Fix Users screen JSX (missing closing div)

- Version: `2.1.17`
- Type: Patch
- Product: P0004
- Prompt: ok 1 2 3; Vite Expected corresponding JSX closing tag
- Commit: `41dfc3e`
- Status: Committed

### Changes

- `UserManagementScreen.tsx`: close `transition-opacity` wrapper before `</HubDirectoryScreen>`.

Version: 2.1.16 → 2.1.17

## 2026-06-03 - User modal header/profile one row align

- Version: `2.1.16`
- Type: Patch
- Product: P0004
- Prompt: header + form thẳng 1 hàng; Working Rules §1
- Commit: `3a65947`
- Status: Verified
- Release: https://github.com/tuanhoangfx/Tool-Hub/releases/tag/v2.1.16

### Changes

- Header: role badge · avatar · name · email badge — `align-items: center` một hàng.
- Profile row: Display name / Email / Role — `items-end`, control height `var(--hub-control-h)`.

Version: 2.1.15 → 2.1.16

## 2026-06-03 - HubEmailBadge = P0020 2FA mail chip (copy)

- Version: `2.1.15`
- Type: Patch
- Product: P0004
- Prompt: badge mail giống 100% 2FA, copy được
- Commit: pending
- Status: Draft

### Changes

- `CopyMetaChip` + `HUB_EMAIL_COPY_CHIP_CLASS` (sync P0020 Account column).
- `HubEmailBadge`: Mail 11px, sky pill, click copy + check feedback.

Version: 2.1.14 → 2.1.15

## 2026-06-03 - Email badge + filter icons bootstrap

- Version: `2.1.14`
- Type: Patch
- Product: P0004
- Prompt: Mail badge (2FA style); Filter Row icons missing
- Commit: pending
- Status: Draft

### Changes

- `HubEmailBadge` on modal header (cyan Mail pill, like P0020 2FA account chip).
- `configureFilterIcons` in `main.tsx` → `badge-registry` (fixes hub-ui FilterBar/Role dropdown icons).
- Modal Role filter imports `HubSingleFilterDropdown` from `sales-shell` (same as Users tab).

Version: 2.1.13 → 2.1.14

## 2026-06-03 - User modal header + HubSingleFilterDropdown

- Version: `2.1.13`
- Type: Patch
- Product: P0004
- Prompt: Avatar header; role badge left; Role filter 100% FilterBar
- Commit: pending
- Status: Draft

### Changes

- Header: role badge (left) + avatar + name/email stacked.
- `HubSingleFilterDropdown` — same component chrome as Users searchbar Role filter.
- `HubFilterSelect` delegates to `HubSingleFilterDropdown`.

Version: 2.1.12 → 2.1.13

## 2026-06-03 - User modal: Filter layer, TOC section titles

- Version: `2.1.12`
- Type: Patch
- Product: P0004
- Prompt: Layer Filter; TOC labels; remove header duplicate block
- Commit: pending
- Status: Draft

### Changes

- `HubFilterSelect`: portal menu (z 2500), FilterBar trigger `Role: User` + icons.
- Section titles from TOC (`👤 User`, `🧰 Tool access`) — no uppercase.
- Removed avatar/role strip under modal header; tools FilterBar `layout="inline"`.

Version: 2.1.11 → 2.1.12

## 2026-06-03 - Users: modal layout, Filter Role, Add user modal

- Version: `2.1.11`
- Type: Patch
- Product: P0004
- Prompt: User modal 1 dòng; Filter Role; Add tạo user (2FA modal pattern)
- Commit: pending
- Status: Draft

### Changes

- Import `hub-fields.css`; `HubFilterSelect` matches FilterBar (icon + label).
- `UserAccessModal`: Display name / Email / Role one row; remove Supabase hint.
- `UserAddModal` + bulk `email|name|role`; dev `/api/hub/users/create`.
- **Add** opens create modal; **Sync tools** unchanged.

Version: 2.1.10 → 2.1.11

## 2026-06-03 - Git commit version stamp

- Version: `2.1.10`
- Timestamp: 2026-06-03 20:23 (UTC+7)
- Commit: `65a75ab`
- Type: Patch
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-03 - User modal Role dropdown (Filter style)

- Version: `2.1.9`
- Type: Patch
- Product: P0004
- Prompt: Modal User Role select unreadable; chuẩn hóa Filter style
- Commit: `65a75ab`
- Status: Draft

### Changes

- `@tool-workspace/hub-ui`: `HubFilterSelect` single-select dropdown (FilterBar chrome).
- `UserAccessModal`: Role field uses `HubFilterSelect` + `HubRoleBadge` instead of native `<select>`.
- `hub-fields.css`: filter-select + native `select` dark option fallback.

Version: 2.1.8 → 2.1.9

## 2026-06-03 - Fix System → Server tab crash

- Version: `2.1.8`
- Type: Patch
- Product: P0004
- Prompt: lỗi trang trống khi chọn Server; Working Rules
- Commit: pending
- Status: Draft

### Changes

- `system-display-prefs.ts`: import `DEFAULT_HUB_CHART_KEYS` for Server tab display prefs (fixes `ReferenceError` in `AppDisplayPrefs`).

Version: 2.1.7 → 2.1.8

## 2026-06-03 - Fix keyboard shortcuts on Hub tab (scoped by active screen)

- Version: `2.1.7`
- Type: Patch
- Product: P0004
- Prompt: phím tắt không nhận trên tab Hub
- Commit: pending
- Status: Draft

### Changes

- `setHubActiveScreen` + `shortcutScope` on FilterBar; `useHubPageShortcuts("library"|"users")`.

Version: 2.1.6 → 2.1.7

## 2026-06-03 - Server tab Overview clone + P0021 VPS worker off

- Version: `2.1.6`
- Type: Patch
- Product: P0004
- Prompt: P0021 local render only; clone Overview UI on Server tab
- Commit: pending
- Status: Draft

### Changes

- **System → Server:** Overview-style shell (`ToolOverviewContent`, filters, charts) + VPS host snapshot strip.
- **VPS:** removed P0021 `autovideo-studio` docker; inventory snapshot updated.

Version: 2.1.5 → 2.1.6

## 2026-06-03 - Hub keyboard shortcuts F / N / E / Esc

- Version: `2.1.5`
- Type: Patch
- Product: P0004
- Prompt: đồng bộ phím tắt Hub; hiển thị trên tab Agent
- Commit: pending
- Status: Draft

### Changes

- **F** focus search (thay Ctrl+K) — `FilterBar` + `@tool-workspace/hub-ui` keyboard module.
- **N** / **E** — `useHubPageShortcuts` (Users, Hub list); **Esc** modal giữ nguyên.
- Agent tab: `HubKeyboardHints`; `docs/HUB-KEYBOARD-SHORTCUTS.md` + agent manifest.

Version: 2.1.4 → 2.1.5

## 2026-06-03 - System → Server tab (VPS inventory)

- Version: `2.1.4`
- Type: Patch
- Product: P0004
- Prompt: ok 1 2 — VPS cleanup + Server tab
- Commit: pending
- Status: Draft

### Changes

- **System → Server:** static CloudFly inventory (`public/vps-inventory.json`), VPS deploy tools, extras notes, ops script hints.
- VPS (P0006 scripts): disabled `openclaw-gateway` user unit + haygheta timer; 4G swap; kept P0021 autovideo docker.

Version: 2.1.3 → 2.1.4

## 2026-06-03 - AGENTS.md: Working Rules enforcement table

- Version: `2.1.3`
- Type: Patch
- Product: P0004
- Prompt: đảm bảo không quên Rule; rà soát command/rule/skill Hub UI
- Commit: pending
- Status: Draft

### Changes

- `AGENTS.md`: § Working rules — compact gate + hooks + README-RULES checklist.

Version: 2.1.2 → 2.1.3

## 2026-06-03 - Agent tab: remove Hub UI bundles panel

- Version: `2.1.2`
- Type: Patch
- Product: P0004
- Prompt: bỏ khối Hub UI command bundles trên UI; Command kind đủ
- Commit: pending
- Status: Draft

### Changes

- Removed `HubUiBundlesPanel` and `hubUiBundles` from agent manifest.
- Hub UI slash commands remain as manifest items with `kind: command` (filter Kind → Command).

Version: 2.1.1 → 2.1.2

## 2026-06-03 - Hub UI agent catalog + `/hub-ui` command bundle

- Version: `2.1.1`
- Type: Patch
- Product: P0004
- Prompt: Working_Rules — gom rule/skill/code Hub UI; list vào Agent tab; command gọi một lúc
- Commit: pending
- Status: Draft

### Changes

- `AGENTS.md`: catalog đầy đủ rules/skills/scripts/package + command bundles.
- Cursor command `/hub-ui` + script `Tool/scripts/hub-ui-stack.cjs`; `pnpm hub-ui:stack`.
- `sync-agent-manifest.mjs`: quét commands, Hub scripts, AGENTS.md, hub-ui README; tag `hub-ui`; `hubUiBundles` JSON.
- Agent tab kinds: `command`, `script`; filter Kind mở rộng.
- `sync-hub-ui-vendor.cjs`: fan-out content/CSS từ `packages/hub-ui`.

### Verification

- `pnpm hub-ui:stack` — manifest rebuild
- System → Agent — filter/tag hub-ui

Version: 2.1.0 → 2.1.1

## 2026-06-03 - Release pipeline fix + Supabase quota cache v2

- Version: `2.1.0`
- Type: Minor
- Product: P0004
- Prompt: ok 1 2 — Git + Push: quota cache v2 (invalidate stale localStorage)
- Commit: `8fc47af`
- Status: Committed

### Changes

- `Tool/scripts/ship-product.ps1`: `gh release view` không còn fail pipeline khi release chưa tồn tại (PowerShell `$ErrorActionPreference`).
- `supabase-quota-client-cache.ts`: cache key `system:supabase-quota:v2` — xóa payload cũ 15 legacy projects sau catalog prune.

### Verification

- `corepack pnpm build` — pass
- Browser: hard load `/system/supabase-quota` — 14 projects (no stale v1 cache)

### Rollback

- `git checkout v2.0.0 -- src/features/system-hub/supabase-quota-client-cache.ts`

---

## 2026-06-03 - Supabase Quota catalog sync + legacy prune

- Version: `2.0.0`
- Type: Major
- Product: P0004
- Prompt: Release P0004 — Supabase Quota data complete, legacy projects removed
- Commit: `93dcef1`
- Status: Verified
- Release: https://github.com/tuanhoangfx/Tool-Hub/releases/tag/v2.0.0

### Changes

- Catalog: 14 projects (11 account P01 + P0009/P0013/P0022); removed 5 dead legacy refs.
- `public/supabase-quota-catalog.snapshot.json` rebuilt; PAT nguyenluongthaimkt live.
- `hub-background-prefetch`: priority hub ref `fmnrafpzctuhxjaaomzt`.

### Verification

- `node scripts/verify-supabase-quota.mjs` — 14 catalog, 11 API
- `corepack pnpm build` — pass
- Browser: System → Supabase Quota @ :5176

### Rollback

- `git checkout v1.1.3` or redeploy prior Vercel production

---

## 2026-06-03 - Git commit version stamp

- Version: `1.1.3`
- Timestamp: 2026-06-03 15:23 (UTC+7)
- Commit: `6f38644`
- Type: Patch
- Status: Draft

### Changes

- Version stamp for git commit.

### Verification

- pending

---
﻿# Changelog

## 2026-06-03 - Supabase Quota catalog sync + legacy prune

- Version: `1.1.2`
- Type: Patch
- Product: P0004
- Prompt: Hoàn thiện tab Supabase Quota; PAT nguyenluongthaimkt; rà soát xóa project không còn thực tế
- Commit: `6f38644`
- Status: Draft

### Changes

- Catalog workspace: 11 account P01 + 3 tool-bound (`P0009`, `P0013`, `P0022`); xóa 5 legacy dead refs.
- Sync `public/supabase-projects.catalog.json` + snapshot 14 projects; PAT nguyenluongthaimkt mới (11/11 tokens live).
- `hub-background-prefetch`: priority refs `fmnrafpz` (hub) thay `zvdxznbb`.

### Verification

- `node scripts/verify-supabase-quota.mjs` — 14 catalog, 11 API, exit 0
- `corepack pnpm build` — pass
- Browser: System → Supabase Quota @ :5176 — 14 projects, live metrics OK

### Rollback

- `git checkout v1.1.1 -- public/supabase-projects.catalog.json public/supabase-quota-catalog.snapshot.json src/lib/hub-background-prefetch.ts`

---

## 2026-06-03 - Release infi.io.vn Hub production

- Version: `1.1.1`
- Timestamp: 2026-06-03 (UTC+7)
- Commit: `daa6bdf`
- Type: Major
- Status: Committed
- Prompt: Release P0004 after infix1→infi.io.vn migration — fix build and deploy Hub

### Changes

- Fix `supabase-quota-client-cache.ts` timer type for `tsc --noEmit` (unblocks production build).
- Hub catalog URLs on `infi.io.vn`; Vercel custom domain production deploy.

### Verification

- `corepack pnpm build` pass
- Browser smoke https://infi.io.vn

### Rollback

- Revert version bump; promote prior Vercel deployment

---

## 2026-06-03 - Git commit version stamp

- Version: `0.4.14`
- Timestamp: 2026-06-03 08:28 (UTC+7)
- Commit: `ec324c0`
- Type: Patch
- Status: Draft

### Changes

- Version stamp for git commit.

### Verification

- pending

---
﻿# Changelog - P0004-Tool-Hub

> **Ship keywords:** `Git P0004` | `Push P0004` | `Release P0004`  
> **Template:** `E:\Dev\Rules\templates\tool-docs\CHANGELOG_ENTRY_TEMPLATE.md`  
> **Version sync:** `corepack pnpm run check:version` — package.json = manifest release.version = CHANGELOG top Version

## 2026-06-03 - Supabase Quota catalog: 11 accounts (superseded by 1.1.2)

- Version: `0.4.15`
- Type: Patch
- Product: P0004
- Prompt: Hoàn thiện dữ liệu tab Supabase Quota (11 tài khoản user cung cấp)
- Commit: pending
- Status: Draft

### Changes

- `supabase-projects.catalog.json`: thêm accounts `namduongvn7`, `gopremium159`; projects `ynlslntczthxwdvlrhyi`, `cwbxgzuqlvvrogmcxbkv`, `rqomtgvcnglfgfcdieby`; đổi tên `yhnqwxejjkfgmjmiquhb` → tuanhoangfx P01.
- `.env.shared`: PAT + ref keys cho czpro8, tuanhoangfx, x1z10, thanhnamworld, namduongvn7, gopremium159; bổ sung anon/publishable/secret còn thiếu.
- Sync catalog → `public/supabase-projects.catalog.json`; rebuild `supabase-quota-catalog.snapshot.json` (18 projects).
- `.env.shared.example`: placeholder cho PAT accounts mới.

### Verification

- `node scripts/sync-supabase-catalog.cjs` — OK
- `node scripts/build-supabase-quota-snapshot.mjs` — 18 projects
- `node scripts/verify-supabase-quota.mjs` — 11 tokens, 10 live API metrics (nguyenluongthaimkt PAT 401)

---

## 2026-06-03 - Local health poll: compact 6h–1w + default Off

- Version: `0.4.14`
- Type: Patch
- Product: P0004
- Prompt: Compact poll options 6h/12h/1d/3d/1w; default manual-only (Off)
- Commit: pending
- Status: Draft

### Changes

- Settings chips: **Off · 6h · 12h · 1d · 3d · 1w** (replaces 30s–2m).
- Default **Off** — no background port probe until user picks an interval or clicks **Local health**.
- Legacy URL `lhpoll=30|60|90|120` maps to Off.

### Verification

- `corepack pnpm test`
- Fresh Hub load: no auto poll until Settings or Local health

### Rollback

- Restore second-based intervals and prior default if needed

---

## 2026-06-03 - Settings: Local health poll off / auto interval

- Version: `0.4.13`
- Type: Patch
- Product: P0004
- Prompt: Add Settings toggle — auto poll by interval or off (manual Local health only)
- Commit: `ec324c0`
- Status: Draft

### Changes

- **Settings → General → Local health poll:** Off, 30s, 60s, 90s (default), 2m — stored in URL `lhpoll`.
- `useLocalHealth` respects poll interval; no background probe when Off.
- Hub filter bar **Local health** still runs an immediate recheck anytime.

### Verification

- `corepack pnpm test`
- Settings → Off → Hub cards stop auto `:port` updates until Local health clicked

### Rollback

- Remove `lhpoll` pref and restore fixed 90s interval in `useLocalHealth`

---

## 2026-06-03 - Hub cards: quieter local health + Supabase alerts only

- Version: `0.4.12`
- Type: Patch
- Product: P0004
- Prompt: Why Supabase on Hub cards; fix Hub / Local health flicker
- Commit: pending
- Status: Draft

### Changes

- Remove verbose Supabase quota lines from Hub **card** view (metrics stay in **System → Supabase Quota**).
- Show Supabase chip on cards only for warn / critical / restricted (not “Quota OK”).
- Local health: background poll is silent (no `checking` flash); pulse only on manual recheck; interval 90s.
- Debounce quota cache UI events (300ms) and one Hub-level quota listener instead of per-card.

### Verification

- Hub cards at `http://127.0.0.1:5176/` — P0020 no DB/API footer; Local health button stable between polls
- `corepack pnpm test`

### Rollback

- Restore `HubSupabaseQuotaHint` on `HubToolCard` and prior `useLocalHealth` / quota dispatch behavior

---

## 2026-06-03 - Local registry: P0001/P0002 manifest repair scan

- Version: `0.4.11`
- Type: Patch
- Product: P0004
- Prompt: ok — fix P0001/P0002 manifests, rescan workspace catalog
- Commit: `4d14495`
- Status: Verified
- Release: https://github.com/tuanhoangfx/Tool-Hub/releases/tag/v0.4.11

### Changes

- Refreshed `local-registry.json`, `workspace-catalog.json`, `registry.default.json` after P0001/P0002 `tool.manifest.json` BOM fix (Hub cards **P0001** / **P0002**, no duplicate **LOCAL-001** / **LOCAL-002**).
- `workspace-scan.cjs`: `writeJsonFile` + `normalizeManifestFileEncoding` strip UTF-8 BOM on scan so manifests stay parseable (fixes recurring **LOCAL-00x** cards).
- Registry schema: allow `Draft` status (P0006 catalog entry); workspace version triple repair (16/16 OK).

### Verification

- `corepack pnpm scan:local`
- Hub at `http://127.0.0.1:5176/` — cards show P0001, P0002 with GitHub repo linked

### Rollback

- Revert public registry snapshots and prior manifest versions on P0001/P0002

---

## 2026-06-03 - Workspace version sync standardization + release

- Version: `0.4.10`
- Type: Patch
- Product: P0004
- Prompt: ok 1 2 3 — repair version triple workspace-wide, migrate P0001/P0002, Release P0004
- Commit: `dddf079`
- Status: Committed

### Changes

- Workspace scripts: `check-version-sync --all`, `install-product-git-hooks --all`, `repair-version-triple.mjs` (single source, no per-tool copy).
- P0001/P0002 check/hook scripts delegate to `Tool/scripts/`.
- Hub local health badge, port migration, scanner authoritative fields, legacy icon gallery removed.

### Verification

- `node E:\Dev\Tool\scripts\check-version-sync.mjs --all` — 16/16 OK
- `corepack pnpm build`
- Production smoke via `ship-product.ps1 -Keyword Release`

### Rollback

- `git checkout v0.4.3`

---

## 2026-06-03 - Scanner sync repo/status/tags from manifest

- Version: `0.4.8`
- Type: Patch
- Product: P0004
- Prompt: Bổ sung skill onboard P0023 — scanner merge github.repo sau rename.
- Commit: pending
- Status: Draft
- Release:

### Changes

- `workspace-scan.cjs`: expand `SCANNER_AUTHORITATIVE` (repo, status, summary, tags, code, name, branch).
- Strip UTF-8 BOM when reading JSON manifests.
- Array-aware merge for `tags` / stack.

### Verification

- `corepack pnpm scan:local` — P0023 registry shows `tuanhoangfx/P0023-Fanpage-Dashboard`, status Ready

### Rollback

- `git checkout v0.4.7`

---

## 2026-06-03 - Remove icon gallery; fix legacy URL and P0020 dev

- Version: `0.4.6`
- Type: Patch
- Product: P0004
- Prompt: 5176/5177 lỗi; xóa `/icons/tools/gallery.html` còn sót sau icon review.
- Commit: `2d9450e`
- Status: Draft

### Changes

- Xóa `public/icons/tools/gallery.html` và `v2`–`v6` (mock so sánh 6 phong cách icon).
- Middleware `legacy-public-gone.cjs` → 410/404; `vercel.json` redirect gallery về Hub.
- P0020 `ensure-dev` dùng `ensure-dev-product` (daemon).

### Verification

- `http://127.0.0.1:5176/` — 200; `/icons/tools/gallery.html` — 410
- `http://127.0.0.1:5177/notes` — `corepack pnpm open` trong P0020

### Rollback

- `git checkout v0.4.5`

---

## 2026-06-03 - Port migration, local health badge, pnpm open workspace-wide

- Version: `0.4.5`
- Type: Patch
- Product: P0004
- Prompt: ok 1 2 3 — migrate port P0009/P0013/P0019, Hub live/dead badge, pnpm open all tools.
- Commit: pending
- Status: Draft

### Changes

- Port migration: P0009 → 3009, P0013 → 3013, P0019 → 5179 (vite.config + manifest); P0021 manifest → 3021.
- `/api/local-health` dev proxy + `useLocalHealth` batch probe every 30s; Hub cards/table show `:port live|down`.
- `Tool/scripts/open-tool.cjs` + `pnpm open` on P0001/P0002/P0005/P0009/P0010/P0013/P0019/P0021/P0022.

### Verification

- `corepack pnpm scan:local` in P0004
- Hub → Local health button; card chips `:5176 live` / `:port down`
- `node Tool/scripts/probe-local-urls.cjs`

### Rollback

- `git checkout v0.4.4`

---

## 2026-06-03 - Workspace local dev registry + health probe

- Version: `0.4.4`
- Type: Patch
- Product: P0004
- Prompt: Xử lý triệt để local link lỗi trên nhiều tool — registry port + ensure-dev workspace-wide.
- Commit: pending
- Status: Draft

### Changes

- `Tool/scripts/lib/workspace-ports.json` — bảng port chuẩn 13 tool (fix collision 3000/5173/3921).
- `ensure-dev-product.cjs` + `probe-local-urls.cjs` — start/reuse daemon + health check workspace.
- `workspace-scan.cjs` — ưu tiên URL từ registry; `tools-launch.json` path fix.

### Verification

- `node Tool/scripts/probe-local-urls.cjs`
- `node Tool/scripts/ensure-dev-product.cjs P0004 P0020`

### Rollback

- `git checkout v0.4.3`

---

## 2026-06-03 - Release v0.4.3: Dev daemon, P0022 catalog, quota vendor

- Version: `0.4.3`
- Type: Minor
- Product: P0004
- Prompt: Release P0004 v0.4.3 — dev daemon stable, P0022 Infi Store, vendor quota lib
- Commit: `58e6120`
- Status: Verified
- Release: https://github.com/tuanhoangfx/Tool-Hub/releases/tag/v0.4.3

### Changes

- Stable dev server daemon (`ensure-dev.cjs`): reuse :5176, no kill-port on every start.
- P0022 Infi Store in workspace catalog; P0022 Infi Website registration (v0.3.1 / v0.4.1).
- Vendor `supabase-quota-fetch.cjs` + `sync:supabase-catalog` for standalone Vercel builds.
- Hub UI shell import fixes (`ui-scale` paths in vendor hub-ui).

### Verification

- `corepack pnpm build` — pass
- Production: https://infi.io.vn

### Rollback

```powershell
git checkout v0.2.7
```

---

## 2026-06-03 - P0022 Infi Store rename and catalog refresh

- Version: `0.4.1`
- Type: Minor
- Product: P0004
- Prompt: Đổi tên P0022-Infi-Store, cập nhật Hub catalog sau rename repo, Tailwind, domain store.infi.io.vn.
- Commit: `c050ec4`
- Status: Committed

### Changes

- `registry.default.json`: **P0022 Infi Store** (`infi-store`, `tuanhoangfx/P0022-Infi-Store`, https://store.infi.io.vn).
- Refreshed `local-registry.json`, `workspace-catalog.json`, `supabase-workspace-map.json`.

### Verification

- `corepack pnpm scan:local` — 15 projects
- P0022 production: https://p0022-infi-website.vercel.app

### Rollback

```powershell
git checkout v0.3.2
```

---

## 2026-06-03 - Register P0022 Infi Website in workspace catalog

- Version: `0.3.1`
- Type: Minor
- Product: P0004
- Prompt: Đồng bộ tuanhoangfx/Infi-Website → P0022, chuẩn hóa registry Tool Hub sau clone và release.
- Commit: `572c55d`
- Status: Committed

### Changes

- `scan:local` + `registry.default.json`: thêm **P0022 Infi Website** (`infi-website`, Vercel, Supabase `lmwcvulazahaweyikkjq`).
- Cập nhật `local-registry.json`, `workspace-catalog.json`, `supabase-workspace-map.json`, `agent-manifest.json`.

### Verification

- `corepack pnpm scan:local` — 14 projects, +1 catalog entry
- Production P0022: https://p0022-infi-website.vercel.app

### Rollback

```powershell
git checkout v0.2.7
```

---

## 2026-06-03 - Release v0.2.7: Agent context, Supabase quota, Hub shell

- Version: `0.2.7`
- Type: Minor
- Product: P0004
- Prompt: Release P0004 v0.2.7 — commit WIP, vendor deps for Vercel, gh release
- Commit: `dd0feb9`
- Status: Verified
- Release: https://github.com/tuanhoangfx/Tool-Hub/releases/tag/v0.2.7

### Changes

- System Agent tab: manifest normalize, kind badges, card/table views, sticky filter portal fix.
- Supabase quota: client cache, budget bars, Hub list quota chips, snapshot prefetch.
- HubCardAvatar; overview TOC spy; workspace refresh middleware; vendor hub-load/hub-ui for standalone Vercel build.
- Hub boot loader, ScreenErrorBoundary, tools directory table and bulk actions.

### Verification

- `corepack pnpm build` — pass
- Production: https://infi.io.vn

### Rollback

```powershell
git checkout v0.2.6
```

---

## 2026-06-03 - Git commit version stamp

- Version: `0.2.6`
- Timestamp: 2026-06-03 00:09 (UTC+7)
- Commit: `d2a7eff`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-02 - Git commit version stamp

- Version: `0.2.5`
- Timestamp: 2026-06-02 15:32 (UTC+7)
- Commit: `c8357e9`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-02 - Git commit version stamp

- Version: `0.2.4`
- Timestamp: 2026-06-02 15:19 (UTC+7)
- Commit: `cf2f53f`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-02 - Git commit version stamp

- Version: `0.2.3`
- Timestamp: 2026-06-02 15:06 (UTC+7)
- Commit: `d6846bc`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-06-02 - Git commit version stamp

- Version: `0.2.2`
- Timestamp: 2026-06-02 15:05 (UTC+7)
- Commit: `57f9885`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Add System → Agent tab: rules/skills manifest, Hub-standard FilterBar + KPI/charts, card/table views + optional flat mode.
- Standardize hub-load caches/prefetch and remove design-preview mocks after locking V2.
- Version stamp for git commit.

### Verification

- `pnpm exec tsc --noEmit`

---
## 2026-05-30 - Git commit version stamp

- Version: `0.1.14`
- Timestamp: 2026-05-30 01:50 (UTC+7)
- Commit: `f15268f`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-05-30 - Git commit version stamp

- Version: `0.1.13`
- Timestamp: 2026-05-30 01:41 (UTC+7)
- Commit: `5e70eae`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-05-30 - Git commit version stamp

- Version: `0.1.12`
- Timestamp: 2026-05-30 01:38 (UTC+7)
- Commit: `04cbc32`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-05-27 - Git commit version stamp

- Version: `0.1.11`
- Timestamp: 2026-05-27 08:43 (UTC+7)
- Commit: `96eec3a`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-05-27 - Git commit version stamp

- Version: `0.1.10`
- Timestamp: 2026-05-27 06:58 (UTC+7)
- Commit: `ee02743`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-05-27 - Git commit version stamp

- Version: `0.1.9`
- Timestamp: 2026-05-27 06:52 (UTC+7)
- Commit: `de15859`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-05-27 - Git commit version stamp

- Version: `0.1.8`
- Timestamp: 2026-05-27 05:45 (UTC+7)
- Commit: `a2907da`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-05-27 - Git commit version stamp

- Version: `0.1.7`
- Timestamp: 2026-05-27 04:41 (UTC+7)
- Commit: `19f8789`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-05-26 - Git commit version stamp

- Version: `0.1.6`
- Timestamp: 2026-05-26 13:50 (UTC+7)
- Commit: `d8fe7a6`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-05-26 - Git commit version stamp

- Version: `0.1.5`
- Timestamp: 2026-05-26 02:40 (UTC+7)
- Commit: `41ed8ee`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-05-26 - Git commit version stamp

- Version: `0.1.4`
- Timestamp: 2026-05-26 02:37 (UTC+7)
- Commit: `0cf6433`
- Type: Patch
- Product: P0004
- Prompt: Git commit version stamp
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- pending

---
## 2026-05-26 - System Hub version workflow and roadmap polish

- Version: `0.1.3`
- Timestamp: 2026-05-26 00:10 (UTC+7)
- Commit: `cac106a`
- Type: Patch
- Product: P0004
- Prompt: System Hub version workflow and roadmap polish
- Status: Committed

### Changes

- Version stamp for git commit.

### Verification

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- Vercel production deployment READY.
- GitHub Release: https://github.com/tuanhoangfx/Tool-Hub/releases/tag/v0.1.3

---
## 2026-05-25 - Roadmap UI crypto-style timeline

- Version: `0.1.2`
- Timestamp: 2026-05-25 21:30 (UTC+7)
- Type: Patch
- Product: P0004
- Prompt: Roadmap UI crypto-style timeline
- Status: Committed

### Changes

- Roadmap: crypto-style timeline with separated axis dots and orbit markers.
- Sync/History badges now match the Versions panel.
- Version chip, status, and date share the same side and align to the marker center.
- Centered bullets with larger typography, sourced from CHANGELOG.
- Orbit marker links to the GitHub release with hover glow.

### Verification

- Preview at http://127.0.0.1:5176/ → tool P0004 → section 🎯 Roadmap.

---
## 2026-05-25 - Hub version pipeline auto-bump on commit

- Version: `0.1.1`
- Timestamp: 2026-05-25 07:42 (UTC+7)
- Commit: `0d4a81d`
- Type: Patch
- Product: P0004
- Prompt: Hub version pipeline auto-bump on commit
- Status: Committed

### Changes

- Synchronized version across package, manifest, and CHANGELOG.
- Versions panel now includes history and pipeline patch auto-bump.

### Verification

- pending

---
- Product: P0004
- Prompt: Full infra rename Tool Hub
## 2026-05-24 - Full infra rename Tool Hub

- Folder `P0004-Tool-Hub`, GitHub `tuanhoangfx/Tool-Hub`, Vercel `tool-hub`.
- Removed legacy alias `GitHub Tool Manager`.

## 2026-05-23 - Rebrand Tool Hub

- Display name **Tool Hub** (was GitHub Tool Manager / Tool Library).
- Catalog id `tool-hub` (alias `tool-hub` in manifest).
- Library-only UI; theme key `tool-hub-theme`.


- Version: `0.1.0`
- Timestamp: 2026-04-30 00:00 (UTC+7)
- Commit: `572c55d`
- Type: Feature
- Product: P0004
- Prompt: Rebrand Tool Hub
- Status: Stable

### Changes

- Tool Store card view + Repo Admin table.
- GitHub raw readers (manifest, README, CHANGELOG, package).
- New sidebar console layout.
- Local scanner via `pnpm scan:local`.
- GitHub token flow for review issues and draft releases.
- Version drift alerts across the pipeline.

### Verification

- `corepack pnpm build`
- `corepack pnpm lint`
- Browser verification at `http://127.0.0.1:5176/`
- Result: passed

### Rollback

```powershell
cd E:\Dev\Tool\P0004-Tool-Hub
git revert <commit_hash>
```
