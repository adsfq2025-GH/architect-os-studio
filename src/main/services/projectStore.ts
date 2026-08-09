/**
 * Project store — SQLite (better-sqlite3) index of all projects, plus the on-disk folder
 * layout under Documents/Architect OS/Projects/<Client>/<Project>/. The DB is the fast index
 * for the dashboard (search/sort/filter/favorites); the folders are the source of truth for
 * inputs and outputs. The user never creates folders manually.
 */
import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync, rmSync, cpSync } from 'fs'
import { settingsStore } from './settingsStore'
import { logger } from './logger'

export type ProjectStatus = 'draft' | 'analyzing' | 'ready' | 'building' | 'completed' | 'failed'

export interface Project {
  id: string
  client: string
  name: string
  websiteType: string
  builder: string
  theme: string
  status: ProjectStatus
  favorite: number
  archived: number
  dir: string
  createdAt: number
  updatedAt: number
  lastBuildAt: number | null
  fidelity: number | null
  qaResult: string | null
}

function sanitize(s: string) {
  return s.replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, ' ') || 'Untitled'
}
function slugify(s: string) {
  return sanitize(s).toLowerCase().replace(/\s+/g, '-')
}

class ProjectStore {
  private db: Database.Database

  constructor() {
    const dbPath = join(app.getPath('userData'), 'projects.db')
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        client TEXT NOT NULL,
        name TEXT NOT NULL,
        websiteType TEXT,
        builder TEXT NOT NULL,
        theme TEXT,
        status TEXT NOT NULL,
        favorite INTEGER DEFAULT 0,
        archived INTEGER DEFAULT 0,
        dir TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        lastBuildAt INTEGER,
        fidelity REAL,
        qaResult TEXT
      );
      CREATE TABLE IF NOT EXISTS build_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        projectId TEXT NOT NULL,
        at INTEGER NOT NULL,
        result TEXT,
        fidelity REAL,
        kitPath TEXT
      );
    `)
  }

  private projectsRoot(): string {
    const root = settingsStore.get('projectLocation')
    if (!existsSync(root)) mkdirSync(root, { recursive: true })
    return root
  }

  create(input: Pick<Project, 'client' | 'name' | 'websiteType' | 'builder' | 'theme'>): Project {
    const id = `${Date.now().toString(36)}-${Math.round(Math.random() * 1e6).toString(36)}`
    const dir = join(this.projectsRoot(), sanitize(input.client), sanitize(input.name))
    for (const sub of ['input', 'assets', 'ir', 'ir/pages', 'build', 'reports', 'output']) {
      mkdirSync(join(dir, sub), { recursive: true })
    }
    const now = Date.now()
    const p: Project = {
      id, client: sanitize(input.client), name: sanitize(input.name),
      websiteType: input.websiteType || 'Business', builder: input.builder || 'elementor',
      theme: input.theme || 'Hello Elementor', status: 'draft', favorite: 0, archived: 0,
      dir, createdAt: now, updatedAt: now, lastBuildAt: null, fidelity: null, qaResult: null
    }
    this.db.prepare(`INSERT INTO projects
      (id,client,name,websiteType,builder,theme,status,favorite,archived,dir,createdAt,updatedAt,lastBuildAt,fidelity,qaResult)
      VALUES (@id,@client,@name,@websiteType,@builder,@theme,@status,@favorite,@archived,@dir,@createdAt,@updatedAt,@lastBuildAt,@fidelity,@qaResult)`).run(p)
    logger.info(`project created ${p.id} ${p.client}/${p.name}`)
    return p
  }

  get(id: string): Project | undefined {
    return this.db.prepare('SELECT * FROM projects WHERE id=?').get(id) as Project | undefined
  }

  list(opts?: { search?: string; sort?: string; includeArchived?: boolean }): Project[] {
    const sort = ({ recent: 'updatedAt DESC', name: 'name ASC', client: 'client ASC', created: 'createdAt DESC' } as Record<string, string>)[opts?.sort || 'recent'] || 'updatedAt DESC'
    let sql = `SELECT * FROM projects WHERE 1=1`
    const args: any[] = []
    if (!opts?.includeArchived) sql += ` AND archived=0`
    if (opts?.search) { sql += ` AND (name LIKE ? OR client LIKE ?)`; args.push(`%${opts.search}%`, `%${opts.search}%`) }
    sql += ` ORDER BY favorite DESC, ${sort}`
    return this.db.prepare(sql).all(...args) as Project[]
  }

  patch(id: string, patch: Partial<Project>): Project | undefined {
    const cur = this.get(id); if (!cur) return undefined
    const next = { ...cur, ...patch, updatedAt: Date.now() }
    this.db.prepare(`UPDATE projects SET
      client=@client,name=@name,websiteType=@websiteType,builder=@builder,theme=@theme,status=@status,
      favorite=@favorite,archived=@archived,updatedAt=@updatedAt,lastBuildAt=@lastBuildAt,fidelity=@fidelity,qaResult=@qaResult
      WHERE id=@id`).run(next)
    return next
  }

  recordBuild(id: string, result: string, fidelity: number | null, kitPath: string | null) {
    this.db.prepare('INSERT INTO build_history (projectId,at,result,fidelity,kitPath) VALUES (?,?,?,?,?)')
      .run(id, Date.now(), result, fidelity, kitPath)
    this.patch(id, { lastBuildAt: Date.now(), fidelity: fidelity ?? undefined, qaResult: result, status: result === 'PASS' ? 'completed' : 'failed' })
  }

  history(id: string) {
    return this.db.prepare('SELECT * FROM build_history WHERE projectId=? ORDER BY at DESC').all(id)
  }

  duplicate(id: string): Project | undefined {
    const src = this.get(id); if (!src) return undefined
    const copy = this.create({ client: src.client, name: `${src.name} Copy`, websiteType: src.websiteType, builder: src.builder, theme: src.theme })
    try { cpSync(join(src.dir, 'input'), join(copy.dir, 'input'), { recursive: true }); cpSync(join(src.dir, 'ir'), join(copy.dir, 'ir'), { recursive: true }) } catch { /* ignore */ }
    return copy
  }

  archive(id: string, archived = true) { return this.patch(id, { archived: archived ? 1 : 0 }) }
  favorite(id: string, favorite = true) { return this.patch(id, { favorite: favorite ? 1 : 0 }) }

  remove(id: string, deleteFiles: boolean) {
    const p = this.get(id)
    this.db.prepare('DELETE FROM projects WHERE id=?').run(id)
    this.db.prepare('DELETE FROM build_history WHERE projectId=?').run(id)
    if (deleteFiles && p && existsSync(p.dir)) { try { rmSync(p.dir, { recursive: true, force: true }) } catch { /* ignore */ } }
  }

  slugFor(p: Project) { return slugify(p.name) }
}

export const projectStore = new ProjectStore()
