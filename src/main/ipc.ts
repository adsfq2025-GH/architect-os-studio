/**
 * IPC layer — the boundary between the renderer and the main-process services. Every channel
 * is a thin, typed handler; the renderer never imports Node/Electron or touches the compiler.
 * Workflow orchestration (analyze → compile → deliver) lives here, in the main process.
 */
import { ipcMain, BrowserWindow, dialog, shell, app } from 'electron'
import { copyFileSync, mkdirSync, existsSync, writeFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import { projectStore } from './services/projectStore'
import { settingsStore } from './services/settingsStore'
import { pluginManager } from './services/pluginManager'
import { deliver } from './services/outputManager'
import { runBridge, engineInfo, getCommandLog, onBridgeCommand } from './services/compilerBridge'
import { friendly } from './services/errorMap'
import { logger } from './services/logger'
import type { StageEvent } from './plugins/types'

type GetWin = () => BrowserWindow | null

export function registerIpc(getWin: GetWin): void {
  const emit = (channel: string, payload: unknown) => getWin()?.webContents.send(channel, payload)

  // ---------- developer diagnostics: stream every bridge command to the UI ----------
  onBridgeCommand((rec) => emit('diagnostics:command', rec))
  ipcMain.handle('diagnostics:list', () => getCommandLog())

  // ---------- app / settings ----------
  ipcMain.handle('app:info', () => ({ version: app.getVersion(), platform: process.platform, ...engineInfo() }))
  ipcMain.handle('settings:get', () => settingsStore.all())
  ipcMain.handle('settings:update', (_e, patch) => { settingsStore.update(patch); return settingsStore.all() })
  ipcMain.handle('settings:setSecret', (_e, key: string, val: string) => {
    // empty string means "clear"; the raw value never travels back to the renderer
    if (val) settingsStore.setSecret(key, val); else settingsStore.clearSecret(key)
    return true
  })
  ipcMain.handle('settings:hasSecret', (_e, key: string) => settingsStore.hasSecret(key))
  ipcMain.handle('backends:list', () => pluginManager.list())

  // ---------- projects ----------
  ipcMain.handle('projects:list', (_e, opts) => projectStore.list(opts))
  ipcMain.handle('projects:get', (_e, id: string) => projectStore.get(id))
  ipcMain.handle('projects:create', (_e, input) => projectStore.create(input))
  ipcMain.handle('projects:patch', (_e, id: string, patch) => projectStore.patch(id, patch))
  ipcMain.handle('projects:duplicate', (_e, id: string) => projectStore.duplicate(id))
  ipcMain.handle('projects:archive', (_e, id: string, v: boolean) => projectStore.archive(id, v))
  ipcMain.handle('projects:favorite', (_e, id: string, v: boolean) => projectStore.favorite(id, v))
  ipcMain.handle('projects:delete', (_e, id: string, deleteFiles: boolean) => { projectStore.remove(id, deleteFiles); return true })
  ipcMain.handle('projects:history', (_e, id: string) => projectStore.history(id))

  // ---------- files ----------
  ipcMain.handle('dialog:pickFolder', async () => {
    const r = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
    return r.canceled ? null : r.filePaths[0]
  })
  ipcMain.handle('dialog:pickMockups', async () => {
    const r = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Mockups', extensions: ['png', 'jpg', 'jpeg', 'webp', 'pdf', 'zip'] }]
    })
    return r.canceled ? [] : r.filePaths
  })
  ipcMain.handle('files:importMockups', (_e, projectId: string, paths: string[]) => {
    const p = projectStore.get(projectId); if (!p) return { ok: false, error: 'NO_PROJECT' }
    const inDir = join(p.dir, 'input'); if (!existsSync(inDir)) mkdirSync(inDir, { recursive: true })
    const imported: string[] = []
    for (const src of paths) {
      const dest = join(inDir, basename(src))
      try { copyFileSync(src, dest); imported.push(basename(src)) } catch (e) { logger.error(`import ${src}: ${(e as Error).message}`) }
    }
    return { ok: true, files: imported }
  })
  ipcMain.handle('files:listMockups', (_e, projectId: string) => {
    const p = projectStore.get(projectId); if (!p) return []
    const inDir = join(p.dir, 'input')
    return existsSync(inDir) ? readdirSync(inDir).filter((f) => !f.startsWith('.')) : []
  })
  ipcMain.handle('shell:openPath', (_e, path: string) => shell.openPath(path))
  ipcMain.handle('shell:showItem', (_e, path: string) => shell.showItemInFolder(path))

  // ---------- logs ----------
  ipcMain.handle('logs:export', async () => {
    const r = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (r.canceled) return null
    for (const ch of ['build', 'compiler', 'qa', 'error']) {
      const content = logger.read(ch as any)
      if (content) writeFileSync(join(r.filePaths[0], `${ch}.log`), content)
    }
    return r.filePaths[0]
  })

  // ---------- analysis ----------
  ipcMain.handle('workflow:analyze', async (_e, projectId: string) => {
    const p = projectStore.get(projectId); if (!p) return { ok: false, error: 'NO_PROJECT' }
    const backend = pluginManager.get(p.builder)
    if (!backend) return { ok: false, error: 'BUILDER_UNAVAILABLE', friendly: friendly('BUILDER_UNAVAILABLE') }
    projectStore.patch(p.id, { status: 'analyzing' })
    const req = { projectDir: p.dir, irDir: join(p.dir, 'ir'), input: join(p.dir, 'input'), slug: projectStore.slugFor(p), downloadsDir: settingsStore.get('downloadsDir') }
    const res = await backend.analyze(req, (ev: StageEvent) => emit('workflow:stage', { projectId, ...ev }))
    projectStore.patch(p.id, { status: res.ok ? 'ready' : 'failed' })
    // always return the diagnostics (input, files scanned, supported, detected pages) so the
    // Analysis screen can show them even when detection fails.
    return { ...res, ok: res.ok, friendly: res.ok ? undefined : friendly(res.reason || res.error) }
  })

  // ---------- generation (the click that produces the kit) ----------
  ipcMain.handle('workflow:generate', async (_e, projectId: string) => {
    const p = projectStore.get(projectId); if (!p) return { ok: false, error: 'NO_PROJECT' }
    const backend = pluginManager.get(p.builder)
    if (!backend) return { ok: false, error: 'BUILDER_UNAVAILABLE', friendly: friendly('BUILDER_UNAVAILABLE') }
    projectStore.patch(p.id, { status: 'building' })
    const req = { projectDir: p.dir, irDir: join(p.dir, 'ir'), input: join(p.dir, 'input'), slug: projectStore.slugFor(p), downloadsDir: settingsStore.get('downloadsDir') }

    const res = await backend.compile(req, (ev: StageEvent) => emit('workflow:stage', { projectId, ...ev }))
    if (!res.ok) {
      projectStore.recordBuild(p.id, 'FAIL', res.fidelity?.overall ?? null, null)
      return { ok: false, error: res.error, friendly: friendly(res.error), result: res }
    }
    // deliver kit + reports to Downloads
    const delivery = await deliver(p, res)
    projectStore.recordBuild(p.id, res.qa.result === 'PASS' && res.acceptance.result === 'PASS' ? 'PASS' : 'FAIL',
      res.fidelity?.overall ?? null, delivery.kit)
    emit('workflow:stage', { projectId, stage: 'Delivered', status: 'ok', detail: delivery.folder })
    return { ok: true, result: res, delivery }
  })

  // ---------- import/export project (team features) ----------
  ipcMain.handle('project:export', async (_e, projectId: string) => {
    const p = projectStore.get(projectId); if (!p) return null
    const r = await dialog.showSaveDialog({ defaultPath: `${p.client}-${p.name}.aosproj.zip` })
    if (r.canceled || !r.filePath) return null
    const out = await runBridge('export_project', { projectDir: p.dir, dest: r.filePath })
    return out.ok ? r.filePath : null
  })
}
