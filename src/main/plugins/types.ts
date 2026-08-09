/**
 * Compiler backend plugin contract.
 *
 * Architect OS Studio talks to every builder (Elementor, Bricks, Webflow, …) through this
 * one interface. Elementor is simply the first installed backend. Adding a builder later
 * means dropping in a new plugin that implements `CompilerBackend` — the desktop app does
 * not change. The UI NEVER touches compiler internals; it only sees this contract via the
 * PluginManager + CompilerBridge.
 */

export interface BackendManifest {
  /** stable id, e.g. "elementor" */
  id: string
  /** display name, e.g. "Elementor" */
  name: string
  /** semver of the backend adapter */
  version: string
  /** one-line description shown in the builder picker */
  description: string
  /** file extension of the produced kit, e.g. "zip" */
  outputExtension: string
  /** whether this backend is production-ready or preview */
  status: 'stable' | 'preview' | 'planned'
  /** QA/fidelity dimensions this backend reports */
  qaDimensions: string[]
}

export interface StageEvent {
  stage: string
  status: 'start' | 'ok' | 'fail' | 'info'
  detail?: string
  /** 0..1 overall progress if known */
  progress?: number
}

export interface CompileRequest {
  /** absolute path to the project root (contains ir/, input/, build/) */
  projectDir: string
  /** absolute path to the IR dir (projectDir/ir) */
  irDir: string
  /** absolute path to the input dir of mockups (projectDir/input) — passed explicitly;
   * the engine must NOT infer it */
  input: string
  /** project slug */
  slug: string
  /** where the final kit + reports should be copied for the user */
  downloadsDir: string
}

export interface FidelityReport {
  overall: number
  dimensions: Record<string, number>
  pass: boolean
  threshold: number
}

/** Design Quality Score (DIOS) — advisory premium-quality score per compile. */
export interface DesignReport {
  overall: number
  mode: string
  pass: boolean
  min_overall: number
  gate_enforced: boolean
  pages: Array<{ id: string; score: number }>
}

export interface CompileResult {
  ok: boolean
  builder: string
  kitPath: string | null
  kitSha256?: string
  elements?: number
  qa: { result: 'PASS' | 'FAIL'; checks: Array<{ id: string; status: string; detail?: string }> }
  acceptance: { result: 'PASS' | 'FAIL'; passed: number; total: number }
  fidelity: FidelityReport | null
  validation: { result: 'PASS' | 'FAIL'; passed: number; total: number } | null
  /** Design Quality Score (advisory) — absent on older engines */
  design?: DesignReport | null
  /** import-round-trip and other live-only gates */
  needsLive: string[]
  /** human-readable error, already mapped (never a raw stack) */
  error?: string
  reportPaths: string[]
}

export interface AnalyzeResult {
  ok: boolean
  status?: 'ok' | 'error'
  reason?: string
  input?: string
  filesScanned?: string[]
  supportedFiles?: string[]
  detectedPages?: Array<{ id: string; title: string; order: number; source?: string; home?: boolean }>
  pages: Array<{ id: string; title: string; order: number }>
  templates: string[]
  colors: number
  assets: number
  error?: string
}

/** What every backend plugin must implement. */
export interface CompilerBackend {
  manifest: BackendManifest
  /** analyze IR / inputs and return a blueprint summary */
  analyze(req: CompileRequest, onEvent: (e: StageEvent) => void): Promise<AnalyzeResult>
  /** run the full compile → package → QA pipeline */
  compile(req: CompileRequest, onEvent: (e: StageEvent) => void): Promise<CompileResult>
}
