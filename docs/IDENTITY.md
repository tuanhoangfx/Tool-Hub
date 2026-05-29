# Tool Hub identity (P0004)

Workspace login and user directory live on **Supabase project x1z10 P01** (`fmnrafpzctuhxjaaomzt`) — shared with P0008 Sales Console for auth users.

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

Or paste `supabase/migrations/20260529120000_hub_identity_profiles.sql` in [SQL Editor](https://supabase.com/dashboard/project/fmnrafpzctuhxjaaomzt/sql/new).

**Status (2026-05-29):** Migration applied on `fmnrafpzctuhxjaaomzt` via Management API.

3. `pnpm dev` → open **Users** tab or footer **User** (account / sign out).

## UI (cloned from P0020)

| Feature | Route / control |
|---------|-----------------|
| Sign in / sign up | Users tab when logged out |
| User directory | Users tab (admin/manager see all) |
| Account modal | Sidebar footer **User** |
| Sign out | Account modal |

## Notes

- P0020 still has its own auth on `yhnqwx` until migrated to use this hub.
- `workspace_user_directory` on x1z10 P01 does not join Todo `project_members` (Sales DB schema).
