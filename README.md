# Architect OS Studio

**Turn website mockups into importable Elementor websites.**

A cross-platform desktop app (Windows + macOS) that lets non-technical users generate complete
Elementor Website Kits from mockups — no command line, no repository, no JSON. The Architect OS
compiler is the engine; this app is the product.

## For users (Windows)

Download **`ArchitectOSStudioSetup.msi`** → install → launch → New Project → upload mockups →
Generate → your `website-kit.zip` lands in Downloads, ready for **Elementor → Tools → Import
Kit**. No Node.js, no Python, no terminal — the MSI bundles everything.
See [docs/USER-GUIDE.md](docs/USER-GUIDE.md) and [docs/INSTALL-WINDOWS.md](docs/INSTALL-WINDOWS.md).

## Build the Windows MSI (once, by an admin)

```powershell
.\scripts\build-msi.ps1 -EngineSrc C:\path\to\Architect-OS   # → release\ArchitectOSStudioSetup.msi
```

Or push a git tag and let `.github/workflows/build-windows.yml` build it on a Windows CI runner
(no local Windows machine needed). Details in [docs/INSTALL-WINDOWS.md](docs/INSTALL-WINDOWS.md).

## For developers

```bash
npm install
npm run dev            # electron-vite dev (HMR) + Electron
npm run typecheck
node scripts/prepare-engine.mjs   # copy the Architect OS repo into ./engine
npm run build:win      # or build:mac  → installers in ./release
```

Stack: Electron · React + TypeScript · Tailwind · Zustand · SQLite (better-sqlite3) ·
electron-builder · electron-updater. Engine: the Architect OS repo via `bridge.py`.

## Architecture in one line

`UI → IPC → Project/Settings → Plugin Manager → Compiler Bridge → Architect OS engine →
Elementor translator → package → QA → Output Manager`. The UI never touches compiler
internals. Every builder is a plugin implementing one `CompilerBackend` contract — **Elementor
is the first; Bricks, Breakdance, Webflow, Shopify, and Gutenberg drop in without changing the
app.** Full detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Honest scope

- **Fully wired, offline, deterministic:** blueprint (IR) → Elementor Website Kit → QA →
  delivery. Same code as the `architect` CLI.
- **Needs an AI provider:** automatic mockups → blueprint (Settings → AI Provider); without one,
  import existing blueprints.
- **Needs live (never faked):** "imports with zero errors" into WordPress is confirmed by the
  engine's `verify/` harness on a real install; the app reports it as *Needs live*.

## Docs

[User Guide](docs/USER-GUIDE.md) · [Administrator Guide](docs/ADMIN-GUIDE.md) ·
[Developer Guide](docs/DEVELOPER-GUIDE.md) · [Architecture](docs/ARCHITECTURE.md)

© 2026 Map Ranking. All rights reserved.
