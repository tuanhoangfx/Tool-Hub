# Supabase Quota (System tab)

The **Supabase Quota** tab in P0004 Tool Hub lists organizations and projects from your Supabase account and shows usage metrics via the **Management API** (Personal Access Token only).

## Authentication

The dev proxy (`GET /api/supabase/quota` via `Tool/scripts/lib/supabase-quota-fetch.cjs`) calls the [Supabase Management API](https://supabase.com/docs/reference/api/introduction) with **one or more Personal Access Tokens**. Browser login to supabase.com does not authorize this tab.

### Setup

1. Open [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens) for **each** Supabase account you own.
2. Copy `E:\Dev\.env.shared.example` → `E:\Dev\.env.shared` and set tokens:

```env
SUPABASE_MANAGEMENT_TOKEN=sbp_xxxxxxxx
SUPABASE_PAT_enzobyczp=sbp_xxxxxxxx
SUPABASE_PAT_czprofess=sbp_xxxxxxxx
# SUPABASE_PAT_czpro8= ...
```

3. Project catalog (names, refs, tool bindings): `E:\Dev\supabase-projects.catalog.json` — projects without a PAT for their account appear as **Catalog only** (no live metrics).
4. Start dev server: `pnpm dev` in `Tool/P0004-Tool-Hub` (port **5176**).
5. Open `http://127.0.0.1:5176/system/supabase-quota`.

### Force refresh

- **Refresh** calls `?refresh=1` and bypasses the 2-minute server cache.
- Response header `X-Cache`: `HIT`, `MISS`, or `COALESCED`.
- Tab also keeps a 5-minute **sessionStorage** cache for instant re-entry.

## Data loaded per project (Management API `/v1/...`)

| Source | Endpoint | Shown on card / table |
|--------|----------|------------------------|
| Org list | `GET /v1/organizations` | Org slug |
| Org detail | `GET /v1/organizations/{slug}` | Org plan |
| Projects | `GET /v1/organizations/{slug}/projects` | Name, ref, region |
| Project detail | `GET /v1/projects/{ref}` | Project plan |
| API counts | `GET /v1/projects/{ref}/analytics/endpoints/usage.api-counts` | REST / Auth / RT / Storage per minute |
| API requests | `GET /v1/projects/{ref}/analytics/endpoints/usage.api-requests-count` | Total API requests |
| Disk util | `GET /v1/projects/{ref}/config/disk/util` | DB disk used |
| Health | `GET /v1/projects/{ref}/health?services=…` | **Restricted** + violation codes |

**Not available via PAT:** billing-cycle egress used/limit (GB, %). That lives on Supabase Dashboard → Usage. **Restricted** still works via the health API (`exceed_egress_quota`, etc.).

## Workspace tool bindings

Each quota card shows **tool code chips** (e.g. `P0004`, `P0020`) when a workspace env file references that project ref.

- Dev API: `GET /api/supabase/workspace-map` (scans `.env*` under Tool + Extension roots)
- **Refresh** on Quota tab also rescans workspace map (`?refresh=1`)
- Static file: `public/supabase-workspace-map.json` (updated by `pnpm scan:local`)
- Verify CLI: `pnpm supabase:verify-quota`

## Scripts (P0004 / workspace)

| Command | Purpose |
|---------|---------|
| `pnpm supabase:sync-vercel` | Push `.env.local` Supabase vars → Vercel production (6 projects). Add `--all-envs` for preview/dev. |
| `pnpm supabase:apply-hub` | Apply Hub SQL via Management API (`fmnrafpzctuhxjaaomzt`) |
| `pnpm supabase:bundle-hub` | Build `supabase/APPLY_ALL_HUB.sql` for Dashboard paste |
| `pnpm supabase:verify-quota` | Compare workspace refs vs catalog + multi-PAT API projects |

P0020 Data box: `pnpm db:migrate:api`, `pnpm db:bundle:api` → `supabase/APPLY_ALL_DATABOX_API.sql`.

**Multi-account:** Quota merges all `SUPABASE_PAT_*` tokens plus `SUPABASE_MANAGEMENT_TOKEN`. Each token only sees projects in its account. Add PATs for czpro8, tuanhoangfx, hanguyennn0106, thanhnamworld, x1z10 to fetch live metrics for all 12 catalog projects.

## Performance

- Per-project calls run in parallel (6 workers).
- Each upstream call times out after 12s (avoids hung tab).
- Server cache: 120s; client sessionStorage: 5 min.
- Removed slow/unused fetches: platform usage, billing addons, entitlements, disk config.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank page / connection refused | Run `pnpm dev` in P0004-Tool-Hub |
| `Missing SUPABASE_MANAGEMENT_TOKEN` | Add token to `E:\Dev\.env.shared`, restart dev |
| Loading very long then timeout | Check token scope; click Refresh; server cache helps on second visit |
| Plan shows `Free (org)` only | Project API returned no plan — normal on free tier |
| Restricted but no egress % | Expected with PAT only — open Dashboard Usage for GB |

## Production deployment

Expose the same Management API proxy on your backend (never ship the token to the browser).
