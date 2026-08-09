/**
 * Plugin Manager — the registry of compiler backends.
 *
 * Elementor is registered by default. Future backends (Bricks, Breakdance, Webflow, Shopify,
 * Gutenberg) register here with no change to the UI or workflow. The manager also advertises
 * "planned" backends so the builder picker can show the roadmap (disabled) without them being
 * runnable yet.
 */
import type { CompilerBackend, BackendManifest } from '../plugins/types'
import elementor from '../plugins/elementor'

const PLANNED: BackendManifest[] = [
  { id: 'bricks', name: 'Bricks', version: '0.1.0', description: 'Bricks templates (flat model + global classes).', outputExtension: 'zip', status: 'planned', qaDimensions: [] },
  { id: 'gutenberg', name: 'Gutenberg', version: '0.1.0', description: 'Block patterns / theme.json.', outputExtension: 'zip', status: 'planned', qaDimensions: [] },
  { id: 'webflow', name: 'Webflow', version: '0.1.0', description: 'Webflow site export.', outputExtension: 'zip', status: 'planned', qaDimensions: [] },
  { id: 'breakdance', name: 'Breakdance', version: '0.1.0', description: 'Breakdance templates.', outputExtension: 'zip', status: 'planned', qaDimensions: [] },
  { id: 'shopify', name: 'Shopify', version: '0.1.0', description: 'Online Store 2.0 sections.', outputExtension: 'zip', status: 'planned', qaDimensions: [] }
]

class PluginManager {
  private backends = new Map<string, CompilerBackend>()

  constructor() {
    this.register(elementor)
  }

  register(b: CompilerBackend) { this.backends.set(b.manifest.id, b) }

  get(id: string): CompilerBackend | undefined { return this.backends.get(id) }

  /** installed (runnable) backends + planned (roadmap, disabled) */
  list(): BackendManifest[] {
    const installed = Array.from(this.backends.values()).map((b) => b.manifest)
    const installedIds = new Set(installed.map((m) => m.id))
    const planned = PLANNED.filter((p) => !installedIds.has(p.id))
    return [...installed, ...planned]
  }
}

export const pluginManager = new PluginManager()
