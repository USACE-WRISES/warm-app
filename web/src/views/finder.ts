// Find a model: the Shiny app's Criteria and Keyword tabs on one page. The filters rank the 14 models
// (the Shiny app's scores and order); the keyword narrows them to the models that mention it. Each model is a
// two-line row; Details opens its description, scope, structure and the processes it measures.
import { calculatorForModel } from '../calculators'
import { SOURCES } from '../calculators/sources'
import { toCsv } from '../engine/csv'
import { MODEL_COLUMNS } from '../engine/data'
import { type Criteria, findModels, hasCriteria, INSTREAM_PROCESSES, METRIC_COLUMNS, MODEL_TYPES, NO_CRITERIA, type Ranked,
  REGIONS, RIPARIAN_PROCESSES } from '../engine/finder'
import { type Child, h } from '../lib/dom'
import { downloadText } from '../lib/download'
import { plural, today } from '../lib/format'
import { icon } from '../lib/icons'
import { href } from '../lib/router'
import { load, save } from '../lib/storage'

interface FinderState { criteria: Criteria; keyword: string; view: 'cards' | 'table' }

/** Text with every match of the keyword marked. */
function marked(text: string, keyword: string): Child[] {
  const k = keyword.trim()
  if (!k) return [text]
  const out: Child[] = []
  const lower = text.toLowerCase()
  const kl = k.toLowerCase()
  let i = 0
  for (let j = lower.indexOf(kl); j >= 0; j = lower.indexOf(kl, i)) {
    if (j > i) out.push(text.slice(i, j))
    out.push(h('mark', null, text.slice(j, j + k.length)))
    i = j + k.length
  }
  out.push(text.slice(i))
  return out
}

const processLabel = (p: string) => p.replace('/', ' / ')

