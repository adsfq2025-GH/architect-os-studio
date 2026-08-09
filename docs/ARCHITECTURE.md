# Architect OS Studio — Architecture

Architect OS Studio is the user-facing desktop product; the Architect OS repository is the
compiler **engine**. The app never reimplements compiler logic — it wraps it behind a clean
bridge so the same engine that runs on the command line runs under the GUI.

## Layered design

```
UI Layer (React renderer, sandboxed)
   │  window.studio (contextBridge) — the only surface the UI can touch
   ▼
IPC Layer (src/main/ipc.ts) ── Workflow orchestration (analyze → compile → deliver)
   ▼
Project Manager (projectStore, SQLite)   Settings (settingsStore, encrypted secrets)
   ▼
Plugin Manager (compiler backends registry)
   ▼
Compiler Bridge (compilerBridge.ts) ── spawns the engine, JSON protocol, live logs
   ▼
Architect OS Compiler (engine/bridge.py → 03-REFERENCE-COMPILER/compiler)
   ▼
Elementor Translator → Package Generator → QA / Fidelity / Validation
   ▼
Output Manager (outputManager.ts) ── kit + PDF reports → Downloads/<Client>-<Project>/
```

The UI has **no** access to Node, the filesystem, or the compiler. Everything privileged runs
in the main process and is exposed only through the whitelisted `window.studio` channels
(`src/preload/index.ts`).

## The plugin architecture (why Elementor is just the first backend)

Every builder implements one contract — `CompilerBackend` (`src/main/plugins/types.ts`):
`analyze()` and `compile()`, plus a `BackendManifest`. The `PluginManager` registers backends
and advertises planned ones (Bricks, Breakdance, Webflow, Shopify, Gutenberg) as disabled
roadmap entries. The UI, workflow, project store, and output manager are all builder-agnostic;
they only ever see the contract.

Adding a builder later = drop in a new plugin folder that implements `CompilerBackend`
(a near-copy of `plugins/elementor/index.ts` with a different `builder` id) and register it.
**No UI or workflow changes.** That is what makes Studio a platform, not an Elementor tool.

## The Compiler Bridge protocol

`compilerBridge.ts` resolves the engine dir (bundled `resources/engine` in production, or a
dev repo path), locates Python, and runs `engine/bridge.py` with a JSON command:

```
python bridge.py '{"command":"compile","args":{"irDir":...,"projectDir":...,"slug":...,"builder":"elementor"}}'
```

- **Result**: one JSON object on the last stdout line (kit path, sha, QA/acceptance/fidelity/
  validation, needs-live gates, report paths).
- **Live logs**: `STAGE|status|detail|progress` lines on stderr, streamed to the UI's log view
  and the pipeline stepper.

`bridge.py` calls the exact same code paths as the `architect` CLI — single source of truth.

## Data + files

- **Index**: SQLite (`better-sqlite3`) at `userData/projects.db` — fast dashboard queries,
  favorites, build history.
- **Source of truth**: `Documents/Architect OS/Projects/<Client>/<Project>/` with
  `input/ assets/ ir/ build/ reports/ output/`. The user never creates folders.
- **Delivery**: `Downloads/<Client>-<Project>/website-kit.zip` + PDF reports, mirrored into the
  project's `output/`.
- **Secrets**: API keys encrypted via Electron `safeStorage`; never written in plaintext, never
  sent to the renderer.

## The honest boundary

The deterministic half — **blueprint (IR) → Elementor Website Kit → QA** — is fully wired and
runs offline. The **mockups → blueprint** step is AI vision analysis; it runs through the
configured AI provider (Settings → AI Provider). With no provider, the app imports existing
blueprints. And **live "imports with zero errors" into WordPress** is confirmed post-export by
the `verify/` harness in the engine — the app reports it as *Needs live*, never as passed.

## Process/security model

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false` (needed for preload
  bridge), strict CSP in `index.html`.
- Renderer → main only via typed IPC. No remote module. External links open in the OS browser.
- Auto-update via `electron-updater` (generic feed), silent background download, notify-on-ready.
