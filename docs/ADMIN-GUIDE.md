# Architect OS Studio — Administrator Guide

For whoever packages, distributes, and supports Studio across the Map Ranking team.

## What ships in an installer

1. The Electron app (`out/`).
2. The **engine** — a copy of the Architect OS repository under `resources/engine` (includes
   `bridge.py` + `03-REFERENCE-COMPILER/`). Prepared by `scripts/prepare-engine.mjs`.
3. A **bundled Python runtime** — now automatic. `npm run prep:python`
   (`scripts/fetch-python.mjs`) downloads the official Windows-embeddable Python to
   `engine/runtime/python.exe` and it ships inside the MSI. The Compiler Bridge auto-detects it,
   so the installed app touches no system Python. The compiler is pure standard library
   (optional `jsonschema` only deepens IR validation), so the runtime needs no pip installs.
   (macOS: bundle a `python3` under `engine/runtime/bin/`, or rely on system `python3`.)

## Build the installers

Per OS (electron-builder cannot cross-build signed targets):

- **Windows MSI (recommended)** — one command on Windows 10/11 + Node 20:
  `.\scripts\build-msi.ps1 -EngineSrc C:\path\to\Architect-OS` → `release\ArchitectOSStudioSetup.msi`.
  Self-contained (app + engine + bundled Python). Full guide: `docs/INSTALL-WINDOWS.md`.
- **Windows, no local machine** — push a tag; `.github/workflows/build-windows.yml` builds the
  MSI on a Windows CI runner and attaches it to the Release.
- **macOS** (Node 20+): `bash scripts/build-mac.sh` → `release/*.dmg` (arm64 + x64).

`npm run prep` does the bundling: `prepare-engine` (copy the repo → `engine/`) +
`fetch-python` (Windows-embeddable Python → `engine/runtime/`) + `make-icon`. Set `ENGINE_SRC`
if the Architect-OS repo isn't the sibling `..\Architect-OS`.

## Code signing

- **Windows**: set `CSC_LINK` (path/URL to `.pfx`) and `CSC_KEY_PASSWORD`. Unsigned builds work
  but trigger SmartScreen.
- **macOS**: set `CSC_LINK`/`CSC_KEY_PASSWORD` for signing and `APPLE_ID`,
  `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` for notarization. `build/entitlements.mac.plist`
  is already configured to let the bundled Python run under the hardened runtime.

## Auto-update

Set the `publish` feed in `electron-builder.yml` (generic URL, S3, or GitHub Releases). Run
`scripts/release.sh` on each OS to build + publish. Clients with *Auto updates* on download in
the background and apply on next launch. Rollback = publish a prior version to the feed.

## Rolling out to the team

1. Host the signed installers + the update feed on internal storage.
2. Share the Windows `.exe`/`.msi` and macOS `.dmg`.
3. (Optional) Pre-set a shared **Project location** (Settings) on a synced/network drive so the
   team shares projects; use **Export/Import Project** for hand-offs until cloud sync lands.

## Support workflow

- Ask the user for Settings → **Export logs…** (build/compiler/qa/error logs).
- Logs live in the OS user-data dir; no secrets are written to them (API keys are encrypted via
  `safeStorage` and never logged).

## The AI provider (mockups → blueprint)

Automatic mockup analysis uses the provider chosen in Settings → AI Provider. Configure org
credentials centrally if you standardize on one. With provider = None, the team works from
imported blueprints; deterministic generation (blueprint → kit) always works offline.
