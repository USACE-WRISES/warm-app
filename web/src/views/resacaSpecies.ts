// Resaca's species table (the one-site form): the plant species present at the site, each with its
// percent composition and, for the species on the habitat's reference list, its species suitability
// index (SSI). Its totals fill the model's two species inputs.
import { RESACA_SPECIES } from '../engine/data'
import { RESACA_HABITATS, type ResacaHabitat } from '../engine/models/resaca'
import { speciesKey, speciesRows, speciesTotals } from '../calculators/resaca'
import type { Raw } from '../calculators/types'
import { parseNumber } from '../calculators/types'
import { h } from '../lib/dom'
import { fmt, plural } from '../lib/format'
import { icon } from '../lib/icons'

export interface SpeciesTable { el: HTMLElement; update(raw: Raw, habitat: ResacaHabitat | undefined): void }

export function speciesTable(initial: Raw, initialHabitat: ResacaHabitat | undefined, set: (id: string, value: string) => void): SpeciesTable {
  let raw = initial
  let habitat = initialHabitat
  let all = false
  let query = ''
  const body = h('tbody')
  const sum = h('div', { class: 'wa-species-sum' })
  const search = h('input', { class: 'wa-input', type: 'search', placeholder: 'Find a species', 'aria-label': 'Find a species', oninput: () => {
    query = search.value.trim().toLowerCase()
    renderRows()
  } })
  const allToggle = h('label', { class: 'wa-check' }, h('input', { type: 'checkbox', onchange: (e: Event) => {
    all = (e.target as HTMLInputElement).checked
    renderRows()
  } }), 'Show all 64 species')

  const inputs = new Map<string, HTMLInputElement>()

  function rowFor(r: ReturnType<typeof speciesRows>[number]): HTMLElement {
    const compId = speciesKey(r.index, 'comp')
    const ssiId = speciesKey(r.index, 'ssi')
    const comp = parseNumber(raw[compId] ?? '')
    const present = comp !== null && comp > 0
    const compInput = h('input', { class: 'wa-input num', inputmode: 'decimal', 'aria-label': `${r.species.common}: percent composition`, value: raw[compId] ?? '',
      oninput: () => set(compId, compInput.value) })
    const ssiInput = h('input', { class: 'wa-input num', inputmode: 'decimal', 'aria-label': `${r.species.common}: species suitability index`, value: raw[ssiId] ?? '',
      disabled: !r.range || !present, placeholder: r.range && present ? 'needed' : '', oninput: () => set(ssiId, ssiInput.value) })
    inputs.set(compId, compInput)
    inputs.set(ssiId, ssiInput)
    let hint = ''
    if (r.range && present && comp !== null) hint = comp >= r.range[0] && comp <= r.range[1] ? 'In range: SSI 1.0' : 'Out of range'
    return h('tr', null,
      h('td', null, h('div', null, r.species.common), h('div', { class: 'wa-sci' }, r.species.scientific)),
      h('td', { class: r.range ? 'num' : 'is-off' }, r.range ? `${r.range[0]} to ${r.range[1]}%` : 'Not on the list'),
      h('td', { style: { width: '120px' } }, compInput),
      h('td', { style: { width: '120px' } }, ssiInput),
      h('td', { class: 'wa-small wa-muted' }, hint))
  }

  function renderRows(): void {
    inputs.clear()
    const rows = speciesRows(habitat).filter((r) => {
      const entered = (raw[speciesKey(r.index, 'comp')] ?? '').trim() !== ''
      const shown = all || r.range || entered || !habitat
      const matches = !query || r.species.common.toLowerCase().includes(query) || r.species.scientific.toLowerCase().includes(query)
      return shown && matches
    })
    body.replaceChildren(...(rows.length ? rows.map(rowFor) : [h('tr', null, h('td', { colspan: '5', class: 'wa-muted' }, 'No species match.'))]))
  }

  function renderSum(): void {
    const t = speciesTotals(raw, habitat)
    const n = habitat ? RESACA_HABITATS.find((x) => x.value === habitat)!.reference : null
    sum.replaceChildren(...[
      h('span', { class: 'wa-chip is-accent' }, plural(t.present, 'species', 'species'), ' present'),
      h('span', { class: 'wa-chip' }, 'Sum of SSI: ', t.ssiSum === null ? 'n/a' : fmt(t.ssiSum, 2)),
      n ? h('span', { class: 'wa-chip' }, `Reference richness: ${n}`) : null,
      t.needSsi.length ? h('span', { class: 'wa-chip is-warn' },
        `SSI needed: ${t.needSsi.map((i) => RESACA_SPECIES[i].common).slice(0, 3).join(', ')}${t.needSsi.length > 3 ? ` and ${t.needSsi.length - 3} more` : ''}`) : null,
      t.invalid.length ? h('span', { class: 'wa-chip is-err' },
        `Check ${t.invalid.map((i) => RESACA_SPECIES[i].common).slice(0, 3).join(', ')}: composition 0 to 100, SSI 0 to 1`) : null,
    ].filter((x): x is HTMLSpanElement => x !== null))
  }

  const el = h('section', { class: 'wa-group wa-species', 'aria-labelledby': 'species-h' },
    h('div', { class: 'wa-group-head' }, h('h2', { id: 'species-h' }, 'Species composition')),
    h('p', { class: 'wa-group-note' }, 'Enter each species\' percent composition. Reference species also need an SSI (1.0 within the reference range).'),
    h('div', { class: 'wa-species-tools' }, h('div', { class: 'wa-search' }, icon('search'), search), allToggle),
    sum,
    h('div', { class: 'wa-table-wrap is-tall' }, h('table', { class: 'wa-table' },
      h('thead', null, h('tr', null, h('th', null, 'Species'), h('th', { class: 'num' }, 'Reference range'), h('th', null, '% composition'), h('th', null, 'SSI'), h('th', null, ''))),
      body)))

  renderRows()
  renderSum()

  return {
    el,
    update(next: Raw, nextHabitat: ResacaHabitat | undefined) {
      const changed = nextHabitat !== habitat
      raw = next
      habitat = nextHabitat
      renderSum()
      if (changed) {
        renderRows()
        return
      }
      // keep the focused input; refresh which SSI inputs are open
      for (const r of speciesRows(habitat)) {
        const ssi = inputs.get(speciesKey(r.index, 'ssi'))
        if (!ssi) continue
        const comp = parseNumber(raw[speciesKey(r.index, 'comp')] ?? '')
        const open = !!r.range && comp !== null && comp > 0
        ssi.disabled = !open
        ssi.placeholder = open ? 'needed' : ''
        const hintCell = ssi.closest('tr')?.lastElementChild
        if (hintCell) hintCell.textContent = r.range && open && comp !== null
          ? (comp >= r.range[0] && comp <= r.range[1] ? 'In range: SSI 1.0' : 'Out of range') : ''
      }
    },
  }
}
