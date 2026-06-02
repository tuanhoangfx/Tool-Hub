# Apply profiles RLS recursion fix (20260531130000)
param(
  [string]$ProjectRef = "fmnrafpzctuhxjaaomzt",
  [string]$MigrationFile = "$PSScriptRoot\..\supabase\migrations\20260531130000_fix_profiles_rls_recursion.sql"
)

$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token -and (Test-Path "E:\Dev\.env.shared")) {
  Get-Content "E:\Dev\.env.shared" | ForEach-Object {
    if ($_ -match '^\s*SUPABASE_(?:ACCESS|MANAGEMENT)_TOKEN=(.+)$') { $token = $matches[1].Trim('"').Trim("'") }
  }
  $env:SUPABASE_ACCESS_TOKEN = $token
}
if (-not $token) {
  Write-Error "Missing SUPABASE_ACCESS_TOKEN"
  exit 1
}

if (-not (Test-Path $MigrationFile)) {
  Write-Error "Migration not found: $MigrationFile"
  exit 1
}

$uri = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
}

$sql = Get-Content -Raw -Path $MigrationFile
$body = (@{ query = $sql } | ConvertTo-Json -Compress -Depth 8)

try {
  $result = Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $body
  Write-Host "Applied: $MigrationFile"
  if ($result) { $result | ConvertTo-Json -Depth 5 }
} catch {
  $detail = $_.ErrorDetails.Message
  Write-Error "SQL failed: $($_.Exception.Message) $detail"
  exit 1
}
