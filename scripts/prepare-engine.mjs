/**
 * Copies the Architect OS repository (the compiler "engine") into ./engine so electron-builder
 * can bundle it as an app resource. Run before any packaged build. Excludes VCS, caches, and
 * the app itself. Point ENGINE_SRC at your repo checkout; defaults to a sibling folder.
 *
 *   node scripts/prepare-engine.mjs
 *   ENGINE_SRC=/path/to/Architect-OS node scripts/prepare-engine.mjs
 */
import { cpSync, rmSync, existsSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'

const SRC = process.env.ENGINE_SRC || resolve(process.cwd(), '..', 'Architect-OS')
const DEST = resolve(process.cwd(), 'engine')

if (!existsSync(SRC)) {
  console.error(`[prepare-engine] engine source not found: ${SRC}\n` +
    `Set ENGINE_SRC to your Architect-OS repository checkout.`)
  process.exit(1)
}

const EXCLUDE = new Set(['.git', 'node_modules', '__pycache__', 'release', 'out'])

console.log(`[prepare-engine] copying engine\n  from ${SRC}\n  to   ${DEST}`)
rmSync(DEST, { recursive: true, force: true })
mkdirSync(DEST, { recursive: true })
cpSync(SRC, DEST, {
  recursive: true,
  filter: (s) => {
    const parts = s.split(/[\\/]/)
    if (parts.some((p) => EXCLUDE.has(p))) return false
    if (s.endsWith('.pyc')) return false
    return true
  }
})

if (!existsSync(join(DEST, 'bridge.py'))) {
  console.error('[prepare-engine] WARNING: bridge.py not found in engine. The app cannot call the compiler without it.')
  process.exit(1)
}
console.log('[prepare-engine] done. Remember: a production installer should also bundle a Python 3 runtime under engine/runtime (see ADMIN-GUIDE.md).')
