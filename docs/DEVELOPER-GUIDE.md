# Architect OS Studio — Developer Guide

## Stack

Electron + electron-vite · React 18 + TypeScript · Tailwind CSS · Zustand · better-sqlite3 ·
electron-store · electron-updater · pdfkit · electron-builder. Engine: the Architect OS repo
(Python, stdlib) called through `bridge.py`.

## Prerequisites

- Node 20+, npm.
- A checkout of the Architect OS repository (the engine).
- Python 3.8+ on PATH for dev (production bundles its own — see ADMIN-GUIDE).

## Run in development

```bash
npm install
# point the bridge at your engine checkout (dev auto-detects a sibling ../Architect-OS too)
# optional: set enginePath/pythonPath in Settings → Advanced after first launch
npm run dev
```

electron-vite serves the renderer with HMR and launches Electron. To try the full pipeline
without an AI provider, import/point a project IR at the bundled Painter example (the engine's
`examples/painter`), or set a project's `ir/` to an existing blueprint.

## Project layout

```
src/main/        Electron main process
  index.ts         window + lifecycle + auto-update
  ipc.ts           typed IPC + workflow orchestration
  services/        logger, settingsStore, projectStore(SQLite), compilerBridge,
                   pluginManager, outputManager, reports(pdfkit), errorMap
  plugins/         backend contract (types.ts) + elementor/ (first backend)
src/preload/     contextBridge (window.studio) + types
src/renderer/    React app (screens/, components/, store.ts, lib/)
scripts/         prepare-engine, build-win, build-mac, release
docs/            architecture + guides
build/           icons + entitlements
```

## Add a new compiler backend (e.g. Bricks)

1. Implement the engine side: a `--builder=bricks` path in the compiler + a `compile`/`analyze`
   branch in `bridge.py` (or a builder arg it already forwards).
2. Create `src/main/plugins/bricks/{plugin.json,index.ts}` — copy `elementor/index.ts`, change
   the `builder` id and manifest. It implements the same `CompilerBackend` contract.
3. Register it in `pluginManager.ts` (`this.register(bricks)`), and remove it from `PLANNED`.
4. Done — the New Project builder picker, workflow, QA, and output screens pick it up with no
   further changes.

## Typecheck & build

```bash
npm run typecheck        # node + web projects
node scripts/prepare-engine.mjs
npm run build            # electron-vite build → out/
npm run build:win        # or build:mac — electron-builder installers
```

## Analyzer input contract + Developer Diagnostics

- The app passes the **absolute** input folder to the engine explicitly:
  `analyze { input: "<project>/input", project, irDir, builder }`. The engine must NOT infer
  the input directory — if `input` is absent it returns `{status:"error", reason:"no_input_path"}`.
- `bridge.py` logs the received path and every file found (to stderr → the live log), accepts
  PNG/JPG/JPEG/WebP/PDF case-insensitively, detects one page per mockup (title from filename),
  and returns `{status, reason, input, files_scanned, supported_files, detected_pages}`.
- **Developer Diagnostics** (sidebar → Diagnostics): `compilerBridge.ts` records every command
  sent to `bridge.py` (command, args, exact argv, timing, ok/fail, stderr tail) into a ring
  buffer, streamed to the renderer via `diagnostics:command` / `diagnostics:list`. Use it to see
  precisely what the UI asked the engine to do.

## Conventions

- The renderer never imports Node/Electron/fs. All privileged work is an IPC handler.
- Every backend goes through `CompilerBackend`; never call the bridge from the UI.
- Errors surfaced to users go through `errorMap.ts` (human message + recovery action); raw
  detail goes to logs only.
- Determinism: never introduce time/random into generated artifacts (the engine fixes both).
