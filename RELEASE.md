# Release

## Current

- Version: `0.1.0`
- Status: Ready
- Channel: GitHub public repository

## Publish

```powershell
corepack pnpm lint
corepack pnpm build
corepack pnpm publish:github
```

## Custom domain

- Production: https://infix1.io.vn
- GitHub Pages deploys from `.github/workflows/deploy-pages.yml` on push to `main`.
- DNS (Tino): apex `A` → GitHub Pages IPs; `www` CNAME → `tuanhoangfx.github.io`
- In repo **Settings → Pages**, confirm custom domain `infix1.io.vn` and HTTPS.

## Notes

- Use `corepack pnpm scan:local` before publishing if local tool registry data changed.
- Revoke any exposed GitHub token after publishing.
