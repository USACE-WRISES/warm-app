// The repository's own rules (CONTRIBUTING.md), adapted from CEICA's: the copy rules over every file
// people read, the changelog and the version moving together, the page loading nothing from other
// sites, and the public repository's hygiene: no AI tool named, no personal data or machine paths.
// The words it looks for are put together from pieces, so this file never matches itself.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const WEB = fileURLToPath(new URL('..', import.meta.url))
const REPO = fileURLToPath(new URL('../..', import.meta.url))
const SELF = fileURLToPath(import.meta.url)
const DASHES = [String.fromCharCode(0x2014), String.fromCharCode(0x2013)]
const piece = (...parts: string[]): string => parts.join('')
/** Folders never walked: tools', builds' and the reference material kept on this computer. */
const SKIP = new Set(['.git', 'node_modules', 'dist', 'coverage', 'Notes', '.claude', '.vite'])
const tool = piece('cla', 'ude')
/** What stays on this computer, never in the repository. */
const LOCAL_ONLY = ['Notes/', `.${tool}/`, `${tool.toUpperCase()}.md`, piece('AGENTS', '.md')]

const rel = (p: string): string => relative(REPO, p).split('\\').join('/')

function walk(exts: readonly string[], dir = REPO): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIP.has(e.name) ? [] : walk(exts, join(dir, e.name))
    return e.isFile() && exts.includes(extname(e.name).toLowerCase()) ? [join(dir, e.name)] : []
  })
}

