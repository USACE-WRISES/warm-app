// The home page: what WARM does, the two ways in, and the nine calculators.
import { CALCULATORS } from '../calculators'
import { APP_NAME, APP_TITLE, TN } from '../engine/version'
import { h, s } from '../lib/dom'
import { icon } from '../lib/icons'
import { href } from '../lib/router'

/** A quiet illustration: a stream between riparian banks, with a suitability curve over it. */
function heroArt(): SVGSVGElement {
  return s('svg', { viewBox: '0 0 480 300', role: 'img', 'aria-label': 'A stream corridor with a suitability curve' },
    s('rect', { width: 480, height: 300, fill: '#f6f8fb' }),
    s('path', { d: 'M0 210 C 80 170, 140 250, 240 214 S 400 168, 480 200 L480 300 L0 300 Z', fill: '#e8f4ec' }),
    s('path', { d: 'M0 236 C 90 200, 150 276, 250 240 S 410 196, 480 226', fill: 'none', stroke: '#9cc3e6', 'stroke-width': 18, 'stroke-linecap': 'round' }),
    s('path', { d: 'M0 236 C 90 200, 150 276, 250 240 S 410 196, 480 226', fill: 'none', stroke: '#c9e0f4', 'stroke-width': 6, 'stroke-linecap': 'round' }),
    ...[[60, 196], [110, 184], [300, 186], [360, 174], [420, 182], [190, 200]].map(([x, y]) =>
      s('g', null,
        s('rect', { x: x - 2, y, width: 4, height: 18, fill: '#7a8b74' }),
        s('circle', { cx: x, cy: y - 6, r: 16, fill: '#8fd19e' }),
        s('circle', { cx: x + 9, cy: y - 12, r: 10, fill: '#6fbf86' }))),
    s('g', { transform: 'translate(70 36)' },
      s('rect', { width: 340, height: 120, rx: 10, fill: '#ffffff', stroke: '#d5deea' }),
      s('line', { x1: 34, y1: 96, x2: 318, y2: 96, stroke: '#c8d8f0' }),
      s('line', { x1: 34, y1: 20, x2: 34, y2: 96, stroke: '#c8d8f0' }),
      s('text', { x: 14, y: 26, 'font-size': 11, fill: '#646f80', 'font-family': 'Instrument Sans, sans-serif' }, '1'),
      s('text', { x: 14, y: 99, 'font-size': 11, fill: '#646f80', 'font-family': 'Instrument Sans, sans-serif' }, '0'),
      s('polyline', { points: '34,96 96,72 150,24 230,24 290,60 318,70', fill: 'none', stroke: '#2f4b7c', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
      s('circle', { cx: 190, cy: 24, r: 6, fill: '#2e7d4f', stroke: '#fff', 'stroke-width': 2 }),
      s('text', { x: 200, y: 50, 'font-size': 12, fill: '#2a3344', 'font-family': 'Space Grotesk, sans-serif', 'font-weight': 600 }, 'SI 1.0')))
}

export function homePage(): HTMLElement {
  return h('div', null,
    h('section', { class: 'wa-hero' },
      h('div', null,
        h('h1', null, APP_NAME, h('span', null, APP_TITLE)),
        h('p', { class: 'wa-lead' }, 'Compare 14 riparian models against your project, then run nine of them in calculators that check every input and show how each result is built.'),
        h('div', { class: 'wa-hero-actions' },
          h('a', { class: 'wa-btn wa-btn-primary wa-btn-lg', href: href({ name: 'find' }) }, icon('search'), 'Find a model'),
          // the route is in the hash, so this scrolls rather than linking to #calculators
          h('a', { class: 'wa-btn wa-btn-lg', href: href({ name: 'home' }), onclick: (e: Event) => {
            e.preventDefault()
            document.getElementById('calculators')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          } }, icon('calc'), 'Open a calculator'))),
      h('div', { class: 'wa-hero-art' }, heroArt())),

    h('section', { class: 'wa-section', 'aria-labelledby': 'how' },
      h('h2', { id: 'how', class: 'visually-hidden' }, 'How WARM works'),
      h('div', { class: 'wa-steps' },
        h('div', { class: 'wa-step' }, h('span', { class: 'wa-step-n' }, '1'), h('h3', null, 'Find'),
          h('p', null, 'Rank the models by region, model type and the processes your project affects, or search them by keyword.')),
        h('div', { class: 'wa-step' }, h('span', { class: 'wa-step-n' }, '2'), h('h3', null, 'Calculate'),
          h('p', null, 'Enter one site in a guided form, or many sites in a grid you can paste into from a spreadsheet.')),
        h('div', { class: 'wa-step' }, h('span', { class: 'wa-step-n' }, '3'), h('h3', null, 'Export'),
          h('p', null, 'Copy or download the results as CSV, save your inputs to reopen later, or print a summary.')))),

    h('section', { class: 'wa-section', id: 'calculators', 'aria-labelledby': 'calcs-h' },
      h('div', { class: 'wa-section-head' },
        h('h2', { id: 'calcs-h' }, 'Calculators'),
        h('span', { class: 'wa-muted wa-small' }, 'Nine certified or reviewed models in the habitat suitability index (HSI) format')),
      h('div', { class: 'wa-calcs' },
        CALCULATORS.map((c) => h('a', { class: 'wa-calc-card', href: href({ name: 'calc', id: c.id }) },
          h('h3', null, c.name),
          h('p', null, c.purpose),
          h('div', { class: 'wa-chips' }, h('span', { class: 'wa-chip is-accent' }, c.returns), h('span', { class: 'wa-chip' }, c.region)),
          h('span', { class: 'wa-go' }, 'Open', icon('arrow')))))),

    h('section', { class: 'wa-section wa-about', 'aria-labelledby': 'about-h' },
      h('div', { class: 'wa-card' },
        h('h2', { id: 'about-h' }, 'About WARM'),
        h('p', null, 'The Web App for Riparian Models brings previously developed riparian models into one standard interface: a model comparison tool for choosing a model, and calculators that run the models chosen with built-in error checking.'),
        h('p', null, 'WARM is a calculator, not an endorsement of any model in it, and it is not prescriptive: you choose the model that fits your project. The models are documented by their own reports, linked on each calculator.'),
        h('a', { href: href({ name: 'guide' }) }, 'Read the guide')),
      h('div', { class: 'wa-card' },
        h('h2', null, 'Documentation'),
        h('p', { class: 'wa-cite' }, TN.citation, ' ', h('a', { href: TN.url, target: '_blank', rel: 'noopener' }, 'doi.org')),
        h('p', { class: 'wa-small wa-muted' }, 'WARM 2.0 corrects several calculations of the earlier Shiny app against the models\' source reports. ',
          h('a', { href: href({ name: 'guide', section: 'changes' }) }, 'See what changed.')))))
}
