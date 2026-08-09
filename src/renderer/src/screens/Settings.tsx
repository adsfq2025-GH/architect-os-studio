import { useState, useEffect, type ReactNode } from 'react'
import { useApp } from '../store'
import { studio } from '../lib/ipc'
import { Field } from '../components/ui'
import type { Settings as S } from '../lib/types'

export default function Settings() {
  const { settings, backends, saveSettings, appInfo } = useApp()
  const [local, setLocal] = useState<S | null>(settings)
  const [saved, setSaved] = useState(false)
  // API key is a secret: never loaded into the renderer. We only track whether one is stored,
  // and hold any newly-typed value transiently until Save writes it to the encrypted store.
  const [keyInput, setKeyInput] = useState('')
  const [keySaved, setKeySaved] = useState(false)
  useEffect(() => { studio.settings.hasSecret('aiApiKey').then(setKeySaved) }, [])
  if (!settings || !local) return <div className="p-8 text-ink-400">Loading…</div>

  const set = (patch: Partial<S>) => setLocal({ ...local, ...patch })
  const save = async () => {
    await saveSettings(local)
    // Only write the key when the user typed one this session (blank = keep existing).
    if (keyInput) { await studio.settings.setSecret('aiApiKey', keyInput); setKeySaved(true); setKeyInput('') }
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }
  const clearKey = async () => { await studio.settings.setSecret('aiApiKey', ''); setKeySaved(false); setKeyInput('') }
  const pick = async (key: 'downloadsDir' | 'projectLocation') => { const d = await studio.files.pickFolder(); if (d) set({ [key]: d } as Partial<S>) }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-ink-400 mb-6">Defaults for new projects and where files are saved.</p>

      <Section title="Generation">
        <Field label="Default builder">
          <select className="input" value={local.defaultBuilder} onChange={(e) => set({ defaultBuilder: e.target.value })}>
            {backends.map((b) => <option key={b.id} value={b.id} disabled={b.status !== 'stable'}>{b.name}{b.status !== 'stable' ? ' (soon)' : ''}</option>)}
          </select>
        </Field>
        <Field label="Default WordPress theme"><input className="input" value={local.defaultTheme} onChange={(e) => set({ defaultTheme: e.target.value })} /></Field>
        <Field label="Performance">
          <select className="input" value={local.performanceMode} onChange={(e) => set({ performanceMode: e.target.value as S['performanceMode'] })}>
            <option value="balanced">Balanced</option><option value="fast">Fast</option><option value="thorough">Thorough</option>
          </select>
        </Field>
        <Field label="AI provider (mockup analysis)">
          <select className="input" value={local.aiProvider} onChange={(e) => set({ aiProvider: e.target.value })}>
            <option value="none">None (import blueprints)</option><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option>
          </select>
        </Field>
        {local.aiProvider !== 'none' && (
          <>
            <div className="col-span-2">
              <label className="label">
                {local.aiProvider === 'anthropic' ? 'Anthropic API key' : 'OpenAI API key'}
                {keySaved && <span className="ml-2 text-xs text-emerald-300">saved ✓</span>}
              </label>
              <div className="flex gap-2">
                <input
                  className="input" type="password" autoComplete="off"
                  placeholder={keySaved ? '•••••••••••• (leave blank to keep)' : 'Paste your API key'}
                  value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
                />
                {keySaved && <button className="btn-ghost shrink-0" onClick={clearKey}>Remove</button>}
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Stored encrypted on this PC and passed to the local engine only. It never leaves your machine except to call {local.aiProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'} directly, and never appears in logs.
              </p>
            </div>
            <Field label="Model (optional)">
              <input
                className="input" value={local.aiModel || ''}
                onChange={(e) => set({ aiModel: e.target.value })}
                placeholder={local.aiProvider === 'anthropic' ? 'claude-3-5-sonnet-latest' : 'gpt-4o'}
              />
            </Field>
          </>
        )}
      </Section>

      <Section title="Files">
        <FolderField label="Downloads folder" value={local.downloadsDir} onPick={() => pick('downloadsDir')} />
        <FolderField label="Project location" value={local.projectLocation} onPick={() => pick('projectLocation')} />
      </Section>

      <Section title="Behavior">
        <Toggle label="Auto save" v={local.autoSave} on={(v) => set({ autoSave: v })} />
        <Toggle label="Auto backup" v={local.autoBackup} on={(v) => set({ autoBackup: v })} />
        <Toggle label="Automatic downloads (kit + PDF reports)" v={local.autoDownload} on={(v) => set({ autoDownload: v })} />
        <Toggle label="Auto updates" v={local.autoUpdates} on={(v) => set({ autoUpdates: v })} />
        <Field label="Appearance">
          <select className="input" value={local.uiTheme} onChange={(e) => set({ uiTheme: e.target.value as S['uiTheme'] })}>
            <option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option>
          </select>
        </Field>
      </Section>

      <Section title="Support">
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={async () => { const d = await studio.logs.export(); if (d) studio.files.openPath(d) }}>Export logs…</button>
          <div className="text-xs text-ink-500 self-center">Version {appInfo?.version} · {appInfo?.platform}</div>
        </div>
      </Section>

      <div className="mt-6 flex justify-end gap-3">
        {saved && <span className="self-center text-sm text-emerald-300">Saved ✓</span>}
        <button className="btn-primary" onClick={save}>Save settings</button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card p-6 mb-4">
      <div className="font-semibold mb-4">{title}</div>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  )
}
function FolderField({ label, value, onPick }: { label: string; value: string; onPick: () => void }) {
  return (
    <div className="col-span-2">
      <label className="label">{label}</label>
      <div className="flex gap-2">
        <input className="input" readOnly value={value} />
        <button className="btn-ghost shrink-0" onClick={onPick}>Change…</button>
      </div>
    </div>
  )
}
function Toggle({ label, v, on }: { label: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <label className="col-span-2 flex items-center justify-between rounded-xl bg-white/[.02] px-4 py-3 cursor-pointer">
      <span className="text-sm text-ink-200">{label}</span>
      <button onClick={() => on(!v)} className={`no-drag relative h-6 w-11 rounded-full transition ${v ? 'bg-brand-500' : 'bg-white/10'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${v ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}
