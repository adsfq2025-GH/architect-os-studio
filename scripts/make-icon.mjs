/**
 * Generate build/icon.ico from build/icon.png (multi-size) so electron-builder can brand the
 * Windows app + installer. Idempotent.
 */
import pngToIco from 'png-to-ico'
import { writeFileSync, existsSync } from 'fs'

if (existsSync('build/icon.ico')) {
  console.log('[make-icon] build/icon.ico already present — skipping')
  process.exit(0)
}
if (!existsSync('build/icon.png')) {
  console.error('[make-icon] build/icon.png missing'); process.exit(1)
}
const buf = await pngToIco(['build/icon.png'])
writeFileSync('build/icon.ico', buf)
console.log('[make-icon] wrote build/icon.ico')
