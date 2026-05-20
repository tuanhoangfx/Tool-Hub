# GitHub Tool Manager

Public catalog for workspace tools (Tool Store, registry scan, version drift).

## Commands

```powershell
corepack pnpm install
corepack pnpm scan:local
corepack pnpm dev          # http://127.0.0.1:5176
corepack pnpm build
pnpm run push              # git push main (gh auth)
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

- `public/registry.default.json` — curated catalog
- `corepack pnpm scan:local` — merge into `public/local-registry.json`
- `vercel.json` — SPA rewrites for client routing
