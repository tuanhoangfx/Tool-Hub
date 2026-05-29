# Supabase Quota (System tab)

The **Supabase Quota** tab in P0004 Tool Hub lists organizations and projects from your Supabase account and shows entitlement limits plus usage metrics.

## Authentication (not browser session)

The dev proxy (`GET /api/supabase/quota` in `vite.config.ts`) calls the [Supabase Management API](https://supabase.com/docs/reference/api/introduction) with a **Personal Access Token**. Logging into [supabase.com](https://supabase.com) in Chrome or the IDE browser does **not** automatically authorize this tab; the server middleware cannot read that session.

### Setup

1. Open [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens).
2. Create a token with access to the organizations you want to monitor.
3. Add to `Tool/P0004-Tool-Hub/.env.local` (gitignored):

```env
SUPABASE_MANAGEMENT_TOKEN=sbp_xxxxxxxx
```

4. Restart the dev server (`pnpm run dev`).

### Force refresh

- **Refresh** in the toolbar calls `?refresh=1` and bypasses the 60s in-memory cache.
- Response header `X-Cache`: `HIT`, `MISS`, or `COALESCED`.

## Data loaded per project

| Source | Endpoint | Shown on card / table |
|--------|----------|------------------------|
| Org list | `GET /v1/organizations` | Org slug |
| Entitlements | `GET /v1/organizations/{slug}/entitlements` | KPI min–max across orgs |
| Projects | `GET /v1/organizations/{slug}/projects` | Name, ref, region, plan |
| Addons | `GET /v1/projects/{ref}/billing/addons` | (stored; optional chips later) |
| API counts | `GET /v1/projects/{ref}/analytics/endpoints/usage.api-counts` | REST / Auth / Realtime / Storage per minute (latest bucket) |
| API requests | `GET /v1/projects/{ref}/analytics/endpoints/usage.api-requests-count` | Total API requests |
| Disk util | `GET /v1/projects/{ref}/config/disk/util` | DB disk used / available |
| Disk config | `GET /v1/projects/{ref}/config/disk` | Provisioned disk size (GB) |
| Org usage (billing cycle) | `GET /platform/organizations/{slug}/usage?project_ref=` | Egress / cached egress used vs plan quota (GB, %) — same source as Supabase Dashboard |
| Health | `GET /v1/projects/{ref}/health?services=…` | Service status; quota violations in `error` (e.g. `exceed_egress_quota`) |

Usage fields are parsed in `src/features/system-hub/supabase-quota-metrics.ts`. Region flags use `src/lib/supabase-region.ts` (ISO country code → emoji, synced with P0020).

## UI layout

- **Cards** mode uses `SupabaseProjectCard` (same grid and chrome patterns as Hub `HubToolCard`). Click opens `SupabaseProjectDetailModal` (same shell as Hub `ToolDetailModal`).
- **Table** mode: row click opens the same detail modal.
- **Quota by org** table lists entitlement limits per organization below the charts.
- KPI row **min–max** reflects entitlement spread when you have multiple orgs or plans.

## Design preview

Mock/live variants (V1–V5) live only under **System → Design Template → Supabase Quota**, not in the production tab.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Missing SUPABASE_MANAGEMENT_TOKEN` | Create token, add `.env.local`, restart dev |
| KPI quota shows `—` | Org entitlements fetch failed or feature keys differ; check org `error` in network payload |
| Cards show “No usage metrics” | Analytics endpoints returned error or empty; verify project ref and token scope |
| Plan shows `—` | Project list may not include plan; entitlement plan is org-level |
| Egress shows `5 / 5 GB · 100%+` but not exact usage | `/platform/organizations/.../usage` may reject PAT (`401 JWT could not be decoded`); fallback uses plan limits + health restriction |

## Production deployment

For a hosted build, expose the same Management API proxy on your backend (never ship the token to the browser). Reuse the vite middleware logic or an edge route with `SUPABASE_MANAGEMENT_TOKEN` in server env.
