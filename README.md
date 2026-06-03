# Tool Hub

Workspace **Tool Hub** (P0004): catalog mọi project đang chạy — GitHub health, drift, local registry.

Production: **https://infi.io.vn** (Vercel). Dev: `http://127.0.0.1:5176`.

**Agent / Hub UI catalog:** [AGENTS.md](./AGENTS.md) · Cursor **`/hub-ui`** · System → Agent tab.

## Commands

```powershell
corepack pnpm install
corepack pnpm scan:local       # quét workspace → local-registry + workspace-catalog
corepack pnpm sync:workspace   # đồng bộ manifest 2 chiều (gh auth / GITHUB_TOKEN)
corepack pnpm sync:workspace:dry
corepack pnpm sync:workspace --clone-missing
corepack pnpm open             # start/reuse Vite daemon (agents: prefer this — never kills healthy server)
corepack pnpm hub-ui:stack     # refresh @tool-workspace/hub-ui + agent-manifest (Hub UI catalog)
corepack pnpm agent:manifest   # rebuild public/agent-manifest.json only
corepack pnpm dev              # foreground dev + launcher (human interactive)
corepack pnpm dev:restart      # kill port 5176 + fresh Vite (only when stuck)
corepack pnpm build
pnpm run push                  # git push main (gh auth)
```

## Deploy (Vercel)

Push `main` triggers build. Custom domain: `infi.io.vn`.

Setup: [docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md). Workspace overview: [../DEPLOY.md](../DEPLOY.md).

## Bootstrap GitHub repo (one-time)

```powershell
$env:GITHUB_TOKEN = "ghp_..."
corepack pnpm publish:github:init
pnpm run push
```

## Configuration

- `E:\Dev\Tool\workspace.roots.json` — roots Tool / Extension / n8n
- `public/registry.default.json` — curated catalog
- `public/workspace-catalog.json` — snapshot sync workspace
- `public/local-registry.json` — output `scan:local`
- `vercel.json` — SPA rewrites

GitHub: `tuanhoangfx/Tool-Hub` · Vercel project: `tool-hub` · Folder: `P0004-Tool-Hub`
