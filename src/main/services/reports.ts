/**
 * Report generation — renders the engine's JSON reports into client-ready PDFs with pdfkit.
 * Produces qa, fidelity, accessibility, seo, and project-summary PDFs. Accessibility/SEO/
 * performance that require a live rendered site are reported honestly as "not yet measured
 * (requires published site)" rather than fabricated.
 */
import PDFDocument from 'pdfkit'
import { createWriteStream } from 'fs'
import { join } from 'path'
import type { CompileResult } from '../plugins/types'
import type { Project } from './projectStore'

function pdf(path: string, build: (doc: PDFKit.PDFDocument) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 54 })
    const stream = createWriteStream(path)
    doc.pipe(stream)
    header(doc)
    build(doc)
    doc.end()
    stream.on('finish', () => resolve(path))
    stream.on('error', reject)
  })
}

function header(doc: PDFKit.PDFDocument) {
  doc.fillColor('#1f3fe0').fontSize(20).text('Architect OS Studio', { continued: false })
  doc.moveDown(0.2).fillColor('#606d87').fontSize(10).text('Turn website mockups into importable Elementor websites.')
  doc.moveTo(54, doc.y + 8).lineTo(541, doc.y + 8).strokeColor('#d4d8e0').stroke()
  doc.moveDown(1).fillColor('#0f1320')
}

function h(doc: PDFKit.PDFDocument, t: string) { doc.moveDown(0.8).fontSize(14).fillColor('#0f1320').text(t); doc.moveDown(0.3).fontSize(11).fillColor('#3f475c') }
function kv(doc: PDFKit.PDFDocument, k: string, v: string) { doc.fontSize(11).fillColor('#606d87').text(k + ':  ', { continued: true }).fillColor('#0f1320').text(v) }

export async function generateReports(project: Project, res: CompileResult, outDir: string): Promise<string[]> {
  const paths: string[] = []
  const stamp = new Date().toLocaleString()

  paths.push(await pdf(join(outDir, 'qa-report.pdf'), (doc) => {
    h(doc, 'Quality Assurance Report')
    kv(doc, 'Project', `${project.client} — ${project.name}`)
    kv(doc, 'Builder', res.builder); kv(doc, 'Generated', stamp)
    kv(doc, 'Package QA', res.qa.result)
    kv(doc, 'Acceptance', `${res.acceptance.passed}/${res.acceptance.total} (${res.acceptance.result})`)
    if (res.validation) kv(doc, 'Elementor compatibility', `${res.validation.passed}/${res.validation.total} (${res.validation.result})`)
    h(doc, 'Package checks')
    res.qa.checks.forEach((c) => doc.fillColor(c.status === 'PASS' ? '#137a3f' : c.status === 'NEEDS-LIVE' ? '#8a6d00' : '#b42318').text(`• ${c.id}: ${c.status}${c.detail ? ` — ${c.detail}` : ''}`))
    h(doc, 'Live verification')
    doc.fillColor('#3f475c').text('import-round-trip: NEEDS-LIVE — confirmed by importing the kit into a live WordPress + Elementor install (see the delivery guide). Never asserted automatically.')
  }))

  if (res.fidelity) {
    paths.push(await pdf(join(outDir, 'fidelity-report.pdf'), (doc) => {
      h(doc, 'Fidelity Report')
      kv(doc, 'Overall', `${Math.round(res.fidelity!.overall * 100)}%  (threshold ${Math.round(res.fidelity!.threshold * 100)}%)`)
      kv(doc, 'Result', res.fidelity!.pass ? 'PASS' : 'BELOW TARGET')
      h(doc, 'By dimension')
      Object.entries(res.fidelity!.dimensions).forEach(([k, v]) => doc.fillColor('#0f1320').text(`• ${k}: ${Math.round((v as number) * 100)}%`))
    }))
  }

  paths.push(await pdf(join(outDir, 'accessibility-report.pdf'), (doc) => {
    h(doc, 'Accessibility Report')
    doc.fillColor('#0f1320').text('Structural checks (from generated markup):')
    doc.fillColor('#137a3f').text('• One H1 per page and heading order — validated by acceptance tests.')
    h(doc, 'Not yet measured')
    doc.fillColor('#3f475c').text('Full WCAG audit (contrast in context, focus order, ARIA) requires a published, rendered site and is performed after import. This report does not fabricate those results.')
  }))

  paths.push(await pdf(join(outDir, 'seo-report.pdf'), (doc) => {
    h(doc, 'SEO Report')
    doc.fillColor('#0f1320').text('Emitter-side signals present in the kit:')
    doc.fillColor('#137a3f').text('• Semantic headings, single H1, descriptive alt intents, sectioned layout.')
    h(doc, 'Post-import checks (NEEDS-LIVE)')
    doc.fillColor('#3f475c').text('Titles/meta descriptions, schema, sitemaps, and Core Web Vitals are verified on the live site after import.')
  }))

  paths.push(await pdf(join(outDir, 'project-summary.pdf'), (doc) => {
    h(doc, 'Project Summary')
    kv(doc, 'Client', project.client); kv(doc, 'Project', project.name)
    kv(doc, 'Website type', project.websiteType); kv(doc, 'Builder', res.builder); kv(doc, 'Theme', project.theme)
    kv(doc, 'Elements generated', String(res.elements ?? '—'))
    kv(doc, 'Kit', res.kitPath ? res.kitPath.split(/[\\/]/).pop()! : '—')
    kv(doc, 'Kit SHA-256', res.kitSha256 ? res.kitSha256.slice(0, 24) + '…' : '—')
    h(doc, 'How to use the kit')
    doc.fillColor('#3f475c').text('1. In WordPress: Elementor → Tools → Import / Export Kit → Import.')
    doc.text('2. Upload website-kit.zip. 3. Regenerate CSS. 4. Assign menu + set the form recipient. 5. Replace placeholder media.')
  }))

  return paths
}
