# Tool access (V2) — Hub identity

## Summary

Each **Hub tool** (`P0004`, `P0020`, …) is a row in `hub_tools`. Per-user grants live in `tool_access`. Legacy Todo **projects** (`projects` / `project_members`) stay unchanged.

| Layer | Meaning |
|-------|---------|
| `profiles.role` | Workspace: `admin`, `manager`, `user` |
| `tool_access` | Per-tool grant: `permission = access` |
| **admin** | Implicit access to **all** tools (no rows required) |
| **manager** | View directory + tool grants; **cannot** edit grants |
| **user** | Only tools with a grant row |

## Schema

- `hub_tools(tool_code PK, name, category, status, archived_at, synced_at)`
- `tool_access(user_id, tool_code, permission, granted_by, …)`

## RPC / sync

- `sync_hub_tools(jsonb)` — upsert catalog from workspace scan (authenticated).
- `workspace_user_directory()` — adds `tool_count`, `tool_codes[]` (admins get full catalog).

## UI (Users tab)

- Filter **Tool**, column **Tools**, row click → **User access** modal (profile + grants).
- Toolbar (search row 2): **Add** (sign-in hint + sync), **Sync tools**, **Edit**, **Delete**.
- Catalog = `local-registry.json` + `workspace-catalog.json` (P00xx + **E00xx**). Admin **Sync tools** upserts `hub_tools` before grants.
- Hub list **enforcement** (hide tools without grant): Phase 2 — not in this sprint.

## Apply migration

```powershell
cd E:\Dev\Tool\P0004-Tool-Hub
powershell -ExecutionPolicy Bypass -File scripts/apply-hub-tool-access.ps1
```

Requires `SUPABASE_ACCESS_TOKEN` (or `E:\Dev\.env.shared`).

## Design

**System → Design Template** — one page, 5 variant cards + live preview (`/system/template`, `/system/template/2` … `5`). See [DESIGN-PREVIEW-tool-access.md](./DESIGN-PREVIEW-tool-access.md).

## Related

- [IDENTITY.md](./IDENTITY.md)
- [IDENTITY-MIGRATION.md](./IDENTITY-MIGRATION.md)
