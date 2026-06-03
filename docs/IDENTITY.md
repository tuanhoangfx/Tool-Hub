# Tool Hub identity (P0004)

Workspace login and user directory live on **Supabase Hub identity** (`fmnrafpzctuhxjaaomzt`, x1z10 P01) — shared with P0020 (`signInWorkspaceDual`), P0006, and E0001 identity plane.

Login resolution is shared via **`@tool-workspace/hub-identity`** (vendor copy: `node Tool/scripts/sync-hub-identity-vendor.cjs`).

## Setup

1. Copy env:

```env
VITE_SUPABASE_URL=https://fmnrafpzctuhxjaaomzt.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Dashboard → API>
```

2. Apply SQL (once per project):

```powershell
# Requires SUPABASE_ACCESS_TOKEN in env
powershell -ExecutionPolicy Bypass -File scripts/apply-hub-identity-migration.ps1
```

Or paste migrations in [SQL Editor](https://supabase.com/dashboard/project/fmnrafpzctuhxjaaomzt/sql/new), including `20260603120000_hub_login_id.sql` for User ID + contact email columns.

**Status (2026-05-29):** Migration applied on `fmnrafpzctuhxjaaomzt` via Management API.

3. `pnpm dev` → open **Users** tab or footer **User** (account / sign out).

## UI (cloned from P0020)

| Feature | Route / control |
|---------|-----------------|
| Sign in / sign up | **User ID** or email + password (Users tab / Login) |
| Link email | Account modal → **Link email** (confirmation link) |
| Change password | Account modal → code to linked email (6-digit OTP) |
| Admin add user | Users → **Add** (User ID and/or email) |
| Admin reset password | Users → open user → **Reset password** |
| User directory | Users tab (admin/manager see all) |
| Account modal | Sidebar footer **User** |
| Sign out | Account modal |

## Extension (E0001)

While Tool Hub is open, identity JWT is relayed as `E0001_HUB_IDENTITY_AUTH` (storage key `e0001-hub-identity-v1`). Cookie sync on P0020 still uses the Data Box Supabase JWT via `E0001_COOKIE_BRIDGE_AUTH`.

## P0020 Data Box

- **App nào login app đó:** P0020 uses `NotesAuthGate` on Data Box; P0004 uses `HubAuthGate` on x1z10 P01.
- **Quản lý qua P0004:** P0020 sidebar **Users** links to Hub `/users` (no duplicate directory on Data Box).
- Identity migration aligns `auth.users` / profiles on Hub; data (notes, vault, todo) stays on Data Box.
- See `Tool/P0020-Data-Box/docs/HUB-IDENTITY.md`.

## Identity migration (Data Box → Hub)

Full runbook: [IDENTITY-MIGRATION.md](./IDENTITY-MIGRATION.md)

```powershell
pnpm identity:phase0    # schema on x1z10 (or already applied)
pnpm identity:export    # from yhnqwx — needs SUPABASE_SERVICE_ROLE_KEY in P0020 .env.local
pnpm identity:import    # into Hub — needs service role in P0004 .env.local
```

**Phase 0 applied (2026-05-30):** `projects`, `project_members`, `legacy_user_map`, `legacy_project_map` on `fmnrafpzctuhxjaaomzt`.

## Notes

- P0020 **data** auth remains on `yhnqwx` for Notes/Cookie/Todo; identity + memberships on Hub after import.
- Users table UI: E0001-style `hub-users-table` + **Tool** filter and admin **Tool access** drawer. See [TOOL-ACCESS.md](./TOOL-ACCESS.md).
