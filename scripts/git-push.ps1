# Push GitHub — chạy qua `pnpm run push` (cwd = root repo).
# Bản canonical: Tool/scripts/git-push.ps1 (đồng bộ khi sửa).
param(
  [string]$Remote = "origin",
  [string]$Branch = "main"
)
$ErrorActionPreference = "Stop"

$ghOk = $false
try {
  gh auth status 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $ghOk = $true }
} catch {}

if ($ghOk) {
  Write-Host "==> Push (gh credential) $Remote $Branch"
  git push $Remote $Branch
} else {
  Write-Host '==> gh chua login — chay: gh auth login -h github.com -p https -w (browser Cursor)'
  Write-Host "==> Fallback: Credential Manager"
  git -c credential.https://github.com.helper=manager push $Remote $Branch
}
