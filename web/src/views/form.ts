// One site: the calculator's inputs in a compact grid, grouped as the model groups them, beside the
// results. The site's name, the setup choice (cover type, species) and the site's area come first, and
// the setup choice shows its own inputs. Typing updates the results at once. Each input's help and
// curve open from its (i) button. Pasting a column of values from a spreadsheet fills the fields in
// order.
import { hasSpecies, RESACA } from '../calculators/resaca'
import { type CalcSpec, categoryOf, type Evaluation, evaluateSite, type FieldGroup, parseNumber, type Raw } from '../calculators/types'
import type { ResacaHabitat } from '../engine/models/resaca'
import type { Variable } from '../engine/variables'
import { append, h } from '../lib/dom'
import { fmt } from '../lib/format'
import { icon } from '../lib/icons'
import { toast } from '../lib/toast'
import { curveFigure } from './curve'
import { forEvaluation } from './exportSites'
import { resultsPanel, type ResultActions } from './results'
import { speciesTable, type SpeciesTable } from './resacaSpecies'

interface FieldParts {
  variable: Variable
  wrap: HTMLElement
  control: HTMLInputElement | HTMLSelectElement
  error: HTMLElement
  si: HTMLElement | null
  help: string
  info: HTMLButtonElement | null
  pop: HTMLElement | null
  setup: boolean
}

type FieldKind = 'input' | 'setup' | 'site'

