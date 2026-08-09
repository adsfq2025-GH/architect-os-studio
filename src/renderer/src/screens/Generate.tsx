import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store'
import { studio } from '../lib/ipc'
import { Stepper, LogView, ProgressBar } from '../components/ui'

const PIPELINE = ['Parsed', 'Analyzed', 'IR Generated', 'Translated', 'Packaged', 'Kit Valid', 'QA', 'Delivered']

export default function Generate({ projectId }: { projectId: string }) {
  const { go, resetRun, setResult, stages, refreshProjects } = useApp()
  const [running, setRunning] = useState(true)
  const [err, setErr] = useState<{ title: string; message: string; action: string } | null>(null)
  const started = useRef(false)

  const mine = stages.filter((s) => s.projectId === projectId)
  const lines = mine.map((s) => `${s.stage} | ${s.status}${s.detail ? ` | ${s.detail}` : ''}`)
  const progress = mine.reduce((m, s) => Math.max(m, s.progress ?? 0), 0)
  const done = new Set(mine.filter((s) => s.status === 'ok').map((s) => s.stage))

  useEffect(() => {
    if (started.current) return
    started.current = true
    resetRun()
    ;(async () => {
      const res = await studio.workflow.generate(projectId)
      setRunning(false)
      await refreshProjects()
      if (res.ok && res.result) {
        setResult(res.result, res.delivery ?? null)
        setTimeout(() => go({ name: 'qa', projectId }), 600)
      } else {
        setErr(res.friendly ?? { title: 'Generation failed', message: res.error ?? 'Unknown error', action: 'Try again.' })
        if (res.result) setResult(res.result, null)
      }
    })()
  }, [projectId])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Stepper steps={['New Project', 'Upload', 'Analysis', 'Blueprint', 'Generate', 'Download']} current={4} />
      <h1 className="text-2xl font-bold mt-6 mb-1">Generating your Elementor website</h1>
      <p className="text-sm text-ink-400 mb-6">Compiling the blueprint into an importable Website Kit.</p>

      <div className="card p-5 mb-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold">{running ? 'Building…' : err ? 'Stopped' : 'Complete'}</span>
          <span className="text-ink-400">{Math.round((running ? progress : err ? progress : 1) * 100)}%</span>
        </div>
        <ProgressBar value={running ? progress : err ? progress : 1} />
        <div className="mt-4 space-y-1.5">
          {PIPELINE.map((step) => {
            const ok = done.has(step)
            const active = running && !ok && mine.some((s) => s.stage === step)
            return (
              <div key={step} className="flex items-center gap-3 text-sm">
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${ok ? 'bg-emerald-500 text-white' : active ? 'bg-brand-500/30 text-brand-200' : 'bg-white/5 text-ink-500'}`}>{ok ? '✓' : active ? '·' : ''}</span>
                <span className={ok ? 'text-ink-100' : 'text-ink-400'}>{step}</span>
              </div>
            )
          })}
        </div>
      </div>

      <LogView lines={lines} />

      {err && (
        <div className="card p-6 border border-rose-500/20 mt-4">
          <div className="text-lg font-semibold text-rose-300">{err.title}</div>
          <p className="mt-1 text-sm text-ink-300">{err.message}</p>
          <p className="mt-3 text-sm text-ink-400">{err.action}</p>
          <div className="mt-5 flex gap-3">
            <button className="btn-ghost" onClick={() => go({ name: 'blueprint', projectId })}>Back to Blueprint</button>
            <button className="btn-primary" onClick={() => { started.current = false; go({ name: 'generate', projectId }) }}>Try Again</button>
          </div>
        </div>
      )}
    </div>
  )
}
