# Apply workspace_user_directory project enrichment on x1z10 P01
param(
  [string]$ProjectRef = "fmnrafpzctuhxjaaomzt",
  [string]$MigrationFile = "$PSScriptRoot\..\supabase\migrations\20260530140000_hub_user_directory_projects.sql"
)

$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token) {
  Write-Error "Missing SUPABASE_ACCESS_TOKEN (set in env or E:\Dev\.env.shared)"
  exit 1
}

if (-not (Test-Path $MigrationFile)) {
  Write-Error "Migration file not found: $MigrationFile"
  exit 1
}

$uri = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
}

function Invoke-Sql([string]$Query) {
  $body = (@{ query = $Query } | ConvertTo-Json -Compress -Depth 5)
  try {
    return Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $body
  } catch {
    $detail = $_.ErrorDetails.Message
    throw "SQL failed: $($_.Exception.Message) $detail"
  }
}

Write-Host "Checking project tables on $ProjectRef..."
$tables = Invoke-Sql @"
select
  to_regclass('public.project_members') is not null as has_project_members,
  to_regclass('public.projects') is not null as has_projects,
  to_regclass('public.activity_logs') is not null as has_activity_logs;
"@
Write-Host ($tables | ConvertTo-Json -Compress)

$sql = Get-Content -Raw -Path $MigrationFile
Write-Host "Applying $MigrationFile ..."
Invoke-Sql $sql | Out-Null

$fn = Invoke-Sql "select proname from pg_proc where proname = 'workspace_user_directory' limit 1;"
Write-Host "Function present:" ($fn | ConvertTo-Json -Compress)
Write-Host "Done."