export function finderPage(): HTMLElement {
  const state: FinderState = { criteria: NO_CRITERIA, keyword: '', view: 'cards', ...load<Partial<FinderState>>('finder', {}) }
  const persist = () => save('finder', state)

  const results = h('div', { 'aria-live': 'polite' })
  const summary = h('p', { class: 'wa-muted wa-small', style: { margin: '0' } })

  const select = (label: string, options: readonly string[], key: 'region' | 'type') => {
    const el = h('select', { class: 'wa-select', id: `f-${key}`, value: state.criteria[key], onchange: () => {
      state.criteria = { ...state.criteria, [key]: el.value }
      update()
    } }, h('option', { value: '' }, 'Any'), options.map((o) => h('option', { value: o }, o)))
    return h('fieldset', null, h('legend', null, h('label', { for: `f-${key}` }, label)), el)
  }
  const checks = (legend: string, options: readonly string[], key: 'instream' | 'riparian') =>
    h('fieldset', null, h('legend', null, legend), options.map((o) => h('label', { class: 'wa-check' },
      h('input', { type: 'checkbox', value: o, checked: state.criteria[key].includes(o), onchange: (e: Event) => {
        const on = (e.target as HTMLInputElement).checked
        const set = new Set(state.criteria[key])
        if (on) set.add(o)
        else set.delete(o)
        state.criteria = { ...state.criteria, [key]: options.filter((x) => set.has(x)) }
        update()
      } }), processLabel(o))))

  const filters = h('aside', { class: 'wa-filters', 'aria-label': 'Criteria' })
  const renderFilters = () => {
    filters.replaceChildren(
      h('h2', null, h('span', null, 'Your project'), hasCriteria(state.criteria)
        ? h('button', { class: 'wa-link-btn', type: 'button', onclick: () => {
          state.criteria = NO_CRITERIA
          renderFilters()
          update()
        } }, 'Clear')
        : null),
      select('Region', REGIONS, 'region'),
      select('Model type', MODEL_TYPES, 'type'),
      checks('Instream processes', INSTREAM_PROCESSES, 'instream'),
      checks('Riparian zone processes', RIPARIAN_PROCESSES, 'riparian'),
      h('p', { class: 'wa-note', style: { margin: '0' } }, 'One point per criterion met; more for processes measured with several metrics.'))
  }

  const search = h('input', { class: 'wa-input', type: 'search', placeholder: 'Search by keyword, for example Missouri, wetland or urban', 'aria-label': 'Keyword',
    value: state.keyword, oninput: () => {
      state.keyword = search.value
      update()
    } })

  const viewSeg = h('div', { class: 'wa-seg', role: 'group', 'aria-label': 'View' })
  const renderSeg = () => viewSeg.replaceChildren(
    ...(['cards', 'table'] as const).map((v) => h('button', { type: 'button', 'aria-pressed': String(state.view === v), onclick: () => {
      state.view = v
      renderSeg()
      update()
    } }, v === 'cards' ? 'List' : 'Table')))

  const row = (r: Ranked, rank: number): HTMLElement => {
    const m = r.model
    const k = state.keyword.trim().toLowerCase()
    const calc = calculatorForModel(m.id)
    const matched = new Set(r.score.matched)
    const moreId = `model-${m.id}`
    // a keyword found only in the details opens them, so its marks show
    const open = !!k && [m.description, m.scope, m.structure].some((t) => t.toLowerCase().includes(k))
    const fact = (term: string, value: string) => h('div', null, h('dt', null, term), h('dd', null, ...marked(value, state.keyword)))
    const more = h('div', { class: 'wa-model-more', id: moreId, hidden: !open },
      h('p', null, ...marked(m.description, state.keyword)),
      h('dl', { class: 'wa-model-facts' }, fact('Geographic scope', m.scope), fact('Numerical structure', m.structure)),
      h('div', { class: 'wa-chips', 'aria-label': 'Processes the model measures' },
        Object.entries(m.metrics).map(([p, n]) => h('span', { class: `wa-chip${matched.has(p) ? ' is-match' : ''}`, title: plural(n, 'metric') },
          processLabel(p), ` ${n}`))))
    const details = h('button', { class: 'wa-link-btn', type: 'button', 'aria-expanded': String(open), 'aria-controls': moreId, onclick: () => {
      const show = more.hidden
      more.hidden = !show
      details.setAttribute('aria-expanded', String(show))
    } }, icon('chevron'), 'Details')
    const meta = (value: string, hit: boolean) => (hit ? h('strong', { class: 'is-hit' }, value) : marked(value, state.keyword))
    return h('article', { class: 'wa-model' },
      h('div', { class: 'wa-model-main' },
        h('span', { class: 'wa-model-rank', 'aria-label': `Rank ${rank}` }, String(rank)),
        h('div', { class: 'wa-model-text' },
          h('h3', null, ...marked(m.name, state.keyword)),
          h('p', { class: 'wa-model-meta' }, meta(m.region, matched.has('region')), ' · ', meta(m.type.replace(/\//g, ', '), matched.has('type')), ' · ',
            ...marked(m.review, state.keyword))),
        h('div', { class: 'wa-model-side' },
          hasCriteria(state.criteria) ? h('span', { class: `wa-chip ${r.score.value > 0 ? 'is-accent' : 'is-muted'}`, title: 'Criteria score' }, `Score ${r.score.value}`) : null,
          r.hits ? h('span', { class: 'wa-chip', title: 'Fields that mention the keyword' }, plural(r.hits, 'match', 'matches')) : null,
          details,
          calc
            ? h('a', { class: 'wa-btn wa-btn-primary wa-btn-sm', href: href({ name: 'calc', id: calc.id }) }, 'Open calculator', icon('arrow'))
            : h('a', { class: 'wa-btn wa-btn-sm', href: SOURCES.review.url, target: '_blank', rel: 'noopener', title: 'No calculator in WARM. The review of riparian models describes it.' },
              'Read the review', icon('external')))),
      more)
  }

  const table = (rows: Ranked[]): HTMLElement => {
    const cols = MODEL_COLUMNS.filter((c) => c !== 'ID')
    return h('div', { class: 'wa-table-wrap is-tall' }, h('table', { class: 'wa-table' },
      h('thead', null, h('tr', null, h('th', null, '#'), hasCriteria(state.criteria) ? h('th', { class: 'num' }, 'Score') : null,
        cols.map((c) => h('th', null, c)))),
      h('tbody', null, rows.map((r, i) => h('tr', null, h('td', { class: 'num' }, String(i + 1)),
        hasCriteria(state.criteria) ? h('td', { class: 'num' }, String(r.score.value)) : null,
        cols.map((c) => h('td', { class: (METRIC_COLUMNS as readonly string[]).includes(c) ? 'num' : undefined, style: c === 'General Description' ? { minWidth: '360px' } : undefined },
          ...marked(r.model.fields[c] ?? '', state.keyword))))))))
  }

  const download = () => {
    const rows = findModels(state.criteria, state.keyword)
    const cols = MODEL_COLUMNS.filter((c) => c !== 'ID')
    downloadText(`warm-models-${today()}.csv`, 'text/csv;charset=utf-8',
      toCsv([['Rank', 'Score', ...cols], ...rows.map((r, i) => [i + 1, r.score.value, ...cols.map((c) => r.model.fields[c] ?? '')])]))
  }

  function update(): void {
    persist()
    const rows = findModels(state.criteria, state.keyword)
    const k = state.keyword.trim()
    const found = k ? `${plural(rows.length, 'model')} ${rows.length === 1 ? 'mentions' : 'mention'} "${k}"` : plural(rows.length, 'model')
    summary.textContent = `${found}${hasCriteria(state.criteria) ? ', ranked by your criteria' : ''}`
    if (!rows.length) {
      results.replaceChildren(h('div', { class: 'wa-card wa-empty' }, h('h2', null, 'No model mentions that keyword'), h('p', null, 'Try a shorter or more general word.')))
      return
    }
    results.replaceChildren(state.view === 'table' ? table(rows) : h('div', { class: 'wa-models' }, rows.map((r, i) => row(r, i + 1))))
  }

  renderFilters()
  renderSeg()
  update()

  return h('div', null,
    h('div', { class: 'wa-page-head' },
      h('h1', null, 'Find a model'),
      h('p', { class: 'wa-sub' }, 'Rank the 14 reviewed models against your project, or search by keyword.')),
    h('div', { class: 'wa-finder' },
      filters,
      h('section', { 'aria-label': 'Models' },
        h('div', { class: 'wa-search' }, icon('search'), search),
        h('div', { class: 'wa-results-bar' }, summary,
          h('div', { class: 'wa-toolbar-group' }, viewSeg,
            h('button', { class: 'wa-btn wa-btn-sm', type: 'button', onclick: download }, icon('download'), 'CSV'))),
        results)))
}
