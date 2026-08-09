import { useEffect, useState } from 'react'
import { useApp } from '../store'
import { studio } from '../lib/ipc'
import { Stepper, StatCard } from '../components/ui'
import type { AnalyzeResult } from '../lib/types'

export default function Blueprint({ projectId }: { projectId: string }) {
  const { go, analyze, setAnalyze } = useApp()
  const [data, setData] = useState<AnalyzeResult | null>(analyze)

  useEffect(() => {
    if (!data) studio.workflow.analyze(projectId).then((r) => { if (r.ok) { setData(r); setAnalyze(r) } })
  }, [projectId])

  const pages = data?.pages ?? []

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Stepper steps={['New Project', 'Upload', 'Analysis', 'Blueprint', 'Generate', 'Download']} current={3} />
      <h1 className="text-2xl font-bold mt-6 mb-1">Review the blueprint</h1>
      <p className="text-sm text-ink-400 mb-6">Here's the architecture we'll generate. Adjust anything before building.</p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Pages" value={pages.length} />
        <StatCard label="Templates" value={data?.templates?.length ?? 0} />
        <StatCard label="Colors" value={data?.colors ?? 0} />
        <StatCard label="Assets" value={data?.assets ?? 0} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-semibold mb-3">Detected pages</div>
          <ul className="space-y-2">
            {pages.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg bg-white/[.02] px-3 py-2 text-sm">
                <span className="text-ink-500 w-5 text-center">{p.order + 1}</span>
                <span className="flex-1 text-ink-100">{p.title}</span>
                <span className="text-xs text-ink-500">{p.id}</span>
              </li>
            ))}
            {pages.length === 0 && <li className="text-sm text-ink-400">Loading…</li>}
          </ul>
        </div>
        <div className="card p-5">
          <div className="font-semibold mb-3">Templates & strategy</div>
          <div className="space-y-2 text-sm">
            {(data?.templates ?? []).map((t) => (
              <div key={t} className="flex items-center gap-2 rounded-lg bg-white/[.02] px-3 py-2">
                <span className="chip bg-brand-500/15 text-brand-300">theme</span>{t}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-white/5 p-3 text-xs text-ink-400">
            Responsive strategy: desktop / tablet / mobile with per-block stacking. Motion mapped to native
            Elementor entrance animations (LCP hero excluded).
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-ghost" onClick={() => go({ name: 'upload', projectId })}>Back</button>
        <button className="btn-primary" onClick={() => go({ name: 'generate', projectId })}>Generate Website →</button>
      </div>
    </div>
  )
}
