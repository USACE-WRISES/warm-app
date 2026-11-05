// Many sites: one row per site in an editable grid built from the calculator's inputs. A block copied
// from a spreadsheet pastes into it cell for cell (adding rows as needed), a CSV imports into it, and
// every row is checked and computed as it is typed: cells a row does not use are hatched, invalid
// cells are flagged, and the results fill the columns on the right.
import { type CalcSpec, evaluateSite, type Raw } from '../calculators/types'
import type { Variable } from '../engine/variables'
import { h } from '../lib/dom'
import { downloadText, pickFile, copyText } from '../lib/download'
import { fmt, plural, slug, today } from '../lib/format'
import { icon } from '../lib/icons'
import { toast } from '../lib/toast'
import { forEvaluation, heading, importSites, sitesCsv, sitesTsv } from './exportSites'

export interface GridState { sites: Raw[]; setup?: string }

const MAX_ROWS = 2000

/** The grid's input columns: the inputs for the grid's setup choice, or every input of the calculator. */
export function gridColumns(spec: CalcSpec, setup: string | undefined): Variable[] {
  if (spec.gridSetup) {
    if (!setup) return []
    return spec.groups({ [spec.gridSetup]: setup }).flatMap((g) => g.fields).filter((f) => f.id !== spec.gridSetup)
  }
  return [...spec.variables]
}

/** A row as the calculator sees it: with the grid's setup choice. */
const rowRaw = (spec: CalcSpec, r: Raw, setup: string | undefined): Raw => (spec.gridSetup && setup ? { ...r, [spec.gridSetup]: setup } : r)

