// The home page: what WARM does in one sentence, the two ways in, and the nine calculators.
import { CALCULATORS } from '../calculators'
import { APP_TAGLINE, APP_TITLE } from '../engine/version'
import { h } from '../lib/dom'
import { icon } from '../lib/icons'
import { href } from '../lib/router'

export function homePage(): HTMLElement {
  return h('div', null,
    h('section', { class: 'wa-hero' },
      h('h1', null, APP_TITLE),
      h('p', { class: 'wa-lead' }, APP_TAGLINE),
      h('div', { class: 'wa-hero-actions' },
        h('a', { class: 'wa-btn wa-btn-primary wa-btn-lg', href: href({ name: 'find' }) }, icon('search'), 'Find a model'),
        // the route is in the hash, so this moves to the cards rather than linking to #calculators
        h('a', { class: 'wa-btn wa-btn-lg', href: href({ name: 'home' }), onclick: (e: Event) => {
          e.preventDefault()
          document.getElementById('calculators')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          document.querySelector<HTMLElement>('#calculators .wa-calc-card')?.focus({ preventScroll: true })
        } }, icon('calc'), 'Open a calculator'))),

    h('section', { class: 'wa-section', id: 'calculators', 'aria-labelledby': 'calcs-h' },
      h('div', { class: 'wa-section-head' }, h('h2', { id: 'calcs-h' }, 'Calculators')),
      h('div', { class: 'wa-calcs' },
        CALCULATORS.map((c) => h('a', { class: 'wa-calc-card', href: href({ name: 'calc', id: c.id }) },
          h('h3', null, c.name),
          h('p', null, c.purpose),
          h('span', { class: 'wa-calc-returns' }, c.returns))))))
}
