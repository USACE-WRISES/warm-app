// A calculator's page: what the model is and where it comes from, how it is calculated, and its inputs,
// for one site (a guided form beside the results) or many (a grid). The inputs are kept in this
// browser between visits, and can be saved to a file and opened again.
import { withoutSpeciesTable } from '../calculators/resaca'
import type { CalcSpec, Raw } from '../calculators/types'
import { h } from '../lib/dom'
import { copyText, downloadText, pickFile } from '../lib/download'
import { slug, today } from '../lib/format'
import { icon } from '../lib/icons'
import { href } from '../lib/router'
import { load, remove, save } from '../lib/storage'
import { toast } from '../lib/toast'
import { readSaved, savedFile, sitesCsv, sitesTsv } from './exportSites'
import { siteForm } from './form'
import { sitesGrid } from './grid'

interface CalcState { v: 1; mode: 'one' | 'many'; site: Raw; sites: Raw[]; setup?: string }

const fresh = (): CalcState => ({ v: 1, mode: 'one', site: {}, sites: [{}] })

function loadState(id: string): CalcState {
  const s = load<Partial<CalcState>>(`calc-${id}`, {})
  if (s.v !== 1) return fresh()
  return { ...fresh(), ...s, site: s.site ?? {}, sites: s.sites?.length ? s.sites : [{}] }
}