export function sitesGrid(spec: CalcSpec, state: GridState, onChange: (s: GridState) => void): HTMLElement {
  let sites = state.sites.length ? state.sites.map((r) => ({ ...r })) : [{}]
  let setup = state.setup
  const root = h('div')
  const wrap = h('div', { class: 'wa-grid-wrap' })
  const outputs = spec.outputs

  const save = () => onChange({ sites, setup })

  function cellInput(v: Variable | null, r: number, value: string): HTMLInputElement {
    const attrs: Record<string, unknown> = { value, 'data-r': r, 'data-c': v ? v.id : 'name', autocomplete: 'off', spellcheck: 'false',
      'aria-label': `${v ? v.label : 'Site name'}, site ${r + 1}` }
    if (!v || v.categories) attrs.class = 'text'
    else attrs.inputmode = 'decimal'
    if (v?.categories) attrs.list = `dl-${spec.id}-${v.id.replace(/[^a-zA-Z0-9]/g, '-')}`
    return h('input', attrs)
  }

  function render(): void {
    const cols = gridColumns(spec, setup)
    if (spec.gridSetup && !setup) {
      wrap.replaceChildren(h('div', { class: 'wa-empty' }, h('p', null, `Choose the ${setupVar()!.label.toLowerCase()} above to start the grid.`)))
      return
    }
    const lists = cols.filter((v) => v.categories).map((v) => h('datalist', { id: `dl-${spec.id}-${v.id.replace(/[^a-zA-Z0-9]/g, '-')}` },
      v.categories!.map((c) => h('option', { value: c.label }))))
    const head1 = h('tr', null, h('th', { rowspan: '2' }, '#'), h('th', { rowspan: '2' }, 'Site'),
      h('th', { colspan: String(cols.length) }, 'Inputs'), h('th', { colspan: String(outputs.length), class: 'out' }, 'Results'), h('th', { rowspan: '2' }, ''))
    const head2 = h('tr', null,
      cols.map((v) => h('th', { title: heading(v), scope: 'col' }, v.code ?? v.label, h('small', null, v.categories ? 'choose' : v.unit ?? ''))),
      outputs.map((o) => h('th', { class: 'out', title: o.label, scope: 'col' }, short(o.label))))
    const body = h('tbody', null, sites.map((site, r) => h('tr', { 'data-r': r },
      h('td', { class: 'lbl' }, String(r + 1)),
      h('td', null, cellInput(null, r, site.name ?? '')),
      cols.map((v) => h('td', { 'data-c': v.id }, cellInput(v, r, site[v.id] ?? ''))),
      outputs.map((o) => h('td', { class: 'out', 'data-o': o.id })),
      h('td', { class: 'act' }, h('button', { class: 'wa-btn wa-btn-ghost wa-btn-icon wa-btn-danger', type: 'button', title: `Remove site ${r + 1}`,
        'aria-label': `Remove site ${r + 1}`, onclick: () => removeRow(r) }, icon('trash'))))))
    wrap.replaceChildren(...lists, h('table', { class: 'wa-grid' }, h('thead', null, head1, head2), body))
    for (let r = 0; r < sites.length; r++) refreshRow(r)
  }

  /** A row's checks and results, in place (the focused cell keeps its focus). */
  function refreshRow(r: number): void {
    const tr = wrap.querySelector<HTMLTableRowElement>(`tr[data-r="${r}"]`)
    if (!tr) return
    const raw = rowRaw(spec, sites[r], setup)
    const ev = evaluateSite(spec, forEvaluation(spec, raw))
    const used = new Set(ev.fields.map((f) => f.id))
    const settled = ev.groups.length > 1 || !ev.groups.some((g) => g.setup)
    const blank = Object.entries(sites[r]).every(([k, v]) => k === 'name' || !v.trim())
    for (const td of tr.querySelectorAll<HTMLTableCellElement>('td[data-c]')) {
      const id = td.getAttribute('data-c')!
      const notUsed = settled && !used.has(id)
      td.classList.toggle('is-na', notUsed)
      td.title = notUsed ? 'Not used for this site' : ev.errors[id] ?? ''
      const invalid = !blank && !!ev.errors[id]
      td.classList.toggle('is-invalid', invalid)
      const input = td.querySelector('input')
      if (input) {
        input.tabIndex = notUsed ? -1 : 0
        if (invalid) input.setAttribute('aria-invalid', 'true')
        else input.removeAttribute('aria-invalid')
      }
    }
    for (const td of tr.querySelectorAll<HTMLTableCellElement>('td[data-o]')) {
      const o = outputs.find((x) => x.id === td.getAttribute('data-o'))!
      const v = ev.result?.values[o.id]
      td.textContent = ev.result ? fmt(v, o.digits ?? 3) : blank ? '' : 'n/a'
      td.classList.toggle('is-na-out', !ev.result || v === null)
      td.title = ev.result ? '' : blank ? '' : `${plural(ev.missing.length, 'input')} to fill${Object.keys(ev.errors).length ? `, ${plural(Object.keys(ev.errors).length, 'input')} to fix` : ''}`
    }
  }

  function removeRow(r: number): void {
    sites.splice(r, 1)
    if (!sites.length) sites.push({})
    save()
    render()
  }

  /** Writes a block of pasted cells from (r, c), adding rows as needed. */
  function pasteBlock(r0: number, colIndex: number, block: string[][]): void {
    const keys = ['name', ...gridColumns(spec, setup).map((v) => v.id)]
    let cells = 0
    block.forEach((row, i) => {
      const r = r0 + i
      if (r >= MAX_ROWS) return
      while (sites.length <= r) sites.push({})
      row.forEach((value, j) => {
        const key = keys[colIndex + j]
        if (!key) return
        sites[r] = { ...sites[r], [key]: value.trim() }
        cells++
      })
    })
    save()
    render()
    toast(`Pasted ${plural(cells, 'cell')} into ${plural(block.length, 'row')}.`)
  }

  wrap.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement
    const r = Number(t.getAttribute('data-r'))
    const c = t.getAttribute('data-c')
    if (Number.isNaN(r) || !c) return
    sites[r] = { ...sites[r], [c]: t.value }
    save()
    refreshRow(r)
  })
  wrap.addEventListener('paste', (e) => {
    const t = e.target as HTMLInputElement
    const r = Number(t.getAttribute('data-r'))
    const c = t.getAttribute('data-c')
    if (Number.isNaN(r) || !c) return
    const text = (e as ClipboardEvent).clipboardData?.getData('text') ?? ''
    if (!/[\t\n]/.test(text.replace(/\r?\n$/, ''))) return
    e.preventDefault()
    const block = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((line) => line.split('\t'))
    const keys = ['name', ...gridColumns(spec, setup).map((v) => v.id)]
    pasteBlock(r, keys.indexOf(c), block)
  })
  wrap.addEventListener('keydown', (e) => {
    const t = e.target as HTMLInputElement
    if (t.tagName !== 'INPUT') return
    const r = Number(t.getAttribute('data-r'))
    const c = t.getAttribute('data-c')
    const step = e.key === 'ArrowDown' || e.key === 'Enter' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!step || Number.isNaN(r) || !c) return
    e.preventDefault()
    let next = r + step
    if (next >= sites.length && e.key === 'Enter') {
      sites.push({})
      save()
      render()
    }
    next = Math.max(0, Math.min(sites.length - 1, next))
    wrap.querySelector<HTMLInputElement>(`input[data-r="${next}"][data-c="${CSS.escape(c)}"]`)?.focus()
  })

  const setupVar = () => (spec.gridSetup ? spec.variables.find((v) => v.id === spec.gridSetup) : undefined)
  const sv = setupVar()
  const setupSelect = sv
    ? h('select', { class: 'wa-select', id: `grid-setup-${spec.id}`, value: setup ?? '', onchange: () => {
      setup = setupSelect!.value || undefined
      save()
      render()
    } }, h('option', { value: '' }, 'Choose...'), sv.categories!.map((c) => h('option', { value: c.value }, c.label)))
    : null

  const name = () => `${slug(spec.name)}-sites-${today()}.csv`
  const tools = h('div', { class: 'wa-grid-tools' },
    h('div', { class: 'wa-toolbar-group' },
      h('button', { class: 'wa-btn wa-btn-sm', type: 'button', onclick: () => {
        sites.push({})
        save()
        render()
        wrap.querySelector<HTMLInputElement>(`input[data-r="${sites.length - 1}"][data-c="name"]`)?.focus()
      } }, icon('plus'), 'Add a site'),
      h('button', { class: 'wa-btn wa-btn-sm', type: 'button', onclick: async () => {
        const f = await pickFile('.csv,text/csv')
        if (!f) return
        const got = importSites(f.text, gridColumns(spec, setup))
        if (!got.sites.length) {
          toast('No sites found: the CSV needs a header row whose columns match the grid\'s.', { error: true, seconds: 6 })
          return
        }
        sites = got.sites.slice(0, MAX_ROWS)
        save()
        render()
        toast(`Imported ${plural(sites.length, 'site')} from ${got.used.length} columns${got.ignored.length ? `; ignored ${got.ignored.join(', ')}` : ''}.`, { seconds: 6 })
      } }, icon('upload'), 'Import CSV')),
    h('div', { class: 'wa-toolbar-group' },
      h('span', { class: 'wa-note' }, 'Paste a block from a spreadsheet into any cell.'),
      h('button', { class: 'wa-btn wa-btn-sm', type: 'button', onclick: async () => {
        const ok = await copyText(sitesTsv(spec, sites.map((s) => rowRaw(spec, s, setup)), gridColumns(spec, setup)))
        toast(ok ? 'Copied the table: paste it into a spreadsheet.' : 'Could not copy; use Download CSV instead.', { error: !ok })
      } }, icon('copy'), 'Copy table'),
      h('button', { class: 'wa-btn wa-btn-sm', type: 'button', onclick: () => {
        downloadText(name(), 'text/csv;charset=utf-8', sitesCsv(spec, sites.map((s) => rowRaw(spec, s, setup)), gridColumns(spec, setup)))
      } }, icon('download'), 'Download CSV'),
      h('button', { class: 'wa-btn wa-btn-sm wa-btn-danger', type: 'button', onclick: () => {
        if (!confirm(`Clear all ${plural(sites.length, 'site')} from the grid?`)) return
        sites = [{}]
        save()
        render()
      } }, icon('trash'), 'Clear')))

  if (sv) root.append(h('div', { class: 'wa-grid-setup' }, h('label', { for: `grid-setup-${spec.id}` }, `${sv.label} for every site`), setupSelect))
  root.append(tools, wrap)
  render()
  return root
}

/** A result's heading, short enough for a column. */
function short(label: string): string {
  const m = /\(([^)]+)\)\s*$/.exec(label)
  return m ? m[1] : label
}
