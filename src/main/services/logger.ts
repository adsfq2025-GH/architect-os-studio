/**
 * Logging service. Writes rotating, human-readable logs to the user data dir so support can
 * export them from Settings. Four channels: build, compiler, qa, error.
 */
import { app } from 'electron'
import { createWriteStream, WriteStream, mkdirSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

type Channel = 'build' | 'compiler' | 'qa' | 'error'

class Logger {
  private dir: string
  private streams: Partial<Record<Channel, WriteStream>> = {}

  constructor() {
    this.dir = join(app.getPath('userData'), 'logs')
    if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true })
  }

  private stream(ch: Channel): WriteStream {
    if (!this.streams[ch]) {
      this.streams[ch] = createWriteStream(join(this.dir, `${ch}.log`), { flags: 'a' })
    }
    return this.streams[ch]!
  }

  log(ch: Channel, msg: string): void {
    const line = `[${new Date().toISOString()}] ${msg}\n`
    try { this.stream(ch).write(line) } catch { /* ignore */ }
    if (ch === 'error') this.stream('build').write(line)
  }

  info(msg: string) { this.log('build', msg) }
  compiler(msg: string) { this.log('compiler', msg) }
  qa(msg: string) { this.log('qa', msg) }
  error(msg: string) { this.log('error', `ERROR ${msg}`) }

  logDir(): string { return this.dir }

  read(ch: Channel): string {
    const p = join(this.dir, `${ch}.log`)
    return existsSync(p) ? readFileSync(p, 'utf-8') : ''
  }
}

export const logger = new Logger()
