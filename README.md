# GitHub Tool Manager

Public catalog and **Sync Hub** for the workspace: Tool, Extension, n8n (local) ↔ GitHub `tuanhoangfx` (2 chiều `tool.manifest.json`).

## Commands

```powershell
corepack pnpm install
corepack pnpm scan:local       # quét 3 root → registry + workspace-catalog
corepack pnpm sync:workspace   # đồng bộ manifest 2 chiều + githubVersion (gh auth / GITHUB_TOKEN)
corepack pnpm sync:workspace:dry
corepack pnpm sync:workspace --clone-missing   # clone repo github-only → E:\Dev\Tool
corepack pnpm dev              # http://127.0.0.1:5176 — System tab = Sync Hub
corepack pnpm build
pnpm run push                  # git push main (gh auth)
```

## Deploy (Vercel)

Production: **Vercel** — push `main` triggers build. Custom domain: `infix1.io.vn`.

Setup: [docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md). Workspace overview: [../DEPLOY.md](../DEPLOY.md).

## Bootstrap GitHub repo (one-time)

```powershell
$env:GITHUB_TOKEN = "ghp_..."
corepack pnpm publish:github:init
pnpm run push
```

Day-to-day push does **not** need `GITHUB_TOKEN`.

## Configuration

- `E:\Dev\Tool\workspace.roots.json` — roots Tool / Extension / n8n
- `public/registry.default.json` — curated catalog (Library)
- `public/workspace-catalog.json` — hub đồng bộ (System → Sync Hub)
- `public/local-registry.json` — snapshot quét Tool
- `vercel.json` — SPA rewrites for client routing
