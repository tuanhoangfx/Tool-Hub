# Changelog

## 2026-05-26 - Git commit version stamp

- Version: `0.1.6`
- Timestamp: 2026-05-26 13:50 (UTC+7)
- Commit: `d8fe7a6`
- Type: Patch
- Status: Draft

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
- Status: Draft

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
- Status: Draft

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
- Status: Draft

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
- Status: Draft

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
- Status: Draft

### Changes

- Synchronized version across package, manifest, and CHANGELOG.
- Versions panel now includes history and pipeline patch auto-bump.

### Verification

- pending

---
## 2026-05-24 - Full infra rename Tool Hub

- Folder `P0004-Tool-Hub`, GitHub `tuanhoangfx/Tool-Hub`, Vercel `tool-hub`.
- Removed legacy alias `GitHub Tool Manager`.

## 2026-05-23 - Rebrand Tool Hub

- Display name **Tool Hub** (was GitHub Tool Manager / Tool Library).
- Catalog id `tool-hub` (alias `tool-hub` in manifest).
- Library-only UI; theme key `tool-hub-theme`.


- Version: `0.1.0`
- Timestamp: 2026-04-30 00:00 (UTC+7)
- Commit: pending
- Type: Feature
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
