import { create } from 'zustand'
import type { Project, Settings, BackendManifest, StageEvent, CompileResult, AnalyzeResult, BridgeCommand } from './lib/types'
import { studio } from './lib/ipc'

export type Route =
  | { name: 'dashboard' }
  | { name: 'new' }
  | { name: 'upload'; projectId: string }
  | { name: 'analysis'; projectId: string }
  | { name: 'blueprint'; projectId: string }
  | { name: 'generate'; projectId: string }
  | { name: 'qa'; projectId: string }
  | { name: 'output'; projectId: string }
  | { name: 'settings' }
  | { name: 'diagnostics' }

interface AppState {
  route: Route
  projects: Project[]
  settings: Settings | null
  backends: BackendManifest[]
  appInfo: { version: string; platform: string } | null

  // per-run workflow state
  stages: StageEvent[]
  analyze: AnalyzeResult | null
  lastResult: CompileResult | null
  lastDelivery: { folder: string; kit: string | null; reports: string[] } | null

  // developer diagnostics — every command sent to bridge.py
  diagnostics: BridgeCommand[]

  go: (route: Route) => void
  bootstrap: () => Promise<void>
  refreshProjects: (search?: string, sort?: string) => Promise<void>
  saveSettings: (patch: Partial<Settings>) => Promise<void>
  pushStage: (e: StageEvent) => void
  resetRun: () => void
  setAnalyze: (a: AnalyzeResult | null) => void
  setResult: (r: CompileResult | null, d: AppState['lastDelivery']) => void
}

export const useApp = create<AppState>((set, get) => ({
  route: { name: 'dashboard' },
  projects: [],
  settings: null,
  backends: [],
  appInfo: null,
  stages: [],
  analyze: null,
  lastResult: null,
  lastDelivery: null,
  diagnostics: [],

  go: (route) => set({ route }),

  bootstrap: async () => {
    const [settings, backends, appInfo] = await Promise.all([
      studio.settings.get(), studio.backends.list(), studio.app.info()
    ])
    set({ settings, backends, appInfo })
    await get().refreshProjects()
    // subscribe to live stages once
    studio.workflow.onStage((e: StageEvent) => get().pushStage(e))
    // developer diagnostics: seed + subscribe to every bridge command
    try {
      const existing = await studio.diagnostics.list()
      set({ diagnostics: existing || [] })
      studio.diagnostics.onCommand((rec: BridgeCommand) => set((s) => {
        const rest = s.diagnostics.filter((c) => c.id !== rec.id)
        return { diagnostics: [...rest, rec].slice(-100) }
      }))
    } catch { /* diagnostics optional */ }
  },

  refreshProjects: async (search, sort) => {
    const projects = await studio.projects.list({ search, sort })
    set({ projects })
  },

  saveSettings: async (patch) => {
    const settings = await studio.settings.update(patch)
    set({ settings })
  },

  pushStage: (e) => set((s) => ({ stages: [...s.stages, e] })),
  resetRun: () => set({ stages: [], lastResult: null, lastDelivery: null }),
  setAnalyze: (a) => set({ analyze: a }),
  setResult: (r, d) => set({ lastResult: r, lastDelivery: d })
}))
