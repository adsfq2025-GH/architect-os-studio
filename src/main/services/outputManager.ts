/**
 * Output Manager — the last stage. After a successful build it copies the kit and generates
 * the PDF reports into Downloads/<Client>-<Project>/ so the user never hunts for files, and
 * mirrors them into the project's own output/ folder. Returns the delivered file paths.
 */
import { join } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import type { CompileResult } from '../plugins/types'
import type { Project } from './projectStore'
import { generateReports } from './reports'
import { settingsStore } from './settingsStore'
import { logger } from './logger'

function safe(s: string) { return s.replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '-') }

export interface Delivery { folder: string; kit: string | null; reports: string[] }

export async function deliver(project: Project, res: CompileResult): Promise<Delivery> {
  const downloadsRoot = settingsStore.get('downloadsDir')
  const folderName = `${safe(project.client)}-${safe(project.name)}`
  const dlFolder = join(downloadsRoot, folderName)
  const projOut = join(project.dir, 'output')
  for (const d of [dlFolder, projOut]) if (!existsSync(d)) mkdirSync(d, { recursive: true })

  let kitOut: string | null = null
  if (res.kitPath && existsSync(res.kitPath)) {
    kitOut = join(dlFolder, 'website-kit.zip')
    copyFileSync(res.kitPath, kitOut)
    copyFileSync(res.kitPath, join(projOut, 'website-kit.zip'))
  }

  let reports: string[] = []
  if (settingsStore.get('autoDownload')) {
    reports = await generateReports(project, res, dlFolder)
    for (const r of reports) copyFileSync(r, join(projOut, r.split(/[\\/]/).pop()!))
  }

  logger.info(`delivered ${folderName}: kit=${!!kitOut} reports=${reports.length}`)
  return { folder: dlFolder, kit: kitOut, reports }
}
