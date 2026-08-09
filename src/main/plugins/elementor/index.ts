/**
 * Elementor compiler backend — the first (and reference) plugin.
 *
 * Thin adapter over the engine bridge: it translates the generic CompilerBackend contract
 * into `analyze`/`compile` bridge commands with builder=elementor, and normalizes the
 * engine's structured result into a CompileResult. All Elementor-specific knowledge lives in
 * the engine (emit_elementor); this adapter carries none of it, so a future Bricks/Webflow
 * plugin is a copy of this file with a different builder id.
 */
import manifestJson from './plugin.json'
import type {
  CompilerBackend, BackendManifest, CompileRequest, CompileResult,
  AnalyzeResult, StageEvent
} from '../types'
import { runBridge } from '../../services/compilerBridge'

const manifest = manifestJson as BackendManifest

async function analyze(req: CompileRequest, onEvent: (e: StageEvent) => void): Promise<AnalyzeResult> {
  onEvent({ stage: 'Analyze', status: 'start' })
  // Pass the ABSOLUTE input path explicitly; the engine must not infer it.
  const res = await runBridge(
    'analyze',
    { input: req.input, project: req.projectDir, irDir: req.irDir, builder: 'elementor' },
    (l) => onEvent({ stage: 'Analyze', status: 'info', detail: l })
  )
  const d = res.data || {}
  const norm: AnalyzeResult = {
    ok: !!d.ok && d.status !== 'error',
    status: d.status,
    reason: d.reason,
    input: d.input,
    filesScanned: d.files_scanned || [],
    supportedFiles: d.supported_files || [],
    detectedPages: d.detected_pages || [],
    pages: d.pages || (d.detected_pages || []).map((p: any) => ({ id: p.id, title: p.title, order: p.order })),
    templates: d.templates || [],
    colors: d.colors || 0,
    assets: d.assets || 0,
    error: res.ok ? d.reason : res.error
  }
  onEvent({ stage: 'Analyze', status: norm.ok ? 'ok' : 'fail', detail: norm.reason })
  return norm
}

async function compile(req: CompileRequest, onEvent: (e: StageEvent) => void): Promise<CompileResult> {
  const res = await runBridge(
    'compile',
    { irDir: req.irDir, projectDir: req.projectDir, slug: req.slug, builder: 'elementor' },
    (line) => {
      // engine prints "STAGE|status|detail|progress" lines to stderr for live logs
      const [stage, status, detail, progress] = line.split('|')
      if (stage && status) {
        onEvent({ stage, status: status as StageEvent['status'], detail, progress: progress ? Number(progress) : undefined })
      } else {
        onEvent({ stage: 'Compile', status: 'info', detail: line })
      }
    }
  )
  if (!res.ok) {
    return {
      ok: false, builder: 'elementor', kitPath: null,
      qa: { result: 'FAIL', checks: [] }, acceptance: { result: 'FAIL', passed: 0, total: 0 },
      fidelity: null, validation: null, needsLive: [], error: res.error, reportPaths: []
    }
  }
  const d = res.data
  return {
    ok: d.ok,
    builder: 'elementor',
    kitPath: d.kitPath ?? null,
    kitSha256: d.kitSha256,
    elements: d.elements,
    qa: d.qa,
    acceptance: d.acceptance,
    fidelity: d.fidelity,
    validation: d.validation,
    design: d.design ?? null,
    needsLive: d.needsLive ?? ['import-round-trip'],
    reportPaths: d.reportPaths ?? [],
    error: d.error
  }
}

const backend: CompilerBackend = { manifest, analyze, compile }
export default backend
