// The Guide: about WARM, how to use it, the models and their sources, what changed from the Shiny app, and
// the methods. The last two are the repository's own documents (docs/), rendered here.
import changesMd from '../../../docs/changes-from-1x.md?raw'
import methodsMd from '../../../docs/methods.md?raw'
import { CALCULATORS } from '../calculators'
import { SOURCES } from '../calculators/sources'
import { MODELS } from '../engine/finder'
import { PREVIOUS, REPO_URL, TN } from '../engine/version'
import { h } from '../lib/dom'
import { renderMarkdown } from '../lib/markdown'
import { href } from '../lib/router'

const SECTIONS = [
  { id: 'about', title: 'About WARM' },
  { id: 'use', title: 'Using WARM' },
  { id: 'models', title: 'Models and sources' },
  { id: 'changes', title: 'Changes from the Shiny app' },
  { id: 'methods', title: 'Methods' },
] as const

const ext = (url: string, text: string) => h('a', { href: url, target: '_blank', rel: 'noopener' }, text)

function about(): HTMLElement {
  return h('div', null,
    h('h1', null, 'About WARM'),
    h('p', null, 'WARM has two parts. Find a model ranks 14 riparian models against your project. The calculators run nine of them: the models in habitat suitability index (HSI) format that were reviewed or certified for US Army Corps of Engineers (USACE) use (Wiest et al. 2023).'),
    h('p', null, 'An HSI rates habitat from 0 to 1. Each variable has a suitability curve, and the HSI combines them. Habitat units are the HSI times the area.'),
    h('h2', null, 'A calculator, not an endorsement'),
    h('p', null, 'WARM runs each model as its documents define it. It does not endorse or prescribe any model: you choose the one that fits your project, and each model\'s quality rests on its own review and certification. Neither the authors nor USACE accepts responsibility or liability for third-party use of these models.'),
    h('h2', null, 'How to cite'),
    h('p', { class: 'wa-cite' }, TN.citation, ' ', ext(TN.url, TN.url)),
    h('p', null, `This web app replaces the R Shiny app (WARM ${PREVIOUS.version}). It runs in your browser and corrects several of the Shiny app's calculations (see `,
      h('a', { href: href({ name: 'guide', section: 'changes' }) }, 'Changes from the Shiny app'), ').'),
    h('h2', null, 'Credits'),
    h('p', null, 'Developed by Samantha R. Wiest (ERDC Environmental Laboratory), Colton Shaw and S. Kyle McKay, with support from the Ecosystem Management and Restoration Research Program (EMRRP). Contact details are in the technical note.'),
    h('p', null, 'Source code: ', ext(REPO_URL, REPO_URL), ' (GNU General Public License, version 3).'))
}

function use(): HTMLElement {
  return h('div', null,
    h('h1', null, 'Using WARM'),
    h('h2', null, 'Find a model'),
    h('p', null, 'On ', h('a', { href: href({ name: 'find' }) }, 'Find a model'), ', set your project\'s region, model type and the processes it affects. Models are ranked by how many criteria they meet. A keyword shows only the models that mention it.'),
    h('h2', null, 'Calculators'),
    h('ul', null,
      h('li', null, 'Choose the setup first (cover type, stand age, species, habitat or limiting factor). Only the inputs it needs appear.'),
      h('li', null, 'Each input shows its unit. The (i) button shows its help and, for a measurement, its suitability curve.'),
      h('li', null, 'Inputs that are suitability indices (0 to 1) are read from the model\'s own curves.'),
      h('li', null, 'Results appear once every required input is valid. A value out of range is flagged, not erased.'),
      h('li', null, h('em', null, 'Example'), ' loads the test case from the ERDC technical note.')),
    h('h2', null, 'One site or many'),
    h('p', null, h('strong', null, 'One site:'), ' paste a column of values from a spreadsheet into a field to fill it and the fields after it.'),
    h('p', null, h('strong', null, 'Many sites:'), ' one row per site. Paste a block of cells, or import a CSV whose columns use the grid\'s codes (such as DEPTHGW) or labels. Unused cells are hatched and invalid cells are red.'),
    h('h2', null, 'Saving your work'),
    h('ul', null,
      h('li', null, 'Inputs stay in this browser for each calculator until you clear them.'),
      h('li', null, h('em', null, 'Save'), ' downloads your inputs as a file. ', h('em', null, 'Open'), ' loads it again on any computer.'),
      h('li', null, h('em', null, 'Copy'), ' and ', h('em', null, 'CSV'), ' export the inputs, the suitability indices and the results.'),
      h('li', null, h('em', null, 'Print'), ' prints the site and its results.')),
    h('p', null, 'Nothing you enter leaves your browser.'))
}

function models(): HTMLElement {
  const calcIds = new Set(CALCULATORS.map((c) => c.modelId))
  return h('div', null,
    h('h1', null, 'Models and sources'),
    h('p', null, 'The model comparison data come from:'),
    h('p', { class: 'wa-cite' }, SOURCES.review.text, ' ', ext(SOURCES.review.url, SOURCES.review.url)),
    h('h2', null, 'The nine calculators'),
    CALCULATORS.map((c) => h('div', { style: { marginBottom: '12px' } },
      h('h3', null, h('a', { href: href({ name: 'calc', id: c.id }) }, c.name)),
      h('p', { class: 'wa-small wa-muted', style: { margin: '2px 0 4px' } }, c.title),
      c.citations.map((s) => h('p', { class: 'wa-cite' }, s.text, s.url ? [' ', ext(s.url, s.url.includes('ecolibrary') ? 'USACE model library' : s.url)] : null)))),
    h('h2', null, 'The other five models'),
    h('p', null, 'These have no calculator in WARM. Wiest et al. (2023) describes each:'),
    h('ul', null, MODELS.filter((m) => !calcIds.has(m.id)).map((m) => h('li', null, m.name))),
    h('h2', null, 'WARM itself'),
    h('p', { class: 'wa-cite' }, TN.citation, ' ', ext(TN.url, TN.url)),
    h('p', { class: 'wa-cite' }, SOURCES.inspire.text, ' ', ext(SOURCES.inspire.url, SOURCES.inspire.url)))
}

export function guidePage(section: string | undefined): HTMLElement {
  const current = SECTIONS.find((s) => s.id === section)?.id ?? 'about'
  const content = current === 'about' ? about()
    : current === 'use' ? use()
    : current === 'models' ? models()
    : current === 'changes' ? h('div', null, h('h1', null, 'Changes from the Shiny app'), renderMarkdown(changesMd, { skipTitle: true }))
    : h('div', null, h('h1', null, 'Methods'), renderMarkdown(methodsMd, { skipTitle: true }))
  return h('div', null,
    h('div', { class: 'wa-guide' },
      h('nav', { class: 'wa-toc', 'aria-label': 'Guide' },
        SECTIONS.map((s) => h('a', { href: href({ name: 'guide', section: s.id }), 'aria-current': s.id === current ? 'true' : undefined }, s.title))),
      h('article', { class: 'wa-doc' }, content)))
}
