import { useState } from 'react'
import { useApp } from '../store'
import { studio } from '../lib/ipc'
import { Field, Stepper, Badge } from '../components/ui'

const TYPES = ['Business', 'Local Service', 'Restaurant', 'SaaS', 'Agency', 'Portfolio', 'E-commerce', 'Landing Page']

export default function NewProject() {
  const { settings, backends, go, refreshProjects } = useApp()
  const [form, setForm] = useState({
    client: '', name: '', websiteType: 'Business',
    builder: settings?.defaultBuilder ?? 'elementor', theme: settings?.defaultTheme ?? 'Hello Elementor'
  })
  const [busy, setBusy] = useState(false)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.client.trim() && form.name.trim()

  const create = async () => {
    if (!valid) return
    setBusy(true)
    const p = await studio.projects.create(form)
    await refreshProjects()
    go({ name: 'upload', projectId: p.id })
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Stepper steps={['New Project', 'Upload', 'Analysis', 'Blueprint', 'Generate', 'Download']} current={0} />
      <h1 className="text-2xl font-bold mt-6 mb-1">Create a new project</h1>
      <p className="text-sm text-ink-400 mb-6">Fill in the basics. Folders are created for you automatically.</p>

      <div className="card p-6 grid grid-cols-2 gap-5">
        <Field label="Client name"><input className="input" value={form.client} placeholder="Final Touch Painting" onChange={(e) => set('client', e.target.value)} /></Field>
        <Field label="Project name"><input className="input" value={form.name} placeholder="Company Website" onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Website type">
          <select className="input" value={form.websiteType} onChange={(e) => set('websiteType', e.target.value)}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="WordPress theme"><input className="input" value={form.theme} onChange={(e) => set('theme', e.target.value)} /></Field>
        <div className="col-span-2">
          <label className="label">Target builder</label>
          <div className="grid grid-cols-3 gap-3">
            {backends.map((b) => {
              const disabled = b.status !== 'stable'
              const selected = form.builder === b.id
              return (
                <button key={b.id} disabled={disabled} onClick={() => set('builder', b.id)}
                  className={`no-drag text-left rounded-xl border p-3 transition ${selected ? 'border-brand-400 bg-brand-500/10' : 'border-white/10 hover:border-white/20'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{b.name}</span>
                    {b.status === 'stable' ? <Badge tone="ok">Ready</Badge> : <Badge tone="neutral">Soon</Badge>}
                  </div>
                  <div className="text-xs text-ink-400 mt-1 line-clamp-2">{b.description}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-ghost" onClick={() => go({ name: 'dashboard' })}>Cancel</button>
        <button className="btn-primary" disabled={!valid || busy} onClick={create}>{busy ? 'Creating…' : 'Continue → Upload'}</button>
      </div>
    </div>
  )
}
