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

## Bridge protocol (strict JSON API)

`bridge.py` speaks a strict envelope so stray output can never corrupt the channel:

- **stdout** = exactly ONE JSON envelope, nothing else:
  - success → `{"ok": true, "result": {...}}`
  - failure → `{"ok": false, "error": "...", "traceback": "..."}`
- **stderr** = logs only: progress (`STAGE|status|detail|progress`), scan logs, and any stray
  `print()` from imported modules (the handler runs under `redirect_stdout(sys.stderr)`).
- `ok` is **transport** success (the bridge ran). **Domain** outcomes (no pages, IR invalid)
  live inside `result` with their own `status`/`ok` — so the app tells "engine crashed" apart
  from "engine ran and found nothing".

`compilerBridge.ts` parses the last stdout line as the envelope: `env.ok` → `data = env.result`;
`!env.ok` → surfaces `env.error` + `env.traceback`; no valid envelope → `ENGINE_BAD_OUTPUT` with
the raw stdout attached.

## Analyzer input contract

- The app passes the **absolute** input folder explicitly:
  `analyze { input: "<project>/input", project, irDir, builder }`. The engine never infers it —
  absent `input` → `result.reason = "no_input_path"`.
- The engine logs the path + every file found (stderr), accepts PNG/JPG/JPEG/WebP/PDF
  case-insensitively, detects one page per mockup (title from filename), and returns
  `{status, reason, input, files_scanned, supported_files, detected_pages}`.

## Developer Diagnostics

Sidebar → Diagnostics. `compilerBridge.ts` records every command (command, args, exact argv,
timing, ok/fail, **raw stdout**, stderr tail, traceback) into a ring buffer, streamed via
`diagnostics:command` / `diagnostics:list`. On `ENGINE_BAD_OUTPUT` the error panels auto-show
the raw stdout (`components/EngineOutput.tsx`) so a protocol violation is instantly visible.

## Conventions

- The renderer never imports Node/Electron/fs. All privileged work is an IPC handler.
- Every backend goes through `CompilerBackend`; never call the bridge from the UI.
- Errors surfaced to users go through `errorMap.ts` (human message + recovery action); raw
  detail goes to logs only.
- Determinism: never introduce time/random into generated artifacts (the engine fixes both).
