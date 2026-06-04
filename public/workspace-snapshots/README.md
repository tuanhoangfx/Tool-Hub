# Workspace snapshots (read-only mirror)

Git-tracked copies of workspace-wide config. **Do not edit here** — change sources then run:

```powershell
node E:\Dev\Tool\scripts\sync-workspace-snapshots.cjs
# or from P0004:
corepack pnpm run sync:snapshots
```

| File | Source of truth |
|------|-----------------|
| `workspace-ports.json` | `Tool/scripts/lib/workspace-ports.json` |
| `schemas/*.json` | `Tool/schemas/` |
| `TOOL-CODES.md` | `Tool/TOOL-CODES.md` |

Used by Hub catalog, `scan:local`, `ensure-dev`, and Agent manifest (`ui-patterns.catalog.json`).
