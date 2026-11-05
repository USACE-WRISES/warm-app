// WARM's page as the website serves it: its head written into index.html. Adapted from CEICA's
// site.ts.
//
// Everything the page serves as is lives in page/ (Vite's public folder: served at the app's root in
// development, copied into the build as is): the stylesheet, the fonts, the icons and the download
// worker. Each file the page asks for carries a ?v= content hash, so a new release is never served
// from an old cache.
//
// The stylesheet is written into the page: under the USACE network's browser isolation (DISA CBII,
// Menlo Security) a linked stylesheet did not apply in STAF's app (2026-10-12). Its url()s are made
// relative to the page.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

/** The page's own files (Vite's public folder). */
export const PAGE = fileURLToPath(new URL('./page', import.meta.url))

/** The first 10 hex digits of a page file's sha256: its ?v= */
export function contentHash(path: string): string {
  return createHash('sha256').update(readFileSync(resolve(PAGE, path))).digest('hex').slice(0, 10)
}

function url(path: string): string {
  return `${path}?v=${contentHash(path)}`
}

/** A CSS url(), quoted either way or bare */
const CSS_URL = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^'")\s]+))\s*\)/g
/** What filters on managed networks treat as attacks */
const IE_HOOKS = /behavior\s*:\s*url|expression\s*\(|progid\s*:/i

/** A sheet's relative url()s made relative to the page, with the file's ?v=. data: and absolute
 * addresses and fragment references are left as they are. */
export function rebase(css: string, folder: string): string {
  return css.replace(CSS_URL, (all: string, dq?: string, sq?: string, bare?: string) => {
    const ref = dq ?? sq ?? bare ?? ''
    if (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(ref)) return all
    const cut = ref.search(/[?#]/)
    const path = posix.normalize(folder + (cut < 0 ? ref : ref.slice(0, cut)))
    const rest = cut < 0 ? '' : ref.slice(cut)
    const target = !rest && existsSync(resolve(PAGE, path)) ? url(path) : path + rest
    return `url("${target}")`
  })
}

/** A stylesheet as a style element. */
export function inlineSheet(path: string): string {
  const css = readFileSync(resolve(PAGE, path), 'utf-8')
  if (/<\/style/i.test(css)) throw new Error(`${path} would end its style element`)
  if (IE_HOOKS.test(css)) throw new Error(`${path} holds an IE hook`)
  const folder = posix.dirname(path) === '.' ? '' : `${posix.dirname(path)}/`
  return `<style data-warm-src="${path}">${rebase(css, folder)}</style>`
}

/** The head after its charset and title. */
export function head(): string[] {
  return [
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>',
    '<meta name="description" content="WARM, the Web App for Riparian Models: find a riparian model for a project and run its calculator."/>',
    '<meta name="theme-color" content="#243a61"/>',
    // search engines leave the site out, as the other WRISES apps do (the owner's decision for CEICA, 2026-10-20)
    '<meta name="robots" content="noindex"/>',
    `<link rel="icon" href="${url('icons/warm-icon.svg')}" type="image/svg+xml"/>`,
    inlineSheet('warm.css'),
  ]
}

export function warmSite(): Plugin {
  return {
    name: 'warm-site',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.filename.endsWith('index.html')) return html
        return html.replace('<!--warm:head-->', head().join('\n    '))
      },
    },
  }
}
