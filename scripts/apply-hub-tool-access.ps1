# Apply hub_tools + tool_access migration on x1z10 P01
param([string]$ProjectRef = "fmnrafpzctuhxjaaomzt")

$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token -and (Test-Path "E:\Dev\.env.shared")) {
  Get-Content "E:\Dev\.env.shared" | ForEach-Object {
    if ($_ -match '^\s*SUPABASE_(?:ACCESS|MANAGEMENT)_TOKEN=(.+)$') { $token = $matches[1].Trim('"').Trim("'") }
  }
  $env:SUPABASE_ACCESS_TOKEN = $token
}
if (-not $token) { Write-Error "Missing SUPABASE_ACCESS_TOKEN"; exit 1 }

$root = Split-Path -Parent $PSScriptRoot
$file = "$root\supabase\migrations\20260531120000_hub_tool_access.sql"
if (-not (Test-Path $file)) { Write-Error "Missing $file"; exit 1 }

$uri = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

function Invoke-Sql([string]$Query) {
  $body = (@{ query = $Query } | ConvertTo-Json -Compress -Depth 8)
  try { return Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $body }
  catch { throw "SQL failed: $($_.Exception.Message) $($_.ErrorDetails.Message)" }
}

Write-Host "Applying $(Split-Path $file -Leaf) ..."
Invoke-Sql (Get-Content -Raw $file) | Out-Null

$check = Invoke-Sql @"
select
  to_regclass('public.hub_tools') is not null as hub_tools,
  to_regclass('public.tool_access') is not null as tool_access;
"@
Write-Host "Tables:" ($check | ConvertTo-Json -Compress)
Write-Host "Tool access migration done."
