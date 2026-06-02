# Identity migration → P0004 Hub (x1z10 P01)

Gom **user + project membership** từ Data Box (`yhnqwxejjkfgmjmiquhb`) lên Tool Hub (`fmnrafpzctuhxjaaomzt`).

Notes/Cookie/Todo **data** vẫn trên yhnqwx; map ID qua `legacy_user_map` / `legacy_project_map`.

## Prerequisites

| File | Keys |
|------|------|
| `E:\Dev\.env.shared` | `SUPABASE_MANAGEMENT_TOKEN` or `SUPABASE_ACCESS_TOKEN` (SQL + api-keys) |
| `P0004-Tool-Hub/.env.local` | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `P0020-Workspace-Notes/.env.local` | `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

Service role: Supabase Dashboard → Project → Settings → API → `service_role` (secret).

## Phase 0 — Schema on Hub

```powershell
cd E:\Dev\Tool\P0004-Tool-Hub
powershell -ExecutionPolicy Bypass -File scripts/identity-migration/apply-phase0.ps1
```

Creates: `projects`, `project_members`, `activity_logs`, `legacy_user_map`, `legacy_project_map`, updates `workspace_user_directory` RPC.

## Phase 1 — Export from Data Box

```powershell
cd E:\Dev\Tool\P0004-Tool-Hub
pnpm identity:export
```

Output: `scripts/identity-migration/.exports/databox-identity-yhnqwxejjkfgmjmiquhb.json`

If Data Box REST is blocked (`exceed_egress_quota`), export falls back to **Management API `database/query`** (same token as Phase 0).

## Phase 2 — Import to Hub

Dry run:

```powershell
pnpm identity:import:dry
```

Live import:

```powershell
pnpm identity:import
```

Merge rule: **same email** → one Hub user; legacy UUID stored in `legacy_user_map`.

## Merge duplicate Hub users (same email)

```powershell
pnpm identity:merge-users:dry
pnpm identity:merge-users
```

Reassigns `project_members`, `activity_logs`, `legacy_user_map` to the keeper account, then deletes duplicate auth users.

## Workspace roles

DB values: `admin`, `manager`, `user` (legacy `employee` is normalized to `user` on read).

## Phase 3 — Point tools at Hub identity (manual checklist)

- [ ] P0020: `VITE_TOOL_HUB_URL` for sign-in; keep yhnqwx for notes/cookie data
- [ ] P0019 Todo embed: auth via Hub or map `legacy_user_map` when calling yhnqwx
- [ ] P0008: already on x1z10 — verify profiles after import
- [ ] E0001: Hub tab relays identity JWT (`E0001_HUB_IDENTITY_AUTH`)

## Verify

1. Hub `/users` → Refresh → Projects/Actions > 0 for users with memberships
2. SQL: `select * from legacy_user_map limit 10;`
3. Filter **Project** on Users table

## Other Supabase projects

Repeat export with custom `DATABOX_SOURCE_REF` / URL env, or extend `export-databox-identity.mjs` for P0013/P0009 when service keys are available.