const domId = (id: string) => `f-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
/** The two Resaca inputs the species table fills. */
const DERIVED = new Set(['ssiSum', 'present'])

/** The model's own code for an input (DEPTHGW, V1, SV 1.1), shown as a badge. A code in plain words
 * (Area, Slope) would only repeat the label, and an R name (hyd.att) shows in the popover instead. */
const badge = (f: Variable): string | null =>
  (f.code && f.code !== f.label && !/^[a-z]/.test(f.code) && !/^[A-Z][a-z]*( [A-Za-z]+)*$/.test(f.code) ? f.code : null)

/** The range an input takes, in words; a very large limit (an area's) is left open. */
function rangeWords(f: Variable): string {
  const max = f.max !== undefined && f.max < 1e5 ? f.max : undefined
  if (f.min !== undefined && max !== undefined) return `${f.min} to ${max}`
  if (f.min !== undefined) return `${f.min} or more`
  if (max !== undefined) return `${max} or less`
  return ''
}

/** Classes that are only numbers (0, 0.2, ... 1) score themselves and need no table. */
const numericClasses = (f: Variable) => (f.categories ?? []).every((c) => parseNumber(c.label) !== null)

export interface SiteForm { el: HTMLElement; setRaw(raw: Raw): void }

export function siteForm(spec: CalcSpec, initial: Raw, onChange: (raw: Raw) => void, actions: Omit<ResultActions, 'focusField'>): SiteForm {
  let raw: Raw = { ...initial }
  let ev: Evaluation = evaluateSite(spec, forEvaluation(spec, raw))
  let shown = ''
  const parts = new Map<string, FieldParts>()
  const groupScores = new Map<string, HTMLElement>()
  const inputs = h('div', { class: 'wa-inputs' })
  const resultsCol = h('aside', { class: 'wa-results', 'aria-label': 'Results' })
  const el = h('div', { class: 'wa-calc-body' }, h('div', { class: 'wa-form-col' }, inputs), resultsCol)
  let species: SpeciesTable | null = null
  let openPop: FieldParts | null = null

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
    if (p && !p.control.hasAttribute('readonly')) {
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
    toast(n < values.length ? `Filled ${n} fields. ${values.length - n} pasted values had no field left.` : `Filled ${n} fields.`)
  }

  function control(f: Variable, describedBy: string): HTMLInputElement | HTMLSelectElement {
    const id = domId(f.id)
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

  /** An input's popover: its help, range, curve (with the entered value marked), class scores and source. */
  function fillPop(p: FieldParts): void {
    const f = p.variable
    const range = f.categories ? '' : rangeWords(f)
    p.pop!.replaceChildren()
    append(p.pop!, [
      h('p', { class: 'wa-pop-title' }, f.label, f.unit && !f.categories ? ` (${f.unit})` : ''),
      f.code && /^[a-z]/.test(f.code) ? h('p', { class: 'wa-muted' }, 'Code: ', h('code', null, f.code)) : null,
      p.help ? h('p', null, p.help) : null,
      range ? h('p', { class: 'wa-muted' }, `Range: ${range}${f.integer ? ', whole numbers' : ''}.`) : null,
      f.curve ? h('figure', null, curveFigure(f, parseNumber(raw[f.id] ?? ''))) : null,
      f.categories && !p.setup && !numericClasses(f)
        ? h('table', null, h('tbody', null, f.categories.map((c) => h('tr', null, h('td', null, c.label), h('td', { class: 'num' }, `SI ${fmt(c.si, 2)}`)))))
        : null,
      f.source ? h('p', { class: 'wa-muted' }, `Source: ${f.source}`) : null])
  }

  function closePop(): void {
    if (!openPop) return
    openPop.pop!.hidden = true
    openPop.info!.setAttribute('aria-expanded', 'false')
    openPop = null
  }

  function togglePop(id: string): void {
    const p = parts.get(id)
    if (!p?.pop || !p.info) return
    const again = openPop === p
    closePop()
    if (again) return
    fillPop(p)
    p.pop.hidden = false
    p.pop.classList.remove('is-right')
    // a cell near the right edge opens its popover leftward, to keep it on the page
    if (p.pop.getBoundingClientRect().right > document.documentElement.clientWidth - 8) p.pop.classList.add('is-right')
    p.info.setAttribute('aria-expanded', 'true')
    openPop = p
  }

  // a click outside the open popover closes it, and so does Escape
  const onDocClick = (e: Event) => {
    if (!el.isConnected) {
      document.removeEventListener('click', onDocClick)
      return
    }
    if (openPop && !openPop.wrap.contains(e.target as Node)) closePop()
  }
  document.addEventListener('click', onDocClick)
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !openPop) return
    const info = openPop.info
    closePop()
    info?.focus()
  })

  function field(f: Variable, kind: FieldKind = 'input'): HTMLElement {
    const id = domId(f.id)
    const setup = kind === 'setup'
    const derived = !!spec.speciesTable && DERIVED.has(f.id)
    const helpText = derived ? `${f.help ?? ''} Filled from the species table, or enter it here.`.trim() : f.help ?? ''
    const help = helpText ? h('span', { class: 'visually-hidden', id: `${id}-help` }, helpText) : null
    const error = h('p', { class: 'wa-field-error', id: `${id}-err`, hidden: true })
    const ctl = control(f, help ? `${id}-help ${id}-err` : `${id}-err`)
    // a class that is itself a score (0, 0.2, ... 1) needs no SI beside it
    const si = !setup && (f.curve || (f.categories && !numericClasses(f))) ? h('span', { class: 'wa-si', 'aria-live': 'polite' }) : null
    const pop = helpText || f.curve || f.source || (f.categories && !setup && !numericClasses(f))
      ? h('div', { class: 'wa-pop', id: `${id}-pop`, hidden: true })
      : null
    const info = pop
      ? h('button', { class: 'wa-info', type: 'button', 'aria-label': `About ${f.label}`, 'aria-expanded': 'false', 'aria-controls': `${id}-pop`,
        onclick: () => togglePop(f.id) }, icon('info'))
      : null
    const code = badge(f)
    const box = f.categories ? ctl : h('div', { class: 'wa-input-wrap' }, ctl, f.unit ? h('span', { class: 'wa-unit', 'aria-hidden': 'true' }, f.unit) : null)
    const wrap = h('div', { class: kind === 'input' ? 'wa-field' : `wa-field is-${kind}`, 'data-id': f.id },
      h('div', { class: 'wa-field-top' }, h('label', { for: id }, code ? h('span', { class: 'wa-code' }, code) : null, f.label), info),
      // the suitability index the value gives sits beside the input
      si ? h('div', { class: 'wa-field-line' }, box, si) : box,
      error, help, pop)
    parts.set(f.id, { variable: f, wrap, control: ctl, error, si, help: helpText, info, pop, setup })
    return wrap
  }

  function group(g: FieldGroup): HTMLElement {
    const score = spec.outputs.some((o) => o.id === g.id) ? h('span', { class: 'wa-group-score' }) : null
    if (score) groupScores.set(g.id, score)
    const hid = `g-${g.id}`
    return h('section', { class: 'wa-group', 'aria-labelledby': hid, 'data-group': g.id },
      h('div', { class: 'wa-group-head' }, h('h2', { id: hid }, g.title), score),
      g.note ? h('p', { class: 'wa-group-note' }, g.note) : null,
      h('div', { class: 'wa-fields' }, g.fields.map((f) => field(f))))
  }

  const nameInput = h('input', { class: 'wa-input', id: 'f-site-name', type: 'text', placeholder: 'Optional', autocomplete: 'off', value: raw.name ?? '',
    oninput: () => set('name', nameInput.value) })
  const siteName = h('div', { class: 'wa-field' },
    h('div', { class: 'wa-field-top' }, h('label', { for: 'f-site-name' }, 'Site name')),
    nameInput)

  function render(focusId?: string): void {
    ev = evaluate()
    shown = visibleKey(ev)
    parts.clear()
    groupScores.clear()
    openPop = null
    species = null
    // the site's name, the setup choice and the site's area share the first row
    const top = ev.groups.filter((g) => g.setup || g.site)
    const rest = ev.groups.filter((g) => !g.setup && !g.site)
    const blocks: HTMLElement[] = [h('div', { class: 'wa-setup-row' }, siteName,
      top.flatMap((g) => g.fields.map((f) => field(f, g.setup ? 'setup' : 'site'))))]
    const choice = ev.groups.find((g) => g.setup)?.fields[0]
    if (choice && !rest.length && !ev.result) {
      blocks.push(h('p', { class: 'wa-hint' }, icon('about'), h('span', null, `${choice.categories ? 'Choose' : 'Enter'} the ${choice.label.toLowerCase()} to see its inputs.`)))
    } else if (spec.notice) {
      blocks.push(h('p', { class: 'wa-hint' }, icon('about'), h('span', null, spec.notice)))
    }
    // many small groups (Chatfield's ten variables) put each group's name beside its inputs
    inputs.className = rest.length >= 6 ? 'wa-inputs is-rows' : 'wa-inputs'
    for (const g of rest) {
      blocks.push(group(g))
      if (spec.speciesTable && g.id === 'vegetation') {
        species = speciesTable(raw, categoryOf(RESACA, 'habitat', raw) as ResacaHabitat | undefined, (id, value) => set(id, value))
        blocks.push(species.el)
      }
    }
    inputs.replaceChildren(...blocks)
    refresh(true)
    if (focusId) parts.get(focusId)?.control.focus()
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
      p.error.replaceChildren(...(err ? [icon('alert'), h('span', null, err)] : []))
      if (err) p.control.setAttribute('aria-invalid', 'true')
      else p.control.removeAttribute('aria-invalid')
      if (spec.speciesTable && DERIVED.has(id)) {
        // filled from the species table while it is in use; typed in otherwise
        const input = p.control as HTMLInputElement
        input.readOnly = hasSpecies(raw)
        if (input.readOnly) input.value = forEvaluation(spec, raw)[id] ?? ''
      }
      if (p.si) {
        const s = ev.si[id]
        p.si.replaceChildren(...(s === undefined ? [] : ['SI ', h('b', null, fmt(s, 3))]))
      }
      if (openPop === p) fillPop(p)
    }
    for (const [gid, score] of groupScores) {
      const v = ev.result?.values[gid]
      const o = spec.outputs.find((x) => x.id === gid)
      score.textContent = v === null || v === undefined ? '' : fmt(v, o?.digits ?? 3)
    }
    if (species) species.update(raw, categoryOf(RESACA, 'habitat', raw) as ResacaHabitat | undefined)
    resultsCol.replaceChildren(...resultsPanel(spec, ev, { ...actions, focusField }))
  }

  render()
  return {
    el,
    setRaw(next: Raw) {
      raw = { ...next }
      nameInput.value = raw.name ?? ''
      render()
    },
  }
}
