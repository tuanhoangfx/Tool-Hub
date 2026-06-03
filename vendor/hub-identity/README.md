# @tool-workspace/hub-identity

Shared login helpers for **Tool Hub Supabase identity** (`fmnrafpzctuhxjaaomzt`, x1z10 P01).

Used by P0004, P0020 (`signInWorkspaceDual`), P0006, and dev admin proxies.

- **User ID** → internal auth email `id@id.hub.x1z10.local`
- **Real email** → normal Supabase `signInWithPassword` / link-email flows

Sync into tool vendors:

```powershell
node E:\Dev\Tool\scripts\sync-hub-identity-vendor.cjs
```
