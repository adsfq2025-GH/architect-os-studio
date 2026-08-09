#!/usr/bin/env bash
# Cut a release: bump handled by npm version beforehand. Builds both platforms' installers and
# publishes to the configured update feed (electron-builder.yml → publish). Run per-OS
# (electron-builder cannot cross-build signed macOS installers from Windows/Linux).
set -euo pipefail
echo "== Architect OS Studio :: release =="
node scripts/prepare-engine.mjs
npm run typecheck
npm run release
echo "Published. Update feed clients will pick up the new version automatically."
