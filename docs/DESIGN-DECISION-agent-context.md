# Agent context — design decision

**Locked:** Design **V2** (grouped card gallery by kind + Hub analytics chrome).

**Production route:** System → **Agent** (`/system/agent`).

**Removed after lock:** Design Template mockups (`agent-context-mock*`, registry entry, preview CSS).

**Data:** `public/agent-manifest.json` generated at build via `pnpm agent:manifest` (`scripts/sync-agent-manifest.mjs`).

**UI (V2):**

- FilterBar via `SystemHubShell` (same pin/embedded/sticky as Hub & Supabase Quota) + KPI + charts
- Cards via `AgentContextCard` (same layout tokens as `HubToolCard`)
- Body: sections per `kind` with responsive card grid; card opens `AgentContextDetailModal`
- Read-only v1; manifest sync on build and manual **Sync manifest** in toolbar
