# Changelog

## 2026-06-03 - Git commit version stamp

- Version: `2.1.10`
- Timestamp: 2026-06-03 20:23 (UTC+7)
- Commit: pending
- Type: Patch
- Status: Draft

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
- Commit: pending
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
