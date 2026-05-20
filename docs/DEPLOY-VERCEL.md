# P0004 — Deploy trên Vercel

## Tại sao Vercel thay GitHub Pages

- Push `main` → build + deploy tự động (giống chuẩn cho web tool sau này).
- Preview URL cho mỗi PR (tùy bật trên project).
- Custom domain (`infix1.io.vn`) cấu hình trong Vercel, không cần workflow `deploy-pages.yml`.

## Lần đầu (dashboard)

1. [vercel.com/new](https://vercel.com/new) → Import `tuanhoangfx/GitHub-Tool-Manager`.
2. Framework: **Vite** (auto).
3. Build: `pnpm run build` — Output: `dist`.
4. Install: `corepack enable && pnpm install` (hoặc để Vercel dùng default pnpm).
5. Deploy.

## Custom domain `infix1.io.vn`

1. Vercel project → **Settings → Domains** → Add `infix1.io.vn` (và `www` nếu cần).
2. DNS tại registrar: bản ghi Vercel hiển thị (thường `A` / `CNAME`).
3. GitHub repo → **Settings → Pages**: tắt site Pages cũ nếu trùng domain.
4. Cập nhật `tool.manifest.json` / registry `appUrl` nếu đổi URL production.

## Local

```powershell
corepack pnpm install
corepack pnpm build
corepack pnpm preview   # http://127.0.0.1:4176
```

## Push code

```powershell
pnpm run push
```

Không cần `GITHUB_TOKEN` cho push thường ngày (`gh` đã auth).

## Bootstrap repo mới (một lần, không push)

```powershell
$env:GITHUB_TOKEN = "ghp_..."   # fine-grained, repo create
corepack pnpm publish:github:init
```
