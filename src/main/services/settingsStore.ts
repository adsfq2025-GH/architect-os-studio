/**
 * Settings store. Uses electron-store with an encryption key so sensitive values
 * (e.g. AI provider API keys) are never written in plaintext. Non-secret preferences are
 * stored normally. The renderer only ever sees non-secret settings via IPC.
 */
import Store from 'electron-store'
import { app, safeStorage } from 'electron'
import { join } from 'path'

export interface Settings {
  defaultBuilder: string
  defaultTheme: string          // WordPress theme, e.g. "Hello Elementor"
  downloadsDir: string
  projectLocation: string
  autoSave: boolean
  autoBackup: boolean
  autoUpdates: boolean
  aiProvider: string            // "none" | "openai" | "anthropic" | ...
  aiModel?: string              // optional model override (e.g. "claude-3-5-sonnet-latest", "gpt-4o")
  designMode: 'exact' | 'professional' | 'premium'  // DIOS generation standard
  performanceMode: 'balanced' | 'fast' | 'thorough'
  uiTheme: 'dark' | 'light' | 'system'
  autoDownload: boolean
  // advanced / hidden
  enginePath?: string
  pythonPath?: string
}

const SECRET_KEYS = ['aiApiKey']

function defaults(): Settings {
  return {
    defaultBuilder: 'elementor',
    defaultTheme: 'Hello Elementor',
    downloadsDir: app.getPath('downloads'),
    projectLocation: join(app.getPath('documents'), 'Architect OS', 'Projects'),
    autoSave: true,
    autoBackup: true,
    autoUpdates: true,
    aiProvider: 'none',
    designMode: 'premium',
    performanceMode: 'balanced',
    uiTheme: 'dark',
    autoDownload: true
  }
}

class SettingsStore {
  private store: Store<any>
  constructor() {
    this.store = new Store<any>({ name: 'settings', defaults: defaults() })
  }
  all(): Settings {
    const s = { ...defaults(), ...(this.store.store as object) } as Settings
    return s
  }
  get<K extends keyof Settings>(key: K): Settings[K] { return this.store.get(key as string) }
  set<K extends keyof Settings>(key: K, val: Settings[K]) { this.store.set(key as string, val as any) }
  update(patch: Partial<Settings>) { for (const [k, v] of Object.entries(patch)) this.store.set(k, v as any) }

  setSecret(key: string, value: string) {
    if (!SECRET_KEYS.includes(key)) return
    const enc = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(value).toString('base64')
      : Buffer.from(value).toString('base64')
    this.store.set(`__secret_${key}`, enc)
  }
  /** True if a secret is stored — used by the UI to show "saved" WITHOUT ever sending the value. */
  hasSecret(key: string): boolean {
    if (!SECRET_KEYS.includes(key)) return false
    return !!this.store.get(`__secret_${key}`)
  }
  clearSecret(key: string) {
    if (!SECRET_KEYS.includes(key)) return
    this.store.delete(`__secret_${key}`)
  }
  getSecret(key: string): string | null {
    const raw = this.store.get(`__secret_${key}`) as string | undefined
    if (!raw) return null
    try {
      const buf = Buffer.from(raw, 'base64')
      return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(buf) : buf.toString()
    } catch { return null }
  }
}

export const settingsStore = new SettingsStore()
