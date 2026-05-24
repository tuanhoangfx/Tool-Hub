# Tool Hub

Workspace **Tool Hub** (P0004): catalog mọi project đang chạy — GitHub health, drift, local registry.

Production: **https://infix1.io.vn** (Vercel). Dev: `http://127.0.0.1:5176`.

## Commands

```powershell
corepack pnpm install
corepack pnpm scan:local       # quét workspace → local-registry + workspace-catalog
corepack pnpm sync:workspace   # đồng bộ manifest 2 chiều (gh auth / GITHUB_TOKEN)
corepack pnpm sync:workspace:dry
corepack pnpm sync:workspace --clone-missing
corepack pnpm dev              # Tool Hub local
corepack pnpm build
pnpm run push                  # git push main (gh auth)
```

## Deploy (Vercel)

Push `main` triggers build. Custom domain: `infix1.io.vn`.

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
