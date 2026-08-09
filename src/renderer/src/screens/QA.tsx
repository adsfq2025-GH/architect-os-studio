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

      {r.design && (
        <div className="card mt-6 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-ink-100">Design Quality Score</div>
              <div className="text-xs text-ink-400">
                {r.design.mode} standard · target {r.design.min_overall}+
                {!r.design.gate_enforced && ' · advisory'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${r.design.overall >= r.design.min_overall ? 'text-emerald-300' : 'text-amber-300'}`}>
                {r.design.overall}
                <span className="text-sm text-ink-500">/100</span>
              </span>
              {r.design.overall >= r.design.min_overall
                ? <Badge tone="ok">PREMIUM</Badge>
                : <Badge tone="warn">BELOW TARGET</Badge>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {r.design.pages.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-300">{p.id.replace('page-', '')}</span>
                <span className={p.score >= r.design!.min_overall ? 'text-emerald-300' : 'text-amber-300'}>{p.score}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Structural design quality (hierarchy, type, spacing, composition, conversion, accessibility).
            Per-page issues are in the design report (Diagnostics / Downloads).
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button className="btn-ghost" onClick={() => go({ name: 'blueprint', projectId })}>Back</button>
        <button className="btn-primary" onClick={() => go({ name: 'output', projectId })}>Continue → Download</button>
      </div>
    </div>
  )
}
