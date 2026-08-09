import { useEffect, useState } from 'react'
import { useApp } from '../store'
import { studio } from '../lib/ipc'
import { DropZone, Stepper } from '../components/ui'

export default function Upload({ projectId }: { projectId: string }) {
  const { go } = useApp()
  const [files, setFiles] = useState<string[]>([])

  const refresh = async () => setFiles(await studio.files.listMockups(projectId))
  useEffect(() => { refresh() }, [projectId])

  const pick = async () => {
    const paths = await studio.files.pickMockups()
    if (paths.length) { await studio.files.importMockups(projectId, paths); refresh() }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Stepper steps={['New Project', 'Upload', 'Analysis', 'Blueprint', 'Generate', 'Download']} current={1} />
      <h1 className="text-2xl font-bold mt-6 mb-1">Upload mockups</h1>
      <p className="text-sm text-ink-400 mb-6">Add one image per page. We detect pages, colors, type, spacing, and components automatically.</p>

      <DropZone onFiles={pick} hint="PNG · JPG · WebP · PDF · Figma export · ZIP" />

      {files.length > 0 && (
        <div className="card p-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">{files.length} file{files.length > 1 ? 's' : ''} added</div>
            <button className="btn-subtle" onClick={pick}>＋ Add more</button>
          </div>
          <ul className="divide-y divide-white/5">
            {files.map((f) => (
              <li key={f} className="flex items-center gap-3 py-2 text-sm">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-xs">IMG</span>
                <span className="flex-1 truncate text-ink-200">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button className="btn-ghost" onClick={() => go({ name: 'dashboard' })}>Back</button>
        <button className="btn-primary" disabled={files.length === 0} onClick={() => go({ name: 'analysis', projectId })}>Analyze mockups →</button>
      </div>
    </div>
  )
}
