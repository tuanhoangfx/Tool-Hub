# Changelog

## 2026-05-25 - Hub version pipeline auto-bump on commit

- Version: `0.1.1`
- Timestamp: 2026-05-25 07:42 (UTC+7)
- Commit: `0d4a81d`
- Type: Patch
- Status: Draft

### Changes

- Đồng bộ version trên package, manifest và CHANGELOG.
- Versions panel: lịch sử theo phiên bản, pipeline Commit auto-bump patch.

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

- Added public Tool Store card view.
- Added Repo Admin table for GitHub repository health and update suggestions.
- Added public GitHub raw file readers for manifest, README, changelog, package, and configured scripts.
- Reworked navigation into a left sidebar console layout.
- Added local workspace scanner merge through `corepack pnpm scan:local`.
- Added GitHub token actions for creating review issues and draft releases.
- Added version drift alerts across package, manifest, changelog, and release metadata.

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
