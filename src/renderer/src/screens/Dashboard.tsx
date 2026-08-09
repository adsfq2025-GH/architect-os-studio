import { useEffect, useState, type ReactNode } from 'react'
import { useApp } from '../store'
import { studio } from '../lib/ipc'
import { Badge, EmptyState } from '../components/ui'
import type { Project } from '../lib/types'

const STATUS_TONE: Record<string, 'ok' | 'fail' | 'warn' | 'brand' | 'neutral'> = {
  completed: 'ok', failed: 'fail', building: 'warn', analyzing: 'warn', ready: 'brand', draft: 'neutral'
}

export default function Dashboard() {
  const { projects, refreshProjects, go } = useApp()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')

  useEffect(() => { refreshProjects(search, sort) }, [search, sort])

  const active = projects.filter((p) => ['analyzing', 'building', 'ready'].includes(p.status))
  const completed = projects.filter((p) => p.status === 'completed')
  const failed = projects.filter((p) => p.status === 'failed')
  const favorites = projects.filter((p) => p.favorite)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-ink-400">Turn website mockups into importable Elementor websites.</p>
        </div>
        <button className="btn-primary" onClick={() => go({ name: 'new' })}>＋ New Project</button>
      </header>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Metric label="Active" value={active.length} />
        <Metric label="Completed" value={completed.length} />
        <Metric label="Failed" value={failed.length} />
        <Metric label="Favorites" value={favorites.length} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input className="input max-w-xs" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-[160px]" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recent">Recently updated</option>
          <option value="created">Newest</option>
          <option value="name">Name</option>
          <option value="client">Client</option>
        </select>
      </div>

      {projects.length === 0 ? (
        <EmptyState title="No projects yet" sub="Create your first project and upload mockups to generate an Elementor website."
          action={<button className="btn-primary" onClick={() => go({ name: 'new' })}>＋ New Project</button>} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects.map((p) => <ProjectCard key={p.id} p={p} onChange={() => refreshProjects(search, sort)} />)}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  )
}

function ProjectCard({ p, onChange }: { p: Project; onChange: () => void }) {
  const { go } = useApp()
  const [menu, setMenu] = useState(false)

  const open = () => {
    if (p.status === 'completed') go({ name: 'output', projectId: p.id })
    else if (p.status === 'ready') go({ name: 'blueprint', projectId: p.id })
    else go({ name: 'upload', projectId: p.id })
  }

  return (
    <div className="card p-5 hover:ring-1 hover:ring-brand-500/30 transition group">
      <div className="flex items-start justify-between">
        <button className="text-left" onClick={open}>
          <div className="text-xs text-ink-400">{p.client}</div>
          <div className="text-lg font-semibold group-hover:text-brand-200">{p.name}</div>
        </button>
        <div className="flex items-center gap-2">
          <button className="btn-subtle px-2 py-1" title="Favorite" onClick={async () => { await studio.projects.favorite(p.id, !p.favorite); onChange() }}>
            {p.favorite ? '★' : '☆'}
          </button>
          <div className="relative">
            <button className="btn-subtle px-2 py-1" onClick={() => setMenu((m) => !m)}>⋯</button>
            {menu && (
              <div className="absolute right-0 z-10 mt-1 w-40 card p-1 shadow-pop text-sm" onMouseLeave={() => setMenu(false)}>
                <MenuItem onClick={async () => { await studio.projects.duplicate(p.id); onChange(); setMenu(false) }}>Duplicate</MenuItem>
                <MenuItem onClick={async () => { await studio.projects.export(p.id); setMenu(false) }}>Export…</MenuItem>
                <MenuItem onClick={async () => { await studio.projects.archive(p.id, true); onChange(); setMenu(false) }}>Archive</MenuItem>
                <MenuItem danger onClick={async () => { await studio.projects.delete(p.id, false); onChange(); setMenu(false) }}>Delete</MenuItem>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
        <div className="text-xs text-ink-400">
          {p.fidelity != null ? `Fidelity ${Math.round(p.fidelity * 100)}%` : 'Not generated'}
        </div>
      </div>
    </div>
  )
}

function MenuItem({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`block w-full rounded-lg px-3 py-2 text-left hover:bg-white/5 ${danger ? 'text-rose-300' : 'text-ink-200'}`}>{children}</button>
}
