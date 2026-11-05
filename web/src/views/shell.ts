// The page around every view: the navy header with the navigation, the main area, and the footer with
// the citation and the disclaimer.
import { CALCULATORS } from '../calculators'
import { APP_NAME, APP_TITLE, APP_VERSION_LABEL, ORG_URL, REPO_URL, TN } from '../engine/version'
import { h } from '../lib/dom'
import { brandMark, icon } from '../lib/icons'
import { href, type Route } from '../lib/router'

export interface Shell {
  main: HTMLElement
  setRoute(r: Route): void
}

export function renderShell(root: HTMLElement): Shell {
  const links = {
    home: h('a', { href: href({ name: 'home' }) }, 'Home'),
    find: h('a', { href: href({ name: 'find' }) }, 'Find a model'),
    guide: h('a', { href: href({ name: 'guide' }) }, 'Guide'),
  }
  const menuPanel = h('div', { class: 'wa-menu-panel', id: 'calc-menu', hidden: true },
    CALCULATORS.map((c) => h('a', { href: href({ name: 'calc', id: c.id }), 'data-id': c.id }, c.name, h('small', null, c.returns))))
  const menuButton = h('button', { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'calc-menu' }, 'Calculators', icon('down'))
  const menu = h('div', { class: 'wa-menu' }, menuButton, menuPanel)
  const nav = h('nav', { class: 'wa-nav', id: 'main-nav', 'aria-label': 'Main' }, links.home, links.find, menu, links.guide)
  const toggle = h('button', { class: 'wa-menu-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'main-nav', 'aria-label': 'Menu' }, icon('menu'))

  const setMenu = (open: boolean) => {
    menuPanel.hidden = !open
    menuButton.setAttribute('aria-expanded', String(open))
  }
  menuButton.addEventListener('click', (e) => {
    e.stopPropagation()
    setMenu(!!menuPanel.hidden)
  })
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target as Node)) setMenu(false)
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setMenu(false)
      nav.classList.remove('is-open')
      toggle.setAttribute('aria-expanded', 'false')
    }
  })
  toggle.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open')
    nav.classList.toggle('is-open', open)
    toggle.setAttribute('aria-expanded', String(open))
  })

  const header = h('header', { class: 'wa-header' },
    h('div', { class: 'wa-header-in' },
      h('a', { class: 'wa-brand', href: href({ name: 'home' }), 'aria-label': `${APP_NAME} home` },
        brandMark(), h('span', { class: 'wa-brand-name' }, APP_NAME), h('span', { class: 'wa-brand-sub' }, APP_TITLE)),
      toggle, nav))

  const main = h('main', { class: 'wa-main', id: 'main', tabindex: '-1' })

  const footer = h('footer', { class: 'wa-footer' },
    h('div', { class: 'wa-footer-in' },
      h('p', null, 'Cite: ', TN.citation, ' ', h('a', { href: TN.url, target: '_blank', rel: 'noopener' }, TN.url)),
      h('p', null, 'WARM is a calculator, not an endorsement of any model. Neither the authors nor USACE accepts responsibility or liability for third-party use of these models. Nothing you enter leaves your browser.'),
      h('div', { class: 'wa-footer-links' },
        h('a', { href: href({ name: 'guide', section: 'about' }) }, 'About'),
        h('a', { href: href({ name: 'guide', section: 'changes' }) }, 'Changes from the Shiny app'),
        h('a', { href: REPO_URL, target: '_blank', rel: 'noopener' }, 'Source code (GPL 3.0)'),
        h('a', { href: ORG_URL, target: '_blank', rel: 'noopener' }, 'USACE WRISES'),
        h('span', null, `${APP_NAME} ${APP_VERSION_LABEL}`))))

  root.replaceChildren(h('a', { class: 'wa-skip', href: '#main', onclick: (e: Event) => {
    e.preventDefault()
    main.focus()
  } }, 'Skip to the content'), header, main, footer)

  return {
    main,
    setRoute(r: Route) {
      for (const [name, a] of Object.entries(links)) {
        if (r.name === name) a.setAttribute('aria-current', 'page')
        else a.removeAttribute('aria-current')
      }
      menuButton.classList.toggle('is-current', r.name === 'calc')
      for (const a of menuPanel.querySelectorAll('a')) {
        if (r.name === 'calc' && a.getAttribute('data-id') === r.id) a.setAttribute('aria-current', 'page')
        else a.removeAttribute('aria-current')
      }
      setMenu(false)
      nav.classList.remove('is-open')
      toggle.setAttribute('aria-expanded', 'false')
    },
  }
}
