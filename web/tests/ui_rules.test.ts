// The rules every page keeps: color contrast (WCAG 2.1 AA) computed from the stylesheet's tokens, and
// the separation of the engine (arithmetic and data) from the page (CONTRIBUTING.md rule 6).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const WEB = fileURLToPath(new URL('..', import.meta.url))
const CSS = readFileSync(join(WEB, 'page', 'warm.css'), 'utf-8')
const TOKENS = new Map([...CSS.matchAll(/(--wa-[a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]))

function luminance(hex: string): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
function ratio(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (la + 0.05) / (lb + 0.05)
}
const tok = (name: string): string => (name.startsWith('--') ? TOKENS.get(name)! : name)

describe('contrast (WCAG 2.1 AA)', () => {
  it('the text colors on their backgrounds', () => {
    const pairs = [['--wa-text', '#ffffff'], ['--wa-text', '--wa-surface-soft'], ['--wa-text-muted', '#ffffff'], ['--wa-text-muted', '--wa-surface-soft'],
      ['--wa-text-strong', '--wa-surface-soft'], ['--wa-accent', '#ffffff'], ['--wa-accent', '--wa-accent-soft'], ['--wa-accent-dark', '--wa-accent-soft'],
      ['#ffffff', '--wa-accent'], ['#ffffff', '--wa-accent-dark'], ['--wa-on-accent-dim', '--wa-accent-dark'], ['--wa-ok', '--wa-ok-soft'],
      ['--wa-warn', '--wa-warn-soft'], ['--wa-err', '--wa-err-soft'], ['--wa-err', '#ffffff']]
    for (const [fg, bg] of pairs) expect(ratio(tok(fg), tok(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
  })
  it('no text color in the stylesheet below AA on white', () => {
    for (const m of CSS.matchAll(/(?<![-\w])color:\s*var\((--wa-[a-z-]+)\)/g)) {
      const name = m[1]
      if (!TOKENS.has(name) || name === '--wa-on-accent-dim') continue
      expect(ratio(TOKENS.get(name)!, '#ffffff'), name).toBeGreaterThanOrEqual(4.5)
    }
  })
})

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : []
  })
}

describe('the layers', () => {
  it('the engine never imports the calculators or the page', () => {
    const hits = files(join(WEB, 'src', 'engine')).filter((p) => /from '\.\.\/(\.\.\/)?(views|lib|calculators)\//.test(readFileSync(p, 'utf-8')))
    expect(hits.map((p) => relative(WEB, p))).toEqual([])
  })
  it('the calculators never import the page', () => {
    const hits = files(join(WEB, 'src', 'calculators')).filter((p) => /from '\.\.\/(views|lib)\//.test(readFileSync(p, 'utf-8')))
    expect(hits.map((p) => relative(WEB, p))).toEqual([])
  })
})
