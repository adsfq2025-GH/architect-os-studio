/**
 * Bundle a self-contained Python runtime into engine/runtime so the installed app needs NO
 * Python on the user's machine. Downloads the official Windows embeddable distribution and
 * unpacks it to engine/runtime/ (the Compiler Bridge auto-detects engine/runtime/python.exe).
 *
 * The Architect OS engine is pure standard library (jsonschema only deepens IR validation, and
 * is optional), so the embeddable runtime needs no pip installs. We enable runtime sys.path
 * additions (bridge.py inserts its own paths) by writing an unrestricted ._pth.
 *
 *   node scripts/fetch-python.mjs                 # default: Windows amd64, PY_VERSION below
 *   PY_VERSION=3.12.7 node scripts/fetch-python.mjs
 *
 * Run from a build machine/CI with network access. On non-Windows hosts it still downloads the
 * Windows embeddable zip (it's just files) so the packaged Windows app is self-contained.
 */
import { createWriteStream, existsSync, mkdirSync, rmSync, writeFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { get } from 'https'
import { execSync } from 'child_process'

const PY_VERSION = process.env.PY_VERSION || '3.12.7'
const ARCH = process.env.PY_ARCH || 'amd64' // amd64 | arm64
const URL = `https://www.python.org/ftp/python/${PY_VERSION}/python-${PY_VERSION}-embed-${ARCH}.zip`
const RUNTIME = resolve(process.cwd(), 'engine', 'runtime')
const TMP = resolve(process.cwd(), 'engine', `_py-${PY_VERSION}.zip`)

function download(url, dest) {
  return new Promise((res, rej) => {
    const f = createWriteStream(dest)
    const go = (u) => get(u, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) { go(r.headers.location); return }
      if (r.statusCode !== 200) { rej(new Error(`HTTP ${r.statusCode} for ${u}`)); return }
      r.pipe(f); f.on('finish', () => f.close(() => res()))
    }).on('error', rej)
    go(url)
  })
}

function unzip(zip, dir) {
  mkdirSync(dir, { recursive: true })
  if (process.platform === 'win32') {
    execSync(`powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath '${zip}' -DestinationPath '${dir}'"`, { stdio: 'inherit' })
  } else {
    execSync(`unzip -o -q "${zip}" -d "${dir}"`, { stdio: 'inherit' })
  }
}

async function main() {
  if (existsSync(join(RUNTIME, 'python.exe'))) {
    console.log('[fetch-python] engine/runtime/python.exe already present — skipping')
    return
  }
  console.log(`[fetch-python] downloading ${URL}`)
  rmSync(RUNTIME, { recursive: true, force: true })
  mkdirSync(resolve(process.cwd(), 'engine'), { recursive: true })
  await download(URL, TMP)
  console.log('[fetch-python] extracting to', RUNTIME)
  unzip(TMP, RUNTIME)
  rmSync(TMP, { force: true })

  // Make the embeddable runtime allow runtime sys.path.insert (bridge.py adds its own dirs)
  const pth = readdirSync(RUNTIME).find((f) => /^python\d+\._pth$/.test(f))
  if (pth) {
    writeFileSync(join(RUNTIME, pth), `python${PY_VERSION.split('.').slice(0, 2).join('')}.zip\n.\n\nimport site\n`)
    console.log('[fetch-python] configured', pth)
  }
  console.log('[fetch-python] done — the app is now self-contained (no user Python needed).')
}

main().catch((e) => { console.error('[fetch-python] FAILED:', e.message); process.exit(1) })
