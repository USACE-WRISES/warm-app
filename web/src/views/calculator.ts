// A calculator's page: the model's name and purpose with the page's actions on one row, its method and
// source on request, and its inputs for one site (a form beside the results) or many (a grid). The
// inputs are kept in this browser between visits, and can be saved to a file and opened again.
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

/** A source's link text: the USACE model library, or a plain link. */
const linkText = (url: string) => (url.includes('ecolibrary') ? 'USACE model library' : 'Link')

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
      toast(ok ? 'Copied. Paste it into a spreadsheet.' : 'Could not copy. Use CSV instead.', { error: !ok })
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

  const actions = h('div', { class: 'wa-calc-actions no-print' },
    seg,
    spec.example
      ? h('button', { class: 'wa-btn wa-btn-sm', type: 'button', title: `Load the worked example. ${spec.example.note}`, onclick: () => {
        state.site = { name: 'Worked example', ...spec.example!.raw }
        state.mode = 'one'
        persist()
        renderBody()
        toast(spec.example!.note, { seconds: 6 })
      } }, icon('book'), 'Example')
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
        toast('This file is for another calculator. Open it on that calculator\'s page.', { error: true, seconds: 6 })
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
    h('button', { class: 'wa-btn wa-btn-sm wa-btn-danger', type: 'button', title: 'Clear every input', onclick: () => {
      if (!confirm(`Clear every input of the ${spec.name} calculator?`)) return
      state = { ...fresh(), mode: state.mode }
      remove(`calc-${spec.id}`)
      persist()
      renderBody()
    } }, icon('reset'), 'Clear'))

  const methodId = `method-${spec.id}`
  const method = h('div', { class: 'wa-method', id: methodId, hidden: true },
    h('p', { class: 'wa-method-title' }, spec.title),
    h('ul', { class: 'wa-eq' }, spec.method.map((m) => h('li', null, m))),
    h('p', null, 'Source: ', spec.citations.map((c, i) => [i ? ' ' : '', c.text, ' ',
      c.url ? h('a', { href: c.url, target: '_blank', rel: 'noopener' }, linkText(c.url)) : null])),
    h('p', null, h('a', { href: href({ name: 'guide', section: 'changes' }) }, 'Changes from the Shiny app')))
  const methodButton = h('button', { class: 'wa-link-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': methodId, onclick: () => {
    const open = method.hidden
    method.hidden = !open
    methodButton.setAttribute('aria-expanded', String(open))
  } }, icon('chevron'), 'Method and source')

  renderBody()

  return h('div', { class: 'wa-calc' },
    h('div', { class: 'wa-calc-head' },
      h('h1', null, spec.name),
      actions,
      h('p', { class: 'wa-calc-purpose' }, spec.purpose, methodButton)),
    method,
    body)
}
