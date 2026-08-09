# =============================================================================
#  Architect OS Studio — build ArchitectOSStudioSetup.msi  (run ONCE on Windows)
# =============================================================================
#  A team member downloads and installs the resulting MSI — they need nothing else.
#  The BUILD machine needs: Windows 10/11 + Node.js 20+ (only for building, not for users).
#
#  Usage (PowerShell):
#     .\scripts\build-msi.ps1                       # engine auto-detected at ..\Architect-OS
#     .\scripts\build-msi.ps1 -EngineSrc C:\path\to\Architect-OS
#
#  Output:  .\release\ArchitectOSStudioSetup.msi   (self-contained: app + engine + Python)
# =============================================================================
param(
  [string]$EngineSrc = (Join-Path (Split-Path $PSScriptRoot -Parent) "..\Architect-OS")
)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "== Architect OS Studio :: Windows MSI build ==" -ForegroundColor Cyan
Write-Host "Engine source: $EngineSrc"

if (-not (Test-Path $EngineSrc)) {
  throw "Architect-OS engine not found at '$EngineSrc'. Pass -EngineSrc C:\path\to\Architect-OS"
}
$env:ENGINE_SRC = (Resolve-Path $EngineSrc).Path

Write-Host "`n[1/5] Installing build dependencies (npm ci)..." -ForegroundColor Yellow
npm ci

Write-Host "`n[2/5] Bundling the engine + Python runtime..." -ForegroundColor Yellow
npm run prep            # prepare-engine + fetch-python + make-icon

Write-Host "`n[3/5] Type-checking..." -ForegroundColor Yellow
npm run typecheck

Write-Host "`n[4/5] Building the app (electron-vite)..." -ForegroundColor Yellow
npm run build

Write-Host "`n[5/5] Packaging the MSI (electron-builder)..." -ForegroundColor Yellow
npx electron-builder --win msi

$msi = Get-ChildItem -Path .\release -Filter *.msi | Select-Object -First 1
if ($msi) {
  Write-Host "`nDONE." -ForegroundColor Green
  Write-Host "  MSI: $($msi.FullName)"
  Write-Host "  Size: $([math]::Round($msi.Length/1MB,1)) MB"
  Write-Host "`nHand this file to the team. They double-click it, install, launch, and generate." -ForegroundColor Green
} else {
  throw "Build finished but no .msi was produced in .\release"
}
