// The app's identity: one version number and the names every surface shows.
//
// APP_VERSION moves together with the newest section of CHANGELOG.md, CITATION.cff and
// web/package.json (CONTRIBUTING.md rule 4; tests/repo_rules.test.ts pins them all).

export const APP_VERSION = '2.0.0'
export const APP_VERSION_LABEL = `v${APP_VERSION}`

export const APP_NAME = 'WARM'
/** The header's subtitle and the page title's second half. */
export const APP_TITLE = 'Web App for Riparian Models'
/** What the app does, on the home page. */
export const APP_TAGLINE = 'Find a riparian model for your project, then run its calculator.'

/** The previous release, the R Shiny app this one replaces. */
export const PREVIOUS = { version: '1.2.2', url: 'https://wrises.shinyapps.io/warm/' }

export const REPO = 'USACE-WRISES/warm-app'
export const REPO_URL = `https://github.com/${REPO}`
export const ISSUES_URL = `${REPO_URL}/issues`
export const ORG_URL = 'https://github.com/USACE-WRISES'

/** The ERDC technical note that documents WARM (its citation, verbatim from the note). */
export const TN = {
  citation: 'Wiest, Samantha R., Colton Shaw, and S. Kyle McKay. 2026. A Web Application for Riparian Models (WARM). ERDC/TN EMRRP-RQ-7. US Army Engineer Research and Development Center.',
  url: 'https://dx.doi.org/10.21079/11681/50449',
  short: 'ERDC/TN EMRRP-RQ-7',
}
