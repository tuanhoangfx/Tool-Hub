# Deprecated: deploy = Vercel on push to main. Use: pnpm run push
$ErrorActionPreference = "Stop"
Write-Host "push-and-deploy.ps1 deprecated — use: pnpm run push (see docs/DEPLOY-VERCEL.md)" -ForegroundColor Yellow
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "git-push.ps1")
