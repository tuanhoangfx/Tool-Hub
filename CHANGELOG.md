# Changelog - P0004-Tool-Hub

> **Ship keywords:** `Git P0004` | `Push P0004` | `Release P0004`  
> **Template:** `E:\Dev\Rules\templates\tool-docs\CHANGELOG_ENTRY_TEMPLATE.md`  
> **Version sync:** `corepack pnpm run check:version` — package.json = manifest release.version = CHANGELOG top Version

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
- Production: https://infix1.io.vn

### Rollback

```powershell
git checkout v0.2.7
```

---

## 2026-06-03 - P0022 Infi Store rename and catalog refresh

- Version: `0.4.1`
- Type: Minor
- Product: P0004
- Prompt: Đổi tên P0022-Infi-Store, cập nhật Hub catalog sau rename repo, Tailwind, domain infi.infix1.io.vn.
- Commit: `c050ec4`
- Status: Committed

### Changes

- `registry.default.json`: **P0022 Infi Store** (`infi-store`, `tuanhoangfx/P0022-Infi-Store`, https://infi.infix1.io.vn).
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
- Production: https://infix1.io.vn

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
