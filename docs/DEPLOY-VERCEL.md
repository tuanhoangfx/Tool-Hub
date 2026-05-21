# P0004 — Production deploy (GitHub Pages)

## Production URL

- **https://infix1.io.vn** — custom domain trên GitHub Pages (repo `tuanhoangfx/GitHub-Tool-Manager`).
- Workflow: `.github/workflows/deploy-pages.yml` (Vite build → `dist` → Pages).

## Không dùng Vercel cho P0004

- Production chỉ qua **GitHub Pages** — không tạo Vercel project cho repo `GitHub-Tool-Manager`.

## DNS

- `infix1.io.vn` trỏ GitHub Pages (A/CNAME theo GitHub Settings → Pages).
- Sau push `main`, Actions tab → **Deploy GitHub Pages** phải success.

## Local

```powershell
corepack pnpm install
corepack pnpm dev          # http://127.0.0.1:5176
corepack pnpm build
corepack pnpm preview      # http://127.0.0.1:4176
corepack pnpm scan:local   # refresh public/*.json
```

## Push code

```powershell
pnpm run push
```

Nếu push workflow file bị reject (OAuth scope), commit `.github/workflows/deploy-pages.yml` qua GitHub web UI.

## Workspace catalog trên production

File `public/workspace-catalog.json` được copy vào `dist/` khi build — Sync Hub trên https://infix1.io.vn/?tab=system đọc file này.
