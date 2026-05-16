# Push main and trigger GitHub Pages deploy.
# Usage: $env:GITHUB_TOKEN = "ghp_..." ; .\scripts\push-and-deploy.ps1

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

if (-not $env:GITHUB_TOKEN) {
  Write-Host "Set GITHUB_TOKEN first (GitHub PAT with repo scope)."
  Write-Host '  $env:GITHUB_TOKEN = "ghp_..."'
  exit 1
}

$owner = if ($env:GITHUB_OWNER) { $env:GITHUB_OWNER } else { "tuanhoangfx" }
$repo = if ($env:GITHUB_REPO) { $env:GITHUB_REPO } else { "GitHub-Tool-Manager" }
$pushUrl = "https://x-access-token:$($env:GITHUB_TOKEN)@github.com/$owner/$repo.git"
$cleanUrl = "https://github.com/$owner/$repo.git"

git remote set-url origin $pushUrl
try {
  git push -u origin HEAD:main
  Write-Host "Pushed. Check: https://github.com/$owner/$repo/actions"
  Write-Host "Pages: Settings -> Pages -> Build: GitHub Actions, domain infix1.io.vn"
} finally {
  git remote set-url origin $cleanUrl
}
