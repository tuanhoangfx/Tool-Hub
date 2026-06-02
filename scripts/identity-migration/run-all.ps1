# Phase 0 + export + import (requires service role keys in .env.local files)
$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
& "$here\apply-phase0.ps1"
Set-Location (Resolve-Path "$here\..\..")
pnpm identity:export
pnpm identity:import:dry
Write-Host "Review dry-run output. Then: pnpm identity:import"
