// The Guide: about WARM, how to use it, the models and their sources, what changed from WARM 1.x, and
// the methods. The last two are the repository's own documents (docs/), rendered here.
import changesMd from '../../../docs/changes-from-1x.md?raw'
import methodsMd from '../../../docs/methods.md?raw'
import { CALCULATORS } from '../calculators'
import { SOURCES } from '../calculators/sources'
import { MODELS } from '../engine/finder'
import { APP_NAME, APP_VERSION_LABEL, PREVIOUS, REPO_URL, TN } from '../engine/version'
import { h } from '../lib/dom'
import { renderMarkdown } from '../lib/markdown'
import { href } from '../lib/router'

const SECTIONS = [
  { id: 'about', title: 'About WARM' },
  { id: 'use', title: 'Using WARM' },
  { id: 'models', title: 'Models and sources' },
  { id: 'changes', title: 'Changes from WARM 1.x' },
  { id: 'methods', title: 'Methods' },
] as const

const ext = (url: string, text: string) => h('a', { href: url, target: '_blank', rel: 'noopener' }, text)

function about(): HTMLElement {
  return h('div', null,
    h('h1', null, 'About WARM'),
    h('p', null, 'The Web App for Riparian Models (WARM) compiles nine previously developed riparian models into one standard interface. It offers a model comparison tool that helps you identify models that fit your project, and calculators that run those models with built-in checks on every input.'),
    h('p', null, 'The nine calculators are the models that use a habitat suitability index (HSI) format and had been reviewed and certified for use on US Army Corps of Engineers projects, out of the 14 riparian models reviewed by Wiest et al. (2023). An HSI combines the quantity and quality of a patch of habitat: its area, and a 0 to 1 index of its suitability built from variables that each have their own suitability curve.'),
    h('h2', null, 'A calculator, not an endorsement'),
    h('p', null, 'WARM runs the models as their documents define them and should be thought of as a calculator rather than an endorsement of any model in it. It is not prescriptive: you choose the model, and the scientific quality of each model rests on its own review and certification. Neither the authors nor the US Army Corps of Engineers accepts responsibility or liability for the use of these models by third parties.'),
    h('h2', null, 'How to cite'),
    h('p', { class: 'wa-cite' }, TN.citation, ' ', ext(TN.url, TN.url)),
    h('p', null, `${APP_NAME} ${APP_VERSION_LABEL} rebuilds the R Shiny app (WARM ${PREVIOUS.version}) as a web app that runs entirely in your browser, and corrects several of its calculations against the models' source documents (see `,
      h('a', { href: href({ name: 'guide', section: 'changes' }) }, 'Changes from WARM 1.x'), ').'),
    h('h2', null, 'Credits'),
    h('p', null, 'WARM was developed by Samantha R. Wiest (ERDC Environmental Laboratory), Colton Shaw and S. Kyle McKay, with support from the Ecosystem Management and Restoration Research Program (EMRRP). Contact details are in the technical note.'),
    h('p', null, 'The source code is at ', ext(REPO_URL, REPO_URL), ', under the GNU General Public License, version 3.'))
}

function use(): HTMLElement {
  return h('div', null,
    h('h1', null, 'Using WARM'),
    h('h2', null, 'Find a model'),
    h('p', null, 'On ', h('a', { href: href({ name: 'find' }) }, 'Find a model'), ', describe your project: its region, the type of model you need, and the instream and riparian processes it affects. The models are ranked by how many of your criteria they meet; the chips on each model show which ones it met. A keyword narrows the list to the models that mention it. Nine models open a calculator; the others are described in the review of riparian models.'),
    h('h2', null, 'Run a calculator'),
    h('ul', null,
      h('li', null, h('strong', null, 'Setup first. '), 'Models that branch (cover type, stand age, species, habitat, limiting factor) ask for that choice first, then show only the inputs it uses.'),
      h('li', null, h('strong', null, 'Inputs. '), 'Each input shows its unit and allowed range. Inputs that are field measurements show the suitability index they give as you type; ', h('em', null, 'Curve'), ' draws the curve with your value on it. Inputs that are suitability indices (0 to 1) are read from the model\'s own curves.'),
      h('li', null, h('strong', null, 'Results. '), 'The result appears once every input it needs is filled in and valid; until then the panel lists what is left. An input out of range is flagged, not erased.'),
      h('li', null, h('strong', null, 'Worked example. '), 'Most calculators can load the example the ERDC technical note tested them with.')),
    h('h2', null, 'One site or many'),
    h('p', null, h('strong', null, 'One site'), ' is a guided form. Copying a column of values from a spreadsheet and pasting it into a field fills that field and the ones after it, in order.'),
    h('p', null, h('strong', null, 'Many sites'), ' is a grid with one row per site. Paste a block from a spreadsheet into any cell, or import a CSV whose columns use the grid\'s codes (for example DEPTHGW) or labels. Cells a site does not use are hatched; invalid cells are shaded red; the results fill the columns on the right.'),
    h('h2', null, 'Keep and share your work'),
    h('ul', null,
      h('li', null, 'Your inputs stay in this browser between visits, for each calculator. ', h('em', null, 'Clear'), ' removes them.'),
      h('li', null, h('em', null, 'Save'), ' downloads your inputs as a file; ', h('em', null, 'Open'), ' loads it again, on any computer.'),
      h('li', null, h('em', null, 'Download CSV'), ' and ', h('em', null, 'Copy'), ' give the inputs, the suitability index of each measurement, and the results, ready for a spreadsheet.'),
      h('li', null, h('em', null, 'Print this site'), ' prints the form and its results.')),
    h('p', null, 'WARM runs entirely in your browser: nothing you enter is sent anywhere.'))
}

function models(): HTMLElement {
  const calcIds = new Set(CALCULATORS.map((c) => c.modelId))
  return h('div', null,
    h('h1', null, 'Models and sources'),
    h('p', null, 'The model comparison data are from the review of riparian models:'),
    h('p', { class: 'wa-cite' }, SOURCES.review.text, ' ', ext(SOURCES.review.url, SOURCES.review.url)),
    h('h2', null, 'The nine calculators'),
    CALCULATORS.map((c) => h('div', { style: { marginBottom: '18px' } },
      h('h3', null, h('a', { href: href({ name: 'calc', id: c.id }) }, c.name)),
      h('p', { class: 'wa-small wa-muted', style: { margin: '2px 0 6px' } }, c.title),
      c.citations.map((s) => h('p', { class: 'wa-cite' }, s.text, s.url ? [' ', ext(s.url, s.url.includes('ecolibrary') ? 'USACE model library' : s.url)] : null)))),
    h('h2', null, 'The other five models'),
    h('p', null, 'Model Comparison also includes five models without a calculator in WARM; Wiest et al. (2023) describes each:'),
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
    : current === 'changes' ? h('div', null, h('h1', null, 'Changes from WARM 1.x'), renderMarkdown(changesMd, { skipTitle: true }))
    : h('div', null, h('h1', null, 'Methods'), renderMarkdown(methodsMd, { skipTitle: true }))
  return h('div', null,
    h('p', { class: 'wa-crumbs' }, h('a', { href: href({ name: 'home' }) }, 'Home'), ' / Guide'),
    h('div', { class: 'wa-guide' },
      h('nav', { class: 'wa-toc', 'aria-label': 'Guide' },
        SECTIONS.map((s) => h('a', { href: href({ name: 'guide', section: s.id }), 'aria-current': s.id === current ? 'true' : undefined }, s.title))),
      h('article', { class: 'wa-doc' }, content)))
}
