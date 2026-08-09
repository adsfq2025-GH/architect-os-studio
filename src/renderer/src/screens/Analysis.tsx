import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store'
import { studio } from '../lib/ipc'
import { Stepper, LogView, ProgressBar, Badge } from '../components/ui'
import { EngineOutput } from '../components/EngineOutput'
import type { AnalyzeResult } from '../lib/types'

export default function Analysis({ projectId }: { projectId: string }) {
  const { go, resetRun, setAnalyze, stages } = useApp()
  const [running, setRunning] = useState(true)
  const [res, setRes] = useState<AnalyzeResult | null>(null)
  const started = useRef(false)

  const lines = stages.filter((s) => s.projectId === projectId)
    .map((s) => `${s.stage} — ${s.status}${s.detail ? ` · ${s.detail}` : ''}`)

  useEffect(() => {
    if (started.current) return
    started.current = true
    resetRun()
    ;(async () => {
      const r = await studio.workflow.analyze(projectId)
      setRes(r)
      setRunning(false)
      if (r.ok) {
        setAnalyze(r)
        setTimeout(() => go({ name: 'blueprint', projectId }), 900)
      }
    })()
  }, [projectId])

  const filesScanned = res?.filesScanned ?? []
  const supported = res?.supportedFiles ?? []
  const pages = res?.detectedPages ?? res?.pages ?? []
  const status = running ? 'Scanning input folder…' : res?.ok ? 'Generating blueprint…' : 'Analysis stopped'

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Stepper steps={['New Project', 'Upload', 'Analysis', 'Blueprint', 'Generate', 'Download']} current={2} />
      <h1 className="text-2xl font-bold mt-6 mb-1">Analyzing your mockups</h1>
      <p className="text-sm text-ink-400 mb-6">Detecting pages from the uploaded files and building the site architecture.</p>

      <div className="card p-5 mb-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold">{status}</span>
          <span className="text-ink-400">{running ? '' : res?.ok ? 'Detected' : ''}</span>
        </div>
        <ProgressBar value={running ? 0.5 : 1} />

        {/* Diagnostics panel (exactly the fields the Analysis screen should show) */}
        <dl className="mt-5 grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="text-ink-400">Input folder</dt>
          <dd className="font-mono text-xs text-ink-200 break-all">{res?.input ?? '—'}</dd>

          <dt className="text-ink-400">Files scanned</dt>
          <dd className="text-ink-100">{running ? '…' : filesScanned.length}</dd>

          <dt className="text-ink-400">Supported images</dt>
          <dd className="text-ink-100">{running ? '…' : supported.length}
            {!running && supported.length > 0 && (
              <span className="ml-2 text-ink-500">({supported.slice(0, 6).join(', ')}{supported.length > 6 ? '…' : ''})</span>
            )}
          </dd>

          <dt className="text-ink-400">Pages detected</dt>
          <dd>
            {running ? '…' : pages.length === 0 ? <span className="text-ink-500">none</span> : (
              <div className="flex flex-wrap gap-1.5">
                {pages.map((p) => (
                  <span key={p.id} className="chip bg-brand-500/15 text-brand-300">
                    {(p as any).home ? '★ ' : ''}{p.title}
                  </span>
                ))}
              </div>
            )}
          </dd>

          <dt className="text-ink-400">Status</dt>
          <dd>{res?.ok ? <Badge tone="ok">{status}</Badge> : running ? <Badge tone="warn">Working…</Badge> : <Badge tone="fail">{res?.reason || 'error'}</Badge>}</dd>
        </dl>
      </div>

      <LogView lines={lines} />

      {!running && !res?.ok && (
        <div className="card p-6 border border-amber-500/20 mt-4">
          <div className="text-lg font-semibold text-amber-300">{res?.friendly?.title ?? 'No pages detected'}</div>
          <p className="mt-1 text-sm text-ink-300">{res?.friendly?.message ?? 'The analyzer could not detect any pages.'}</p>
          <p className="mt-3 text-sm text-ink-400">{res?.friendly?.action ?? 'Add PNG/JPG/WebP/PDF mockups and try again.'}</p>
          {filesScanned.length > 0 && (
            <div className="mt-4 rounded-xl bg-white/5 p-3 text-xs text-ink-400">
              Files present but unsupported/undetected: {filesScanned.join(', ')}
            </div>
          )}
          {(res?.reason === 'ENGINE_BAD_OUTPUT' || res?.error === 'ENGINE_BAD_OUTPUT') && <EngineOutput />}
          <div className="mt-5 flex gap-3">
            <button className="btn-ghost" onClick={() => go({ name: 'upload', projectId })}>Back to Upload</button>
            <button className="btn-ghost" onClick={() => go({ name: 'diagnostics' })}>Open Developer Diagnostics</button>
            <button className="btn-primary" onClick={() => { started.current = false; setRunning(true); go({ name: 'analysis', projectId }) }}>Retry</button>
          </div>
        </div>
      )}

      {!running && res?.ok && (
        <div className="mt-4 flex justify-end">
          <button className="btn-primary" onClick={() => go({ name: 'blueprint', projectId })}>Continue → Blueprint</button>
        </div>
      )}
    </div>
  )
}
