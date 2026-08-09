import { app, BrowserWindow, shell, nativeTheme } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { registerIpc } from './ipc'
import { logger } from './services/logger'
import { settingsStore } from './services/settingsStore'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1040,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: 'Architect OS Studio',
    backgroundColor: '#0f1320',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const theme = settingsStore.get('uiTheme')
  nativeTheme.themeSource = theme

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mapranking.architectosstudio')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  registerIpc(() => mainWindow)
  createWindow()

  // Auto-update (silent background). Feed configured in electron-builder.yml.
  if (!is.dev && settingsStore.get('autoUpdates')) {
    autoUpdater.autoDownload = true
    autoUpdater.on('update-downloaded', (info) => {
      mainWindow?.webContents.send('update:ready', { version: info.version, notes: info.releaseNotes })
    })
    autoUpdater.on('error', (e) => logger.error(`autoUpdate ${e.message}`))
    autoUpdater.checkForUpdatesAndNotify().catch((e) => logger.error(`update check ${e.message}`))
  }

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

process.on('uncaughtException', (e) => logger.error(`uncaught ${e.stack || e.message}`))
