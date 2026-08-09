# Build the Windows installers (NSIS .exe + .msi). Run on Windows with Node 20+ installed.
# Produces release/Architect OS Studio-Setup-<version>.exe and .msi
$ErrorActionPreference = "Stop"
Write-Host "== Architect OS Studio :: Windows build =="

npm ci
node scripts/prepare-engine.mjs
npm run typecheck
npm run build:win

Write-Host "Done. Installers are in .\release"
