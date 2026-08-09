import { useApp } from '../store'

/**
 * Surfaces the most recent engine command's raw stdout + traceback. Shown automatically in
 * error panels — especially for ENGINE_BAD_OUTPUT, where the raw stdout is the whole diagnosis
 * (the engine wrote something that wasn't the JSON envelope).
 */
export function EngineOutput() {
  const { diagnostics, go } = useApp()
  const last = diagnostics[diagnostics.length - 1]
  if (!last) return null
  const bad = last.error === 'ENGINE_BAD_OUTPUT'

  return (
    <div className="mt-4 rounded-xl bg-ink-950 border border-white/10 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-ink-300">
          Engine output — last command: <span className="font-mono">{last.command}</span>
          {last.durationMs != null ? ` · ${last.durationMs}ms` : ''}
        </span>
        <button className="text-xs text-brand-300 no-drag" onClick={() => go({ name: 'diagnostics' })}>
          Open Developer Diagnostics →
        </button>
      </div>

      {bad && (
        <div className="mb-2 text-xs text-rose-300">
          The engine wrote something to stdout that wasn't the expected JSON envelope. Raw stdout below.
        </div>
      )}

      <div className="text-[11px] uppercase tracking-wide text-ink-500 mb-1">stdout</div>
      <pre className={`max-h-40 overflow-auto rounded-lg border p-2 text-xs whitespace-pre-wrap ${bad ? 'border-rose-500/40 text-rose-200' : 'border-white/10 text-ink-300'}`}>
        {last.rawStdout || '(empty)'}
      </pre>

      {last.traceback && (
        <>
          <div className="text-[11px] uppercase tracking-wide text-ink-500 mt-2 mb-1">traceback</div>
          <pre className="max-h-40 overflow-auto rounded-lg border border-rose-500/30 p-2 text-xs text-rose-200 whitespace-pre-wrap">{last.traceback}</pre>
        </>
      )}

      {last.stderrTail && (
        <>
          <div className="text-[11px] uppercase tracking-wide text-ink-500 mt-2 mb-1">stderr (tail)</div>
          <pre className="max-h-32 overflow-auto rounded-lg border border-white/10 p-2 text-xs text-ink-400 whitespace-pre-wrap">{last.stderrTail}</pre>
        </>
      )}
    </div>
  )
}
