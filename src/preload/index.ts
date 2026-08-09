import { contextBridge, ipcRenderer } from 'electron'

/**
 * The ONLY surface the renderer can touch. No Node, no fs, no child_process — just these
 * typed, whitelisted channels. Everything privileged happens in the main process.
 */
const api = {
  app: {
    info: () => ipcRenderer.invoke('app:info'),
    onUpdateReady: (cb: (info: { version: string; notes: string }) => void) => {
      const h = (_: unknown, info: any) => cb(info)
      ipcRenderer.on('update:ready', h)
      return () => ipcRenderer.removeListener('update:ready', h)
    }
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (patch: Record<string, unknown>) => ipcRenderer.invoke('settings:update', patch),
    setSecret: (key: string, val: string) => ipcRenderer.invoke('settings:setSecret', key, val)
  },
  backends: { list: () => ipcRenderer.invoke('backends:list') },
  projects: {
    list: (opts?: unknown) => ipcRenderer.invoke('projects:list', opts),
    get: (id: string) => ipcRenderer.invoke('projects:get', id),
    create: (input: unknown) => ipcRenderer.invoke('projects:create', input),
    patch: (id: string, patch: unknown) => ipcRenderer.invoke('projects:patch', id, patch),
    duplicate: (id: string) => ipcRenderer.invoke('projects:duplicate', id),
    archive: (id: string, v: boolean) => ipcRenderer.invoke('projects:archive', id, v),
    favorite: (id: string, v: boolean) => ipcRenderer.invoke('projects:favorite', id, v),
    delete: (id: string, deleteFiles: boolean) => ipcRenderer.invoke('projects:delete', id, deleteFiles),
    history: (id: string) => ipcRenderer.invoke('projects:history', id),
    export: (id: string) => ipcRenderer.invoke('project:export', id)
  },
  files: {
    pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
    pickMockups: () => ipcRenderer.invoke('dialog:pickMockups'),
    importMockups: (projectId: string, paths: string[]) => ipcRenderer.invoke('files:importMockups', projectId, paths),
    listMockups: (projectId: string) => ipcRenderer.invoke('files:listMockups', projectId),
    openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
    showItem: (path: string) => ipcRenderer.invoke('shell:showItem', path)
  },
  logs: { export: () => ipcRenderer.invoke('logs:export') },
  diagnostics: {
    list: () => ipcRenderer.invoke('diagnostics:list'),
    onCommand: (cb: (rec: any) => void) => {
      const h = (_: unknown, rec: any) => cb(rec)
      ipcRenderer.on('diagnostics:command', h)
      return () => ipcRenderer.removeListener('diagnostics:command', h)
    }
  },
  workflow: {
    analyze: (projectId: string) => ipcRenderer.invoke('workflow:analyze', projectId),
    generate: (projectId: string) => ipcRenderer.invoke('workflow:generate', projectId),
    onStage: (cb: (e: any) => void) => {
      const h = (_: unknown, e: any) => cb(e)
      ipcRenderer.on('workflow:stage', h)
      return () => ipcRenderer.removeListener('workflow:stage', h)
    }
  }
}

contextBridge.exposeInMainWorld('studio', api)
export type StudioApi = typeof api
