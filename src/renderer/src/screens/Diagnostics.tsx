import { useState } from 'react'
import { useApp } from '../store'
import { studio } from '../lib/ipc'
import { Badge } from '../components/ui'
import type { BridgeCommand } from '../lib/types'

export default function Diagnostics() {
  const { diagnostics, appInfo } = useApp()
  const [sel, setSel] = useState<number | null>(null)
  const list = [...diagnostics].reverse()
  const current = list.find((c) => c.id === sel) || list[0]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold">Developer Diagnostics</h1>
          <p className="text-sm text-ink-400">Every command sent to the engine (bridge.py), with arguments, timing, and result.</p>
        </div>
        <button className="btn-ghost" onClick={async () => { const d = await studio.logs.export(); if (d) studio.files.openPath(d) }}>Export logs…</button>
      </header>

      <div className="card p-4 mb-4 grid grid-cols-3 gap-4 text-xs">
        <div><div className="text-ink-400">Engine</div><div className="font-mono text-ink-200 break-all">{(appInfo as any)?.engineDir ?? '—'}</div></div>
        <div><div className="text-ink-400">Python</div><div className="font-mono text-ink-200 break-all">{(appInfo as any)?.python ?? '—'}</div></div>
        <div><div className="text-ink-400">App version</div><div className="font-mono text-ink-200">{appInfo?.version ?? '—'}</div></div>
      </div>

      {list.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">No commands yet. Run an analysis or generation to see engine calls here.</div>
      ) : (
        <div className="grid grid-cols-[280px_1fr] gap-4">
          <div className="card p-2 max-h-[60vh] overflow-auto">
            {list.map((c) => (
              <button key={c.id} onClick={() => setSel(c.id)}
                className={`w-full text-left rounded-lg px-3 py-2 mb-1 transition ${current?.id === c.id ? 'bg-brand-500/15' : 'hover:bg-white/5'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-ink-100">{c.command}</span>
                  {c.ok === undefined ? <Badge tone="warn">running</Badge> : c.ok ? <Badge tone="ok">ok</Badge> : <Badge tone="fail">fail</Badge>}
                </div>
                <div className="text-[11px] text-ink-500">{new Date(c.at).toLocaleTimeString()} {c.durationMs != null ? `· ${c.durationMs}ms` : ''}</div>
              </button>
            ))}
          </div>

          {current && <CommandDetail c={current} />}
        </div>
      )}
    </div>
  )
}

function CommandDetail({ c }: { c: BridgeCommand }) {
  return (
    <div className="card p-5 space-y-4 max-h-[60vh] overflow-auto">
      <Row k="Command" v={c.command} />
      <Row k="Result" v={c.ok === undefined ? 'running…' : c.ok ? 'ok' : `fail (${c.error})`} />
      <Row k="Duration" v={c.durationMs != null ? `${c.durationMs} ms` : '—'} />
      <div>
        <div className="label">Arguments</div>
        <pre className="rounded-xl bg-ink-950 border border-white/10 p-3 text-xs text-ink-200 overflow-auto">{JSON.stringify(c.args, null, 2)}</pre>
      </div>
      <div>
        <div className="label">Invocation</div>
        <pre className="rounded-xl bg-ink-950 border border-white/10 p-3 text-xs text-ink-300 overflow-auto whitespace-pre-wrap">{c.argv}</pre>
      </div>
      {c.stderrTail && (
        <div>
          <div className="label">Engine output (tail)</div>
          <pre className="rounded-xl bg-ink-950 border border-white/10 p-3 text-xs text-ink-400 overflow-auto whitespace-pre-wrap">{c.stderrTail}</pre>
        </div>
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-ink-400 w-24">{k}</span>
      <span className="font-mono text-ink-100">{v}</span>
    </div>
  )
}
