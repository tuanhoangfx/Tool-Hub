# P0004 — Production deploy (Vercel)

## Chính sách workspace

- **Web / SPA / Next.js** trong `E:\Dev\Tool\P*` → deploy **Vercel** (GitHub `main` → auto build).
- **Electron / desktop** → `github-release`.
- **Bot / infra systemd** → VPS (`deploy.bat`, `pnpm deploy`).
- **Local-only bridge** → chạy trên máy, không Vercel.

P0004 là catalog hub — production **Vercel-only** (không GitHub Pages).

## Production URL

| URL | Vai trò |
|-----|---------|
| **https://infix1.io.vn** | Custom domain (sau khi DNS trỏ Vercel) |
| **https://github-tool-manager.vercel.app** | Alias Vercel mặc định |

## Vercel project

| Field | Value |
|-------|--------|
| Project | `github-tool-manager` |
| Project ID | `prj_tuOhhInjLzjWDrVYfeQanSqSqWMi` |
| Team | `tuanhoangfxs-projects` |
| Repo | `tuanhoangfx/GitHub-Tool-Manager` |
| Framework | Vite — build `pnpm build`, output `dist` |
| Config | `vercel.json` (SPA rewrites) |

Mỗi `git push` lên `main` → Vercel production deploy (Git integration đã bật).

## DNS (bắt buộc để infix1.io.vn live)

Trên **Tino** (hoặc DNS hiện tại):

1. Xóa / thay bản ghi **A** apex trỏ GitHub Pages (`185.199.x.x`).
2. Thêm: **`A` `infix1.io.vn` → `76.76.21.21`** (theo Vercel Domains).
3. Trên GitHub repo → **Settings → Pages** → tắt site / gỡ custom domain `infix1.io.vn` (tránh trùng).

Sau propagate (~ vài phút–48h): `https://infix1.io.vn` serve bản Vercel.

## Local

```powershell
corepack pnpm install
corepack pnpm dev          # http://127.0.0.1:5176
corepack pnpm build
corepack pnpm preview      # http://127.0.0.1:4176
corepack pnpm scan:local   # refresh public/*.json
```

## CLI deploy (tùy chọn)

```powershell
cd E:\Dev\Tool\P0004-GitHub-Tool-Manager
corepack pnpm dlx vercel@latest deploy --prod --yes --scope tuanhoangfxs-projects
```

## Push code

```powershell
pnpm run push
```

## Catalog trên production

`public/workspace-catalog.json` được copy vào `dist/` khi build — Sync Hub tại `https://infix1.io.vn/?tab=system` đọc file này.
