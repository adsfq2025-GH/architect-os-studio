import { useEffect, useState } from 'react'
import { useApp } from '../store'
import { studio } from '../lib/ipc'
import { StatCard } from '../components/ui'
import type { Project } from '../lib/types'

export default function Output({ projectId }: { projectId: string }) {
  const { go, lastResult, lastDelivery } = useApp()
  const [project, setProject] = useState<Project | null>(null)
  useEffect(() => { studio.projects.get(projectId).then(setProject) }, [projectId])

  const r = lastResult
  const fid = r?.fidelity ? Math.round(r.fidelity.overall * 100) : project?.fidelity ? Math.round(project.fidelity * 100) : null
  const qaScore = r ? `${r.qa.checks.filter((c) => c.status === 'PASS').length}/${r.qa.checks.length}` : '—'
  const compatible = r?.validation?.result === 'PASS'

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-emerald-500/15 text-emerald-300 text-4xl">✓</div>
        <h1 className="text-2xl font-bold">Generation complete</h1>
        <p className="text-sm text-ink-400 mt-1">Your Elementor Website Kit is ready in Downloads.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Elementor compatible" value={compatible ? 'Yes' : '—'} tone={compatible ? 'ok' : 'neutral'} />
        <StatCard label="Fidelity score" value={fid != null ? `${fid}%` : '—'} tone={fid && fid >= 95 ? 'ok' : 'neutral'} />
        <StatCard label="QA score" value={qaScore} tone="ok" />
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/15 text-brand-300">ZIP</div>
          <div className="flex-1">
            <div className="font-semibold">website-kit.zip</div>
            <div className="text-xs text-ink-400">{lastDelivery?.folder ?? project?.dir}</div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button className="btn-primary" onClick={() => lastDelivery?.kit && studio.files.showItem(lastDelivery.kit)}>Download Elementor Kit</button>
          <button className="btn-ghost" onClick={() => lastDelivery?.folder && studio.files.openPath(lastDelivery.folder)}>Open Output Folder</button>
          <button className="btn-ghost" onClick={() => project && studio.files.openPath(`${project.dir}/build/elementor`)}>View Reports</button>
          <button className="btn-ghost" onClick={() => go({ name: 'generate', projectId })}>Generate Again</button>
        </div>
      </div>

      <div className="card p-5 mt-4 text-sm text-ink-300">
        <div className="font-semibold text-ink-100 mb-2">Import into Elementor</div>
        <ol className="list-decimal pl-5 space-y-1 text-ink-400">
          <li>In WordPress: <span className="text-ink-200">Elementor → Tools → Import / Export Kit → Import</span>.</li>
          <li>Upload <span className="text-ink-200">website-kit.zip</span> and confirm.</li>
          <li>Regenerate CSS, assign the menu, set the form recipient, replace placeholder media.</li>
        </ol>
      </div>

      <div className="mt-6 text-center">
        <button className="btn-subtle" onClick={() => go({ name: 'dashboard' })}>← Back to Projects</button>
      </div>
    </div>
  )
}
