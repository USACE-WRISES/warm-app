// The results panel beside a site's form: the main index large, with a meter; the parts it is built
// from; how far along the inputs are, with a link to the next one to fill; and the export buttons.
import type { CalcSpec, Evaluation } from '../calculators/types'
import { h } from '../lib/dom'
import { fmt } from '../lib/format'
import { icon } from '../lib/icons'

export interface ResultActions {
  focusField(id: string): void
  copy(): void
  csv(): void
  print(): void
}

const pct = (x: number | null | undefined) => `${Math.max(0, Math.min(1, x ?? 0)) * 100}%`

export function resultsPanel(spec: CalcSpec, ev: Evaluation, actions: ResultActions): HTMLElement[] {
  const primary = spec.outputs.find((o) => o.primary)!
  const value = ev.result?.values[primary.id] ?? null
  const required = ev.fields.filter((f) => !f.optional)
  const bad = new Set([...ev.missing, ...Object.keys(ev.errors).filter((id) => required.some((f) => f.id === id))])
  const done = required.length - bad.size

  const main = h('div', { class: 'wa-result-main' },
    h('div', { class: 'wa-result-label' }, primary.label),
    h('div', { class: `wa-result-value${value === null ? ' is-na' : ''}` }, value === null ? 'n/a' : fmt(value, primary.digits ?? 3)),
    h('div', { class: 'wa-meter', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '1', 'aria-valuenow': value === null ? undefined : String(value),
      'aria-label': primary.label }, h('span', { style: { width: value === null ? '0%' : pct(value) } })),
    h('div', { class: 'wa-meter-scale', 'aria-hidden': 'true' }, h('span', null, '0'), h('span', null, '0.5'), h('span', null, '1')))

  const sections = new Map<string, HTMLElement[]>()
  for (const o of spec.outputs) {
    if (o.primary) continue
    const v = ev.result?.values[o.id]
    if (ev.result && v === null) continue
    const row = h('div', { class: 'wa-result-row' },
      h('dt', null, o.label), h('dd', null, ev.result ? fmt(v, o.digits ?? 3) : 'n/a'),
      o.index && ev.result ? h('div', { class: 'wa-bar', 'aria-hidden': 'true' }, h('span', { style: { width: pct(v) } })) : null)
    const key = o.section ?? ''
    sections.set(key, [...(sections.get(key) ?? []), row])
  }
  // a long list (Chatfield's ten variable scores) runs in two columns
  const list = sections.size
    ? h('div', { class: 'wa-result-list' }, [...sections].map(([title, rows]) => [
      title ? h('h3', null, title) : null,
      h('dl', { class: rows.length > 4 ? 'wa-result-dl is-grid' : 'wa-result-dl' }, rows)]))
    : null

  // the first input, in page order, still to fill or to fix
  const next = ev.fields.find((f) => ev.errors[f.id] || ev.missing.includes(f.id))
  const progress = h('div', { class: `wa-progress${ev.result ? ' is-done' : ''}` },
    h('div', { class: 'wa-progress-top' },
      ev.result
        ? h('span', null, icon('check'), ` All ${required.length} inputs complete`)
        : h('span', null, `${done} of ${required.length} complete`),
      !ev.result && next
        ? h('button', { class: 'wa-link-btn', type: 'button', onclick: () => actions.focusField(next.id) }, ev.errors[next.id] ? 'Next to fix' : 'Next empty input')
        : null),
    h('div', { class: 'wa-progress-bar', 'aria-hidden': 'true' }, h('span', { style: { width: `${required.length ? (done / required.length) * 100 : 0}%` } })))

  const notes = ev.result?.notes?.length ? h('div', { class: 'wa-result-notes' }, ev.result.notes.map((n) => h('div', null, n))) : null

  return [
    h('div', { class: 'wa-result-card' }, main, notes, list, progress),
    h('div', { class: 'wa-result-actions' },
      h('button', { class: 'wa-btn wa-btn-sm', type: 'button', onclick: actions.copy, disabled: !ev.result, title: 'Copy the inputs and results for a spreadsheet' }, icon('copy'), 'Copy'),
      h('button', { class: 'wa-btn wa-btn-sm', type: 'button', onclick: actions.csv, title: 'Download the inputs and results as CSV' }, icon('download'), 'CSV'),
      h('button', { class: 'wa-btn wa-btn-sm', type: 'button', onclick: actions.print, title: 'Print this site' }, icon('print'), 'Print')),
  ]
}