export function calculatorPage(spec: CalcSpec): HTMLElement {
  let state = loadState(spec.id)
  const persist = () => save(`calc-${spec.id}`, state)
  const body = h('div')

  // a site for the grid, and back: the grid's setup choice moves with it
  const toGrid = (r: Raw): Raw => (spec.speciesTable ? withoutSpeciesTable(r) : { ...r })
  const fromGrid = (r: Raw): Raw => (spec.gridSetup && state.setup ? { ...r, [spec.gridSetup]: state.setup } : { ...r })

  const oneSite = () => siteForm(spec, state.site, (raw) => {
    state.site = raw
    persist()
  }, {
    copy: async () => {
      const ok = await copyText(sitesTsv(spec, [state.site], spec.groups(state.site).flatMap((g) => g.fields)))
      toast(ok ? 'Copied: paste it into a spreadsheet.' : 'Could not copy; use Download CSV instead.', { error: !ok })
    },
    csv: () => downloadText(`${slug(state.site.name || spec.name)}-${today()}.csv`, 'text/csv;charset=utf-8',
      sitesCsv(spec, [state.site], spec.groups(state.site).flatMap((g) => g.fields))),
    print: () => window.print(),
  })

  function renderBody(): void {
    if (state.mode === 'one') {
      body.replaceChildren(oneSite().el)
    } else {
      body.replaceChildren(sitesGrid(spec, { sites: state.sites, setup: state.setup }, (g) => {
        state.sites = g.sites
        state.setup = g.setup
        persist()
      }))
    }
    renderSeg()
  }

  const seg = h('div', { class: 'wa-seg', role: 'group', 'aria-label': 'Sites' })
  function renderSeg(): void {
    seg.replaceChildren(
      h('button', { type: 'button', 'aria-pressed': String(state.mode === 'one'), onclick: () => setMode('one') }, icon('site'), 'One site'),
      h('button', { type: 'button', 'aria-pressed': String(state.mode === 'many'), onclick: () => setMode('many') }, icon('sites'), 'Many sites'))
  }

  function setMode(mode: 'one' | 'many'): void {
    if (mode === state.mode) return
    if (mode === 'many') {
      // the site in the form becomes the grid's first row, unless the grid already has sites
      const filled = state.sites.filter((s) => Object.values(s).some((v) => v.trim()))
      if (!filled.length && Object.values(state.site).some((v) => v.trim())) {
        state.sites = [toGrid(state.site)]
        if (spec.gridSetup && state.site[spec.gridSetup]) state.setup = state.site[spec.gridSetup]
      }
    } else if (!Object.values(state.site).some((v) => v.trim()) && state.sites.length) {
      state.site = fromGrid(state.sites[0])
    }
    state.mode = mode
    persist()
    renderBody()
  }

  const allSites = (): Raw[] => (state.mode === 'one' ? [state.site] : state.sites.map(fromGrid))

  const toolbar = h('div', { class: 'wa-toolbar no-print' },
    h('div', { class: 'wa-toolbar-group' }, seg),
    h('div', { class: 'wa-toolbar-group' },
      spec.example
        ? h('button', { class: 'wa-btn wa-btn-sm', type: 'button', title: spec.example.note, onclick: () => {
          state.site = { name: 'Worked example', ...spec.example!.raw }
          state.mode = 'one'
          persist()
          renderBody()
          toast(spec.example!.note, { seconds: 6 })
        } }, icon('book'), 'Load the worked example')
        : null,
      h('button', { class: 'wa-btn wa-btn-sm', type: 'button', title: 'Open inputs saved from WARM', onclick: async () => {
        const f = await pickFile('.json,application/json')
        if (!f) return
        const got = readSaved(f.text)
        if (typeof got === 'string') {
          toast(got, { error: true, seconds: 6 })
          return
        }
        if (got.calculator !== spec.id) {
          toast(`This file is for another calculator. Open it from that calculator's page.`, { error: true, seconds: 6 })
          return
        }
        if (got.sites.length === 1) {
          state.site = got.sites[0]
          state.mode = 'one'
        } else {
          state.sites = got.sites.map(toGrid)
          state.setup = got.setup
          state.mode = 'many'
        }
        persist()
        renderBody()
        toast(`Opened ${f.name}.`)
      } }, icon('upload'), 'Open'),
      h('button', { class: 'wa-btn wa-btn-sm', type: 'button', title: 'Save these inputs to a file you can open again', onclick: () => {
        const sites = allSites()
        const name = state.mode === 'one' && state.site.name ? slug(state.site.name) : slug(spec.name)
        downloadText(`${name}-warm-inputs-${today()}.json`, 'application/json', savedFile(spec, sites, state.mode === 'many' ? state.setup : undefined))
      } }, icon('download'), 'Save'),
      h('button', { class: 'wa-btn wa-btn-sm wa-btn-danger', type: 'button', onclick: () => {
        if (!confirm(`Clear every input of the ${spec.name} calculator?`)) return
        state = { ...fresh(), mode: state.mode }
        remove(`calc-${spec.id}`)
        persist()
        renderBody()
      } }, icon('reset'), 'Clear')))

  const method = h('details', { class: 'wa-details' },
    h('summary', null, icon('chevron'), "How it's calculated"),
    h('div', { class: 'wa-details-body' },
      h('ul', { class: 'wa-eq' }, spec.method.map((m) => h('li', null, m))),
      h('p', { class: 'wa-note', style: { margin: '10px 0 0' } }, 'Each change from the earlier WARM is listed in ', h('a', { href: href({ name: 'guide', section: 'changes' }) }, 'Changes from WARM 1.x'), '.')))

  renderBody()

  return h('div', { class: 'wa-calc' },
    h('p', { class: 'wa-crumbs' }, h('a', { href: href({ name: 'home' }) }, 'Home'), ' / Calculators / ', spec.name),
    h('div', { class: 'wa-calc-head' },
      h('div', null,
        h('h1', null, spec.name),
        h('p', { class: 'wa-lead' }, spec.purpose),
        h('div', { class: 'wa-calc-meta' },
          h('span', { class: 'wa-chip is-accent' }, spec.returns),
          h('span', { class: 'wa-chip' }, spec.inputStyle),
          h('span', { class: 'wa-chip' }, spec.region)))),
    h('div', { class: 'wa-calc-info' },
      spec.notice ? h('div', { class: 'wa-callout' }, icon('info'), h('span', null, spec.notice)) : null,
      method),
    h('div', { class: 'wa-calc-source' },
      h('strong', null, spec.title), '. ',
      spec.citations.map((c, i) => [i ? ' ' : '', c.text, ' ', c.url ? h('a', { href: c.url, target: '_blank', rel: 'noopener' }, c.url.includes('ecolibrary') ? 'USACE model library' : 'Link') : null])),
    toolbar,
    body)
}
