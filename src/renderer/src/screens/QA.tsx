import { useApp } from '../store'
import { Stepper, Badge } from '../components/ui'

export default function QA({ projectId }: { projectId: string }) {
  const { go, lastResult } = useApp()
  const r = lastResult

  if (!r) return (
    <div className="p-8 max-w-3xl mx-auto">
      <p className="text-ink-400">No results to show. <button className="text-brand-300" onClick={() => go({ name: 'generate', projectId })}>Generate the website</button>.</p>
    </div>
  )

  const dims = r.fidelity?.dimensions ?? {}
  const rows: Array<{ label: string; ok: boolean; note: string; live?: boolean }> = [
    { label: 'Elementor compatibility', ok: r.validation?.result === 'PASS', note: r.validation ? `${r.validation.passed}/${r.validation.total} structural checks` : '—' },
    { label: 'Package QA', ok: r.qa.result === 'PASS', note: `${r.qa.checks.filter((c) => c.status === 'PASS').length}/${r.qa.checks.length} checks` },
    { label: 'Acceptance', ok: r.acceptance.result === 'PASS', note: `${r.acceptance.passed}/${r.acceptance.total} block tests` },
    { label: 'Responsive', ok: (dims.responsiveness ?? 0) >= 0.95, note: `${Math.round((dims.responsiveness ?? 0) * 100)}%` },
    { label: 'Visual fidelity', ok: (r.fidelity?.overall ?? 0) >= 0.95, note: `${Math.round((r.fidelity?.overall ?? 0) * 100)}% overall` },
    { label: 'Live import round-trip', ok: false, live: true, note: 'Confirmed after import into WordPress' }
  ]

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Stepper steps={['New Project', 'Upload', 'Analysis', 'Blueprint', 'Generate', 'Download']} current={4} />
      <h1 className="text-2xl font-bold mt-6 mb-1">Quality assurance</h1>
      <p className="text-sm text-ink-400 mb-6">Every automated gate the kit passed before delivery.</p>

      <div className="card divide-y divide-white/5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="font-medium text-ink-100">{row.label}</div>
              <div className="text-xs text-ink-400">{row.note}</div>
            </div>
            {row.live ? <Badge tone="warn">Needs live</Badge> : row.ok ? <Badge tone="ok">PASS</Badge> : <Badge tone="fail">FAIL</Badge>}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button className="btn-ghost" onClick={() => go({ name: 'blueprint', projectId })}>Back</button>
        <button className="btn-primary" onClick={() => go({ name: 'output', projectId })}>Continue → Download</button>
      </div>
    </div>
  )
}
