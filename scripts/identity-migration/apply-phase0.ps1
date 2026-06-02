# Apply Phase 0 SQL on Hub x1z10 P01
param([string]$ProjectRef = "fmnrafpzctuhxjaaomzt")

$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token -and (Test-Path "E:\Dev\.env.shared")) {
  Get-Content "E:\Dev\.env.shared" | ForEach-Object {
    if ($_ -match '^\s*SUPABASE_ACCESS_TOKEN=(.+)$') { $token = $matches[1].Trim('"').Trim("'") }
  }
  $env:SUPABASE_ACCESS_TOKEN = $token
}
if (-not $token) { Write-Error "Missing SUPABASE_ACCESS_TOKEN"; exit 1 }

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$migrations = @(
  "$root\supabase\migrations\20260530160000_hub_workspace_identity_schema.sql",
  "$root\supabase\migrations\20260530140000_hub_user_directory_projects.sql"
)

$uri = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

function Invoke-Sql([string]$Query) {
  $body = (@{ query = $Query } | ConvertTo-Json -Compress -Depth 8)
  try { return Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $body }
  catch { throw "SQL failed: $($_.Exception.Message) $($_.ErrorDetails.Message)" }
}

foreach ($file in $migrations) {
  if (-not (Test-Path $file)) { Write-Warning "Skip missing $file"; continue }
  Write-Host "Applying $(Split-Path $file -Leaf) ..."
  Invoke-Sql (Get-Content -Raw $file) | Out-Null
}

$check = Invoke-Sql @"
select
  to_regclass('public.projects') is not null as projects,
  to_regclass('public.project_members') is not null as members,
  to_regclass('public.legacy_user_map') is not null as user_map;
"@
Write-Host "Tables:" ($check | ConvertTo-Json -Compress)
Write-Host "Phase 0 done."
