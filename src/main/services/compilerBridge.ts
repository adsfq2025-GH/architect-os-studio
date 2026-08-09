/**
 * Compiler Bridge — the ONLY place the app touches the Architect OS engine.
 *
 * It resolves the engine location (bundled under resources/engine in production, or a
 * developer-configured repo path in dev), locates a Python 3 interpreter, and runs the
 * engine's `bridge.py` with a JSON command over argv/stdout. Backend plugins call these
 * helpers; the UI never does. Raw stderr/stack traces are logged but never surfaced —
 * errorMap turns failures into human-readable messages upstream.
 */
import { app } from 'electron'
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { logger } from './logger'
import { settingsStore } from './settingsStore'

export interface BridgeResponse {
  ok: boolean
  data?: any
  error?: string
  /** python traceback when the engine raised (from the failure envelope) */
  traceback?: string
  /** raw stage lines emitted by the engine (for live logs) */
  stderr?: string
  /** exact bytes the engine wrote to stdout (shown verbatim on ENGINE_BAD_OUTPUT) */
  rawStdout?: string
}

// ---------- Developer Diagnostics: record every command sent to bridge.py ----------
export interface BridgeCommandRecord {
  id: number
  at: string
  command: string
  args: Record<string, unknown>
  engineDir: string
  python: string
  bridge: string
  argv: string          // exactly what is passed to the interpreter
  ok?: boolean
  error?: string
  traceback?: string
  durationMs?: number
  stderrTail?: string
  /** full raw stdout the engine produced — the envelope, or garbage on ENGINE_BAD_OUTPUT */
  rawStdout?: string
}
const commandLog: BridgeCommandRecord[] = []
let _seq = 0
let _onCommand: ((rec: BridgeCommandRecord) => void) | null = null
export function onBridgeCommand(cb: (rec: BridgeCommandRecord) => void) { _onCommand = cb }
export function getCommandLog(): BridgeCommandRecord[] { return commandLog.slice(-100) }
function record(rec: BridgeCommandRecord) {
  commandLog.push(rec)
  if (commandLog.length > 200) commandLog.shift()
  try { _onCommand?.(rec) } catch { /* ignore */ }
}

function resolveEngineDir(): string {
  // 1) explicit override (developer / advanced setting)
  const override = settingsStore.get('enginePath') as string | undefined
  if (override && existsSync(override)) return override
  // 2) bundled resource in a packaged app
  const packaged = join(process.resourcesPath || '', 'engine')
  if (existsSync(packaged)) return packaged
  // 3) dev fallback: sibling repo checkout
  const devGuess = join(app.getAppPath(), '..', 'Architect-OS')
  if (existsSync(devGuess)) return devGuess
  return packaged // return the expected path even if missing; caller surfaces a clean error
}

function resolvePython(): string {
  const override = settingsStore.get('pythonPath') as string | undefined
  if (override) return override
  // A production installer bundles a Python runtime under resources/engine/runtime.
  const bundled = process.platform === 'win32'
    ? join(process.resourcesPath || '', 'engine', 'runtime', 'python.exe')
    : join(process.resourcesPath || '', 'engine', 'runtime', 'bin', 'python3')
  if (existsSync(bundled)) return bundled
  return process.platform === 'win32' ? 'python' : 'python3'
}

/** Run one bridge command. `onLine` receives engine stage lines for live logs. */
export function runBridge(
  command: string,
  args: Record<string, unknown>,
  onLine?: (line: string) => void
): Promise<BridgeResponse> {
  const engine = resolveEngineDir()
  const python = resolvePython()
  const bridge = join(engine, 'bridge.py')

  if (!existsSync(bridge)) {
    const msg = `engine bridge not found at ${bridge}`
    logger.error(msg)
    return Promise.resolve({ ok: false, error: 'ENGINE_MISSING' })
  }

  const payload = JSON.stringify({ command, args })
  logger.compiler(`bridge ${command} :: ${payload}`)

  const rec: BridgeCommandRecord = {
    id: ++_seq, at: new Date().toISOString(), command, args,
    engineDir: engine, python, bridge, argv: `${python} bridge.py '${payload}'`
  }
  record(rec)
  const started = Date.now()

  return new Promise((resolve) => {
    const child = spawn(python, [bridge, payload], { cwd: engine })
    let out = ''
    let err = ''
    const finish = (r: BridgeResponse) => {
      rec.ok = r.ok; rec.error = r.error; rec.traceback = r.traceback
      rec.durationMs = Date.now() - started
      rec.stderrTail = (r.stderr || '').split('\n').filter(Boolean).slice(-8).join('\n')
      rec.rawStdout = r.rawStdout
      record({ ...rec })
      resolve(r)
    }

    child.stdout.on('data', (b) => { out += b.toString() })
    child.stderr.on('data', (b) => {
      const s = b.toString()
      err += s
      s.split('\n').filter(Boolean).forEach((l: string) => onLine?.(l))
    })
    child.on('error', (e) => {
      logger.error(`spawn failed: ${e.message}`)
      finish({ ok: false, error: 'PYTHON_MISSING', stderr: err, rawStdout: out })
    })
    child.on('close', (code) => {
      // STRICT PROTOCOL: stdout is exactly one JSON envelope. Parse it regardless of exit code.
      const lastLine = out.trim().split('\n').filter(Boolean).pop() || ''
      let env: any = null
      try { env = JSON.parse(lastLine) } catch { /* not JSON */ }

      if (env && typeof env.ok === 'boolean') {
        if (env.ok) {
          // Strict protocol wraps the payload in `result`; older engines returned the payload
          // at the top level. Tolerate both so app/engine version skew can't break analysis.
          const data = env.result !== undefined ? env.result : env
          finish({ ok: true, data, stderr: err, rawStdout: out })
        } else {
          logger.error(`bridge ${command} engine error: ${env.error || env.reason}\n${env.traceback || ''}`)
          finish({ ok: false, error: env.error || env.reason || 'ENGINE_ERROR', traceback: env.traceback, stderr: err, rawStdout: out })
        }
        return
      }

      // No valid envelope on stdout → protocol violation. Surface the raw stdout for debugging.
      logger.error(`bridge ${command}: no JSON envelope on stdout (exit ${code}). stdout=${out.slice(0, 800)}`)
      finish({ ok: false, error: 'ENGINE_BAD_OUTPUT', stderr: err, rawStdout: out })
    })
  })
}

export function engineInfo() {
  return { engineDir: resolveEngineDir(), python: resolvePython() }
}
