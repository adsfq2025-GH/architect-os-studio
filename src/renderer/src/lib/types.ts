export type ProjectStatus = 'draft' | 'analyzing' | 'ready' | 'building' | 'completed' | 'failed'

export interface Project {
  id: string
  client: string
  name: string
  websiteType: string
  builder: string
  theme: string
  status: ProjectStatus
  favorite: number
  archived: number
  dir: string
  createdAt: number
  updatedAt: number
  lastBuildAt: number | null
  fidelity: number | null
  qaResult: string | null
}

export interface BackendManifest {
  id: string
  name: string
  version: string
  description: string
  outputExtension: string
  status: 'stable' | 'preview' | 'planned'
  qaDimensions: string[]
}

export interface Settings {
  defaultBuilder: string
  defaultTheme: string
  downloadsDir: string
  projectLocation: string
  autoSave: boolean
  autoBackup: boolean
  autoUpdates: boolean
  aiProvider: string
  aiModel?: string
  performanceMode: 'balanced' | 'fast' | 'thorough'
  uiTheme: 'dark' | 'light' | 'system'
  autoDownload: boolean
}

export interface StageEvent {
  projectId: string
  stage: string
  status: 'start' | 'ok' | 'fail' | 'info'
  detail?: string
  progress?: number
}

export interface AnalyzeResult {
  ok: boolean
  status?: 'ok' | 'error'
  reason?: string
  input?: string
  filesScanned?: string[]
  supportedFiles?: string[]
  detectedPages?: Array<{ id: string; title: string; order: number; source?: string; home?: boolean }>
  pages?: Array<{ id: string; title: string; order: number }>
  templates?: string[]
  colors?: number
  assets?: number
  error?: string
  friendly?: { title: string; message: string; action: string }
}

export interface BridgeCommand {
  id: number
  at: string
  command: string
  args: Record<string, unknown>
  engineDir: string
  python: string
  bridge: string
  argv: string
  ok?: boolean
  error?: string
  traceback?: string
  durationMs?: number
  stderrTail?: string
  rawStdout?: string
}

export interface CompileResult {
  ok: boolean
  builder: string
  kitPath: string | null
  kitSha256?: string
  elements?: number
  qa: { result: 'PASS' | 'FAIL'; checks: Array<{ id: string; status: string; detail?: string }> }
  acceptance: { result: 'PASS' | 'FAIL'; passed: number; total: number }
  fidelity: { overall: number; dimensions: Record<string, number>; pass: boolean; threshold: number } | null
  validation: { result: 'PASS' | 'FAIL'; passed: number; total: number } | null
  needsLive: string[]
  error?: string
}

export interface GenerateResponse {
  ok: boolean
  error?: string
  friendly?: { title: string; message: string; action: string }
  result?: CompileResult
  delivery?: { folder: string; kit: string | null; reports: string[] }
}
