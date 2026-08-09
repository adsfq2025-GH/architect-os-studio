# Architect OS Studio — Windows Install & MSI Build

## For the team (installing) — zero prerequisites

1. Download **`ArchitectOSStudioSetup.msi`** (from your internal share, or the GitHub Release).
2. Double-click it → Install.
3. Launch **Architect OS Studio** from the Start Menu or Desktop.
4. New Project → upload mockups → Generate → your Elementor kit lands in Downloads.

No Node.js. No Python. No terminal. No engine preparation. The MSI bundles the app, the
Architect OS engine, and a private Python runtime — nothing else is required on the PC.
(The MSI is a per-user install, so it works without administrator rights.)

## Producing the MSI (done once, by one person)

The **build** machine needs Windows 10/11 + Node.js 20+ (only to build — end users never need it).

```powershell
# from the architect-os-studio folder, with the Architect-OS engine repo nearby
.\scripts\build-msi.ps1 -EngineSrc C:\path\to\Architect-OS
```

That single command:
1. installs build dependencies (`npm ci`),
2. bundles the engine (`prepare-engine`) + a Windows-embeddable **Python runtime**
   (`fetch-python` → `engine/runtime/python.exe`) + the app icon,
3. type-checks and builds the app,
4. packages **`release\ArchitectOSStudioSetup.msi`** — self-contained.

Hand that `.msi` to the team. Done.

## Producing the MSI with NO Windows machine (CI)

`.github/workflows/build-windows.yml` builds the MSI on a GitHub **windows-latest** runner:

- Push a tag `v1.0.0` (or run the workflow manually).
- Download `ArchitectOSStudioSetup.msi` from the run's **Artifacts** (and, for tags, the
  auto-created **Release**).

Nobody needs a local Windows dev box. If the engine lives in its own repo, set the repo
variable `ENGINE_REPO`; otherwise commit the engine under `./engine` or let the workflow check
out `Architect-OS`.

## Code signing (recommended, removes SmartScreen warnings)

Set these before building (locally or as CI secrets `WIN_CSC_LINK` / `WIN_CSC_KEY_PASSWORD`):

```
CSC_LINK           = path or base64 of your Authenticode .pfx
CSC_KEY_PASSWORD   = the .pfx password
```

electron-builder signs the app and the MSI automatically when these are present. Unsigned MSIs
still install fine internally; Windows SmartScreen may warn on first run.

## Fleet / GPO deployment (optional)

For central deployment to many machines, set `msi.perMachine: true` in `electron-builder.yml`
and rebuild — the MSI then installs to Program Files (requires admin / GPO) and can be pushed
via Group Policy or Intune.

## What's inside the MSI

```
Architect OS Studio.exe          the Electron app
resources/engine/                the Architect OS compiler (repo copy)
resources/engine/bridge.py       the engine entry point the app calls
resources/engine/runtime/        a private Python runtime (python.exe + stdlib)
```

The app calls `resources/engine/runtime/python.exe resources/engine/bridge.py …` — no system
Python is touched. See `docs/ARCHITECTURE.md` for the Compiler Bridge.

## Related

- `docs/USER-GUIDE.md` — using the app · `docs/ADMIN-GUIDE.md` — distribution & support
- `scripts/build-msi.ps1` · `scripts/fetch-python.mjs` · `scripts/prepare-engine.mjs`
