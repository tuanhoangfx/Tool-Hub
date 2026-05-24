# Tool Hub — Release notes

## Current

- Version: `0.1.0`
- Status: Ready
- Channel: GitHub public repository + Vercel production

## Publish

```powershell
corepack pnpm lint
corepack pnpm build
corepack pnpm publish:github
git push origin main   # triggers Vercel deploy
```

## Custom domain

- Production: https://infix1.io.vn (Vercel project `tool-hub`)
- DNS (Tino): apex **`A` → `76.76.21.21`** (Vercel). Không dùng GitHub Pages IPs.
- Tắt GitHub Pages trên repo `tuanhoangfx/Tool-Hub` sau khi DNS live.

## Notes

- Use `corepack pnpm scan:local` before publishing if local tool registry data changed.
- Revoke any exposed GitHub token after publishing.
