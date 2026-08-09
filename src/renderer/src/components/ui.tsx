import React from 'react'

export function Badge({ tone = 'neutral', children }: { tone?: 'ok' | 'fail' | 'warn' | 'brand' | 'neutral'; children: React.ReactNode }) {
  const map = {
    ok: 'bg-emerald-500/15 text-emerald-300',
    fail: 'bg-rose-500/15 text-rose-300',
    warn: 'bg-amber-500/15 text-amber-300',
    brand: 'bg-brand-500/15 text-brand-300',
    neutral: 'bg-white/10 text-ink-300'
  }
  return <span className={`chip ${map[tone]}`}>{children}</span>
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  )
}

export function StatCard({ label, value, tone = 'neutral' }: { label: string; value: React.ReactNode; tone?: 'ok' | 'fail' | 'warn' | 'neutral' }) {
  const ring = { ok: 'ring-emerald-500/30', fail: 'ring-rose-500/30', warn: 'ring-amber-500/30', neutral: 'ring-white/5' }[tone]
  return (
    <div className={`card p-4 ring-1 ${ring}`}>
      <div className="text-xs uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink-50">{value}</div>
    </div>
  )
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-2 ${i <= current ? 'text-brand-300' : 'text-ink-500'}`}>
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${i < current ? 'bg-brand-500 text-white' : i === current ? 'bg-brand-500/20 text-brand-200 ring-1 ring-brand-400' : 'bg-white/5'}`}>
              {i < current ? '✓' : i + 1}
            </span>
            <span className="text-xs font-semibold hidden md:block">{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`h-px w-6 ${i < current ? 'bg-brand-500' : 'bg-white/10'}`} />}
        </React.Fragment>
      ))}
    </div>
  )
}

export function LogView({ lines }: { lines: string[] }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight) }, [lines])
  return (
    <div ref={ref} className="h-64 overflow-auto rounded-xl bg-ink-950 border border-white/10 p-3 font-mono text-xs leading-relaxed text-ink-300">
      {lines.length === 0 && <div className="text-ink-500">Waiting for the engine…</div>}
      {lines.map((l, i) => <div key={i} className="whitespace-pre-wrap">{l}</div>)}
    </div>
  )
}

export function DropZone({ onFiles, hint }: { onFiles: () => void; hint: string }) {
  const [over, setOver] = React.useState(false)
  return (
    <button
      onClick={onFiles}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles() }}
      className={`no-drag w-full rounded-3xl border-2 border-dashed p-12 text-center transition ${over ? 'border-brand-400 bg-brand-500/10' : 'border-white/15 hover:border-white/30 bg-white/[.02]'}`}
    >
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-500/15 text-brand-300 text-3xl">↑</div>
      <div className="text-lg font-semibold text-ink-100">Drop mockups here or click to browse</div>
      <div className="mt-1 text-sm text-ink-400">{hint}</div>
    </button>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>
}

export function EmptyState({ title, sub, action }: { title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div className="card p-12 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-3xl">✦</div>
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-ink-400">{sub}</div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
