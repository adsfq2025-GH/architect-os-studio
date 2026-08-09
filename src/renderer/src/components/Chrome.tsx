import { useApp, Route } from '../store'

const NAV: Array<{ id: Route['name']; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Projects', icon: '▤' },
  { id: 'new', label: 'New Project', icon: '＋' },
  { id: 'diagnostics', label: 'Diagnostics', icon: '⌘' },
  { id: 'settings', label: 'Settings', icon: '⚙' }
]

export function TitleBar() {
  const info = useApp((s) => s.appInfo)
  return (
    <div className="drag flex h-11 items-center justify-between px-4 bg-ink-950 border-b border-white/5">
      <div className="flex items-center gap-2 pl-16">
        <div className="grid h-5 w-5 place-items-center rounded bg-brand-500 text-[10px] font-black text-white">A</div>
        <span className="text-sm font-semibold text-ink-100">Architect OS Studio</span>
      </div>
      <span className="text-xs text-ink-500">v{info?.version ?? '1.0.0'}</span>
    </div>
  )
}

export function Sidebar() {
  const { route, go } = useApp()
  return (
    <aside className="w-56 shrink-0 border-r border-white/5 bg-ink-950/60 p-3 flex flex-col">
      <nav className="space-y-1">
        {NAV.map((n) => {
          const active = route.name === n.id
          return (
            <button
              key={n.id}
              onClick={() => go({ name: n.id } as Route)}
              className={`no-drag flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-brand-500/15 text-brand-200' : 'text-ink-300 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-base w-4 text-center">{n.icon}</span>{n.label}
            </button>
          )
        })}
      </nav>
      <div className="mt-auto card p-3 text-xs text-ink-400">
        <div className="font-semibold text-ink-200 mb-1">Turn mockups into websites</div>
        Upload → Generate → Import into Elementor. No code required.
      </div>
    </aside>
  )
}
