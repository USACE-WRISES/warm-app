// One site: the calculator's inputs as a guided form, grouped as the model groups them, beside the
// results. Typing updates the results at once; a setup choice (cover type, species) shows its inputs.
// Pasting a column of values from a spreadsheet fills the fields in order.
import { hasSpecies, RESACA } from '../calculators/resaca'
import { type CalcSpec, categoryOf, type Evaluation, evaluateSite, type FieldGroup, parseNumber, type Raw } from '../calculators/types'
import type { ResacaHabitat } from '../engine/models/resaca'
import type { Variable } from '../engine/variables'
import { h } from '../lib/dom'
import { fmt } from '../lib/format'
import { icon } from '../lib/icons'
import { toast } from '../lib/toast'
import { curveFigure } from './curve'
import { forEvaluation } from './exportSites'
import { resultsPanel, type ResultActions } from './results'
import { speciesTable, type SpeciesTable } from './resacaSpecies'

interface FieldParts { wrap: HTMLElement; control: HTMLInputElement | HTMLSelectElement | null; error: HTMLElement; si: HTMLElement | null; figure: HTMLElement | null }

const domId = (id: string) => `f-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
/** The two Resaca inputs the species table fills. */
const DERIVED = new Set(['ssiSum', 'present'])

export interface SiteForm { el: HTMLElement; setRaw(raw: Raw): void }

export function siteForm(spec: CalcSpec, initial: Raw, onChange: (raw: Raw) => void, actions: Omit<ResultActions, 'focusField'>): SiteForm {
  let raw: Raw = { ...initial }
  let ev: Evaluation = evaluateSite(spec, forEvaluation(spec, raw))
  let shown = ''
  const parts = new Map<string, FieldParts>()
  const groupScores = new Map<string, HTMLElement>()
  const formCol = h('div', { class: 'wa-form-col' })
  const resultsCol = h('aside', { class: 'wa-results', 'aria-label': 'Results' })
  let species: SpeciesTable | null = null

  const evaluate = () => evaluateSite(spec, forEvaluation(spec, raw))
  const visibleKey = (e: Evaluation) => e.fields.map((f) => f.id).join('|')

  function set(id: string, value: string, quiet = false): void {
    raw = { ...raw, [id]: value }
    if (!quiet) {
      onChange(raw)
      refresh()
    }
  }

  function focusField(id: string): void {
    const p = parts.get(id)
    if (p?.control && !p.control.hasAttribute('readonly')) {
      p.control.focus()
      p.control.scrollIntoView({ block: 'center', behavior: 'smooth' })
    } else if (p) {
      p.wrap.scrollIntoView({ block: 'center', behavior: 'smooth' })
    } else if (DERIVED.has(id)) {
      species?.el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }

  /** Fill fields in page order from pasted values, starting at a field; a setup value shown first
   * opens its own inputs for the values after it. */
  function pasteFrom(start: string, values: string[]): number {
    let next = { ...raw }
    const fillable = (r: Raw) => evaluateSite(spec, forEvaluation(spec, r)).fields.map((f) => f.id)
      .filter((id) => !(spec.speciesTable && DERIVED.has(id) && hasSpecies(r)))
    let order = fillable(next)
    let pos = order.indexOf(start)
    let n = 0
    for (const value of values) {
      const id = order[pos]
      if (!id) break
      next = { ...next, [id]: value }
      n++
      pos++
      order = fillable(next)
    }
    raw = next
    return n
  }

  function onPaste(e: ClipboardEvent, id: string): void {
    const text = e.clipboardData?.getData('text') ?? ''
    const values = text.replace(/\r/g, '').split(/[\n\t]/).map((x) => x.trim())
    while (values.length && values[values.length - 1] === '') values.pop()
    if (values.length <= 1) return
    e.preventDefault()
    const n = pasteFrom(id, values)
    onChange(raw)
    render(id)
    toast(n < values.length ? `Filled ${n} fields; ${values.length - n} pasted values had no field left.` : `Filled ${n} fields from the pasted values.`)
  }

  function control(f: Variable): HTMLInputElement | HTMLSelectElement {
    const id = domId(f.id)
    const describedBy = `${id}-help ${id}-err`
    if (f.categories) {
      const sel = h('select', { class: 'wa-select', id, 'aria-describedby': describedBy, value: categoryOf(spec, f.id, raw) ?? '',
        onchange: () => set(f.id, sel.value) },
      h('option', { value: '' }, 'Choose...'), f.categories.map((c) => h('option', { value: c.value }, c.note ? `${c.label} (${c.note})` : c.label)))
      return sel
    }
    const input = h('input', { class: 'wa-input num', id, type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-describedby': describedBy,
      value: raw[f.id] ?? '', oninput: () => set(f.id, input.value), onpaste: (e: ClipboardEvent) => onPaste(e, f.id),
      // room for the unit shown inside the field
      style: { paddingRight: `${Math.min(84, 18 + (f.unit?.length ?? 0) * 7)}px` } })
    return input
  }

  function field(f: Variable): HTMLElement {
    const id = domId(f.id)
    const ctl = control(f)
    const error = h('p', { class: 'wa-field-error', id: `${id}-err`, hidden: true })
    const si = f.curve || f.categories ? h('span', { class: 'wa-si', 'aria-live': 'polite' }) : null
    let figure: HTMLElement | null = null
    let toggle: HTMLElement | null = null
    if (f.curve) {
      figure = h('figure', { class: 'wa-curve', hidden: true, id: `${id}-curve` })
      toggle = h('button', { type: 'button', class: 'wa-link-btn', 'aria-expanded': 'false', 'aria-controls': `${id}-curve`, onclick: () => {
        const open = figure!.hidden
        figure!.hidden = !open
        toggle!.setAttribute('aria-expanded', String(open))
        if (open) drawCurve(f)
      } }, icon('curve'), 'Curve')
    }
    const derivedNote = spec.speciesTable && DERIVED.has(f.id) ? `${f.help ?? ''} The species table below fills this in; or enter it here.`.trim() : null
    const wrap = h('div', { class: 'wa-field', 'data-id': f.id },
      h('div', { class: 'wa-field-label' },
        h('label', { for: id }, f.code && f.code !== f.label ? h('span', { class: 'wa-code' }, f.code) : null, f.label),
        h('p', { class: 'wa-field-help', id: `${id}-help` }, derivedNote ?? f.help ?? '')),
      h('div', { class: 'wa-field-control' },
        f.categories ? ctl : h('div', { class: 'wa-input-wrap' }, ctl, f.unit ? h('span', { class: 'wa-unit', 'aria-hidden': 'true' }, f.unit) : null),
        si || toggle ? h('div', { class: 'wa-si-row' }, si ?? h('span'), toggle) : null),
      error, figure)
    parts.set(f.id, { wrap, control: ctl, error, si, figure })
    return wrap
  }

  function drawCurve(f: Variable): void {
    const p = parts.get(f.id)
    if (!p?.figure || p.figure.hidden) return
    const v = parseNumber(raw[f.id] ?? '')
    p.figure.replaceChildren(curveFigure(f, v), h('figcaption', null, `${f.label}${f.unit ? ` (${f.unit})` : ''} against its suitability index${f.source ? `; ${f.source}` : ''}.`))
  }

  function setupGroup(g: FieldGroup): HTMLElement[] {
    return g.fields.map((f) => {
      if (!f.categories) return field(f)
      const current = categoryOf(spec, f.id, raw)
      const name = domId(f.id)
      const options = h('div', { class: 'wa-options', role: 'radiogroup', 'aria-label': f.label, 'data-id': f.id },
        f.categories.map((c) => h('label', { class: 'wa-option' },
          h('input', { type: 'radio', name, value: c.value, checked: current === c.value, onchange: () => set(f.id, c.value) }),
          h('span', { class: 'wa-option-label' }, c.label),
          c.note ? h('span', { class: 'wa-option-note' }, c.note) : null)))
      parts.set(f.id, { wrap: options, control: null, error: h('p'), si: null, figure: null })
      return options
    })
  }

  function group(g: FieldGroup, only: boolean): HTMLElement {
    const score = spec.outputs.find((o) => o.id === g.id) ? h('span', { class: 'wa-group-score' }) : null
    if (score) groupScores.set(g.id, score)
    const hid = `g-${g.id}`
    const first = g.fields[0]
    return h('section', { class: 'wa-group', 'aria-labelledby': hid },
      h('div', { class: 'wa-group-head' }, h('h2', { id: hid }, g.title), score),
      g.note ? h('p', { class: 'wa-group-note' }, g.note) : null,
      g.setup ? setupGroup(g) : g.fields.map(field),
      g.setup && only && !ev.result && first
        ? h('p', { class: 'wa-setup-hint' }, `${first.categories ? 'Choose' : 'Enter'} the ${first.label.toLowerCase()} to see its inputs.`)
        : null)
  }

  const nameInput = h('input', { class: 'wa-input', id: 'f-site-name', type: 'text', placeholder: 'Optional, for your exports', value: raw.name ?? '',
    oninput: () => set('name', nameInput.value) })
  const siteName = h('div', { class: 'wa-group' },
    h('div', { class: 'wa-field', style: { borderTop: '0' } },
      h('div', { class: 'wa-field-label' }, h('label', { for: 'f-site-name' }, 'Site name'),
        h('p', { class: 'wa-field-help' }, 'A label for this site or alternative.')),
      h('div', { class: 'wa-field-control' }, nameInput)))

  function render(focusId?: string): void {
    ev = evaluate()
    shown = visibleKey(ev)
    parts.clear()
    groupScores.clear()
    const only = ev.groups.length === 1 && !!ev.groups[0].setup
    const blocks: HTMLElement[] = [siteName, ...ev.groups.map((g) => group(g, only))]
    if (spec.speciesTable && ev.groups.length > 1) {
      const habitat = categoryOf(RESACA, 'habitat', raw) as ResacaHabitat | undefined
      species = speciesTable(raw, habitat, (id, value) => set(id, value))
      const vegIndex = ev.groups.findIndex((g) => g.id === 'vegetation')
      blocks.splice(vegIndex + 2, 0, species.el)
    } else {
      species = null
    }
    formCol.replaceChildren(...blocks)
    refresh(true)
    if (focusId) {
      const p = parts.get(focusId)
      if (p?.control) p.control.focus()
      else p?.wrap.querySelector<HTMLInputElement>('input:checked')?.focus()
    }
  }

  function refresh(fromRender = false): void {
    const next = evaluate()
    if (!fromRender && visibleKey(next) !== shown) {
      const active = document.activeElement as HTMLElement | null
      const activeId = active?.closest('[data-id]')?.getAttribute('data-id') ?? undefined
      ev = next
      render(activeId)
      return
    }
    ev = next
    for (const [id, p] of parts) {
      const err = ev.errors[id]
      p.error.hidden = !err
      p.error.replaceChildren(...(err ? [icon('alert'), err] : []))
      if (p.control) {
        if (err) p.control.setAttribute('aria-invalid', 'true')
        else p.control.removeAttribute('aria-invalid')
        if (spec.speciesTable && DERIVED.has(id)) {
          // filled from the species table while it is in use; typed in otherwise
          const input = p.control as HTMLInputElement
          input.readOnly = hasSpecies(raw)
          if (input.readOnly) input.value = forEvaluation(spec, raw)[id] ?? ''
        }
      }
      if (p.si) {
        const s = ev.si[id]
        p.si.replaceChildren(...(s === undefined ? [] : ['SI ', h('b', null, fmt(s, 3))]))
      }
      if (p.figure && !p.figure.hidden) {
        const f = ev.fields.find((x) => x.id === id)
        if (f) drawCurve(f)
      }
    }
    for (const [gid, el] of groupScores) {
      const v = ev.result?.values[gid]
      const o = spec.outputs.find((x) => x.id === gid)
      el.textContent = v === null || v === undefined ? '' : fmt(v, o?.digits ?? 3)
    }
    if (species) species.update(raw, categoryOf(RESACA, 'habitat', raw) as ResacaHabitat | undefined)
    resultsCol.replaceChildren(...resultsPanel(spec, ev, { ...actions, focusField }))
  }

  render()
  const el = h('div', { class: 'wa-calc-body' }, formCol, resultsCol)
  return {
    el,
    setRaw(next: Raw) {
      raw = { ...next }
      nameInput.value = raw.name ?? ''
      render()
    },
  }
}