describe('copy rules (CONTRIBUTING.md rule 5)', () => {
  it('no em or en dashes in the app, its data or the documents people read', () => {
    const files = [...walk(['.js', '.mjs', '.css', '.ts', '.csv', '.html', '.svg', '.r', '.yml']),
      ...['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'docs/methods.md', 'docs/changes-from-1x.md', 'reference/README.md'].map((n) => join(REPO, n))]
    const bad: string[] = []
    for (const p of files) {
      readFileSync(p, 'utf-8').split('\n').forEach((line, i) => {
        if (DASHES.some((d) => line.includes(d))) bad.push(`${rel(p)}:${i + 1}`)
      })
    }
    expect(bad).toEqual([])
  })
  it('US spelling everywhere', () => {
    const british = new RegExp(`\\b(${[piece('col', 'our\\w*'), piece('behavi', 'our\\w*'), piece('fav', 'our\\w*'),
      piece('hon', 'our\\w*'), piece('lab', 'our\\w*'), piece('analy', 's(e|ed|es|ing)'), piece('organ', 'is(e|ed|es|ing|ation)\\w*'),
      piece('cen', 'tre\\w*'), piece('me', 'tre\\w*'), piece('model', 'ling'), piece('label', 'led'), piece('label', 'ling'),
      piece('cancel', 'led'), piece('travel', 'led'), piece('program', 'mes?'), piece('lic', 'ence\\w*'),
      piece('catal', 'ogue\\w*'), piece('def', 'ence\\w*'), piece('optim', 'is\\w*'), piece('summar', 'is\\w*'),
      piece('recogn', 'is\\w*'), piece('normal', 'is\\w*'), piece('util', 'is\\w*'), piece('visual', 'is\\w*'),
      piece('priorit', 'is\\w*'), piece('characteris', '(e|ed|es|ing|ation)')].join('|')})\\b`, 'i')
    const hits: string[] = []
    for (const p of walk(['.ts', '.js', '.mjs', '.css', '.md', '.html', '.cff', '.yml', '.r', '.csv'])) {
      if (p === SELF || p.includes(`${join('page', 'fonts')}`)) continue
      readFileSync(p, 'utf-8').split('\n').forEach((line, i) => {
        const m = british.exec(line)
        if (m) hits.push(`${rel(p)}:${i + 1}: ${m[0]}`)
      })
    }
    expect(hits).toEqual([])
  })
})

describe('the changelog and the version move together (CONTRIBUTING.md rule 4)', () => {
  const changelog = readFileSync(join(REPO, 'CHANGELOG.md'), 'utf-8')
  const sections = [...changelog.matchAll(/^## v(\d+\.\d+\.\d+) \((\d{4}-\d{2}-\d{2})\)$/gm)].map((m) => ({ version: m[1], date: m[2] }))
  const top = sections[0]
  const versionTs = readFileSync(join(WEB, 'src', 'engine', 'version.ts'), 'utf-8')
  const appVersion = /^export const APP_VERSION = '([^']*)'$/m.exec(versionTs)?.[1]
  const repo = /^export const REPO = '([^']*)'$/m.exec(versionTs)?.[1]

  it('sections are well formed, newest first, each with 1 to 10 one-line bullets of at most 80 characters', () => {
    expect(changelog.startsWith('# Changelog\n')).toBe(true)
    expect(sections.length).toBeGreaterThan(0)
    expect((changelog.match(/^## /gm) ?? []).length).toBe(sections.length)
    for (const line of changelog.split('\n')) {
      if (line.startsWith('- ')) expect(line.length - 2, line).toBeLessThanOrEqual(80)
      else if (line.trim()) expect(line.startsWith('#'), `prose or a wrapped bullet: ${line}`).toBe(true)
    }
    for (const part of changelog.split(/^## /m).slice(1)) {
      const bullets = part.split('\n').filter((l) => l.startsWith('- ')).length
      expect(bullets).toBeGreaterThan(0)
      expect(bullets).toBeLessThanOrEqual(10)
    }
  })
  it('the top section is the app version, in version.ts, package.json and its lock, and CITATION.cff', () => {
    expect(appVersion).toBe(top.version)
    const pkg = JSON.parse(readFileSync(join(WEB, 'package.json'), 'utf-8')) as { version: string }
    expect(pkg.version).toBe(top.version)
    const lock = JSON.parse(readFileSync(join(WEB, 'package-lock.json'), 'utf-8')) as { version: string; packages: Record<string, { version?: string }> }
    expect([lock.version, lock.packages[''].version]).toEqual([top.version, top.version])
    const cff = readFileSync(join(REPO, 'CITATION.cff'), 'utf-8')
    expect(cff).toMatch(new RegExp(`^version: ${top.version.replace(/\./g, '\\.')}$`, 'm'))
    expect(cff).toContain(`date-released: ${top.date}`)
    expect(cff).toContain(`repository-code: "https://github.com/${repo}"`)
  })
  it('the version is written in version.ts only', () => {
    const bad = walk(['.ts', '.js'], join(WEB, 'src')).filter((p) => !p.endsWith(join('engine', 'version.ts'))
      && readFileSync(p, 'utf-8').includes(`'${appVersion}'`)).map(rel)
    expect(bad).toEqual([])
  })
})

describe('the page loads nothing from other sites (CONTRIBUTING.md rule 7)', () => {
  const page = join(WEB, 'page')
  it("every url() in the stylesheet is a file of the page, and it imports nothing", () => {
    const css = readFileSync(join(page, 'warm.css'), 'utf-8')
    const bad: string[] = []
    for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      const u = m[1]
      if (u.startsWith('data:')) continue
      if (/^[a-z]+:|^\/\//i.test(u) || u.startsWith('/') || !existsSync(resolve(dirname(join(page, 'warm.css')), u.split(/[?#]/)[0]))) bad.push(u)
    }
    expect(bad).toEqual([])
    expect(css).not.toContain('@import')
  })
  it('the page and the code load no script, style or font from another site', () => {
    const html = readFileSync(join(WEB, 'index.html'), 'utf-8')
    expect(html).not.toMatch(/(src|href)="(https?:)?\/\//)
    const site = readFileSync(join(WEB, 'site.ts'), 'utf-8')
    expect(site).not.toMatch(/<(script|link)[^>]+(src|href)="https?:/)
    const fetches = walk(['.ts'], join(WEB, 'src')).filter((p) => /fetch\(\s*['"`]https?:|import\(\s*['"`]https?:/.test(readFileSync(p, 'utf-8')))
    expect(fetches.map(rel)).toEqual([])
  })
  it('the fonts are WOFF2 files, with their licenses', () => {
    const fonts = walk(['.woff2'], page)
    expect(fonts.length).toBe(4)
    for (const f of fonts) expect(readFileSync(f).subarray(0, 4).toString('latin1'), rel(f)).toBe('wOF2')
    for (const f of readdirSync(join(page, 'fonts')).filter((n) => n.startsWith('OFL-'))) {
      expect(readFileSync(join(page, 'fonts', f), 'utf-8').toUpperCase()).toContain('OPEN FONT LICENSE')
    }
    const notices = readFileSync(join(page, 'licenses.txt'), 'utf-8')
    for (const family of ['Instrument Sans', 'Space Grotesk']) expect(notices).toContain(family)
  })
  it('THIRD_PARTY_NOTICES.md carries the notices the site serves (page/licenses.txt)', () => {
    const md = readFileSync(join(REPO, 'THIRD_PARTY_NOTICES.md'), 'utf-8')
    const fenced = /```text\n([\s\S]*?)```/.exec(md)?.[1]
    expect(fenced).toBe(readFileSync(join(page, 'licenses.txt'), 'utf-8'))
  })
})

// --- the public repository -------------------------------------------------------------------------

function git(args: string[]): string | null {
  const r = spawnSync('git', args, { cwd: REPO, encoding: 'utf-8', maxBuffer: 1 << 28 })
  return r.status === 0 ? r.stdout : null
}

const inGit = git(['rev-parse', '--is-inside-work-tree'])?.trim() === 'true'
const BINARY = new Set(['.png', '.ico', '.woff2', '.pdf', '.xlsx'])

/** The public files and their text: the tracked ones, and the new ones a commit would take. */
function publicTexts(): [string, string][] {
  const files = (git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']) ?? '').split('\0').filter(Boolean)
  const out: [string, string][] = []
  for (const path of files) {
    if (LOCAL_ONLY.some((l) => path === l || path.startsWith(l))) continue
    const full = join(REPO, path)
    if (!existsSync(full) || BINARY.has(extname(path).toLowerCase()) || full === SELF) continue
    out.push([path, readFileSync(full, 'utf-8')])
  }
  return out
}

describe.skipIf(!inGit)('the public repository (CONTRIBUTING.md rule 8)', () => {
  const texts = publicTexts()
  const AI = [tool, piece('anthro', 'pic'), piece('chat', 'gpt'), piece('open', 'ai'), piece('co', 'pilot'),
    piece('co', 'dex'), piece('gem', 'ini'), piece('co-author', 'ed-by'), piece('agents', '.md')]

  it('no file names an AI tool or vendor, or carries a co-author line', () => {
    const hits = texts.flatMap(([path, text]) => AI.filter((n) => text.toLowerCase().includes(n)).map((n) => `${path}: ${n}`))
    expect(hits).toEqual([])
  })
  it('no commit message names one, and the local files are not tracked', () => {
    const messages = (git(['log', '--format=%B%x00']) ?? '').split('\0')
    const hits = messages.flatMap((m) => AI.filter((n) => m.toLowerCase().includes(n)).map((n) => `${n}: ${m.trim().split('\n')[0]}`))
    expect(hits).toEqual([])
    const tracked = (git(['ls-files', '-z']) ?? '').split('\0').filter(Boolean)
    expect(tracked.filter((p) => LOCAL_ONLY.some((l) => p === l || p.startsWith(l)))).toEqual([])
  })
  it("no email address, and no path on a person's machine", () => {
    const email = /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,24}(?![A-Za-z0-9-])/
    const machine = new RegExp(`${piece('C', ':')}[\\\\/]+${piece('Us', 'ers')}\\b|${piece('D', ':')}[\\\\/]+${piece('Co', 'de')}\\b`, 'i')
    const hits = texts.flatMap(([path, text]) => [text.includes('@') ? email.exec(text)?.[0] : undefined, machine.exec(text)?.[0]]
      .filter((x): x is string => x !== undefined).map((x) => `${path}: ${x}`))
    expect(hits).toEqual([])
  })
})
