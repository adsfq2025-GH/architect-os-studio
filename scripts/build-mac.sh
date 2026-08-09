#!/usr/bin/env bash
# Build the macOS installer (universal DMG, arm64 + x64). Run on macOS with Node 20+.
# For a signed + notarized build, export before running:
#   export CSC_LINK=/path/to/cert.p12 CSC_KEY_PASSWORD=... APPLE_ID=... APPLE_APP_SPECIFIC_PASSWORD=... APPLE_TEAM_ID=...
set -euo pipefail
echo "== Architect OS Studio :: macOS build =="

npm ci
node scripts/prepare-engine.mjs
npm run typecheck
npm run build:mac

echo "Done. DMGs are in ./release"
