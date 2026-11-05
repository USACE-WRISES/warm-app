// WARM: the page starts here. The shell (header, footer) is drawn once; each route draws its view
// into the main area.
import { calculator } from './calculators'
import { APP_NAME, APP_TITLE } from './engine/version'
import { h } from './lib/dom'
import { startDownloads } from './lib/download'
import { href, onRoute, type Route } from './lib/router'
import { calculatorPage } from './views/calculator'
import { finderPage } from './views/finder'
import { guidePage } from './views/guide'
import { homePage } from './views/home'
import { renderShell } from './views/shell'

const shell = renderShell(document.getElementById('app')!)

function notFound(): HTMLElement {
  return h('div', { class: 'wa-card wa-empty' },
    h('h1', null, 'Page not found'),
    h('p', null, 'This link does not lead to a page of WARM.'),
    h('a', { class: 'wa-btn wa-btn-primary', href: href({ name: 'home' }) }, 'Go to the home page'))
}

function view(r: Route): { el: HTMLElement; title: string } {
  switch (r.name) {
    case 'home': return { el: homePage(), title: `${APP_NAME}: ${APP_TITLE}` }
    case 'find': return { el: finderPage(), title: `Find a model | ${APP_NAME}` }
    case 'guide': return { el: guidePage(r.section), title: `Guide | ${APP_NAME}` }
    case 'calc': {
      const spec = calculator(r.id)
      return spec ? { el: calculatorPage(spec), title: `${spec.name} | ${APP_NAME}` } : { el: notFound(), title: `Not found | ${APP_NAME}` }
    }
    case 'missing': return { el: notFound(), title: `Not found | ${APP_NAME}` }
  }
}

let first = true
onRoute((r) => {
  const { el, title } = view(r)
  shell.main.replaceChildren(el)
  shell.setRoute(r)
  document.title = title
  if (!first) {
    window.scrollTo(0, 0)
    shell.main.focus({ preventScroll: true })
  }
  first = false
})

startDownloads()
