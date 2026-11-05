// Sites to and from tables: the CSV and clipboard tables a calculator writes, and reading sites back
// from a CSV (a WARM table, or a spreadsheet whose columns use the codes or labels).
import { calculator } from '../calculators'
import { withSpeciesTotals } from '../calculators/resaca'
import { type CalcSpec, evaluateSite, matchCategory, type Raw } from '../calculators/types'
import { parseCsvRecords, toCsv } from '../engine/csv'
import { APP_VERSION } from '../engine/version'
import type { Variable } from '../engine/variables'
import { full } from '../lib/format'

/** A column's heading: the label, the model's code in brackets, the unit in parentheses. */
export function heading(v: Variable): string {
  return `${v.label}${v.code && v.code !== v.label ? ` [${v.code}]` : ''}${v.unit ? ` (${v.unit})` : ''}`
}

/** What a site's inputs are once its species table (Resaca) has been summed. */
export const forEvaluation = (spec: CalcSpec, raw: Raw): Raw => (spec.speciesTable ? withSpeciesTotals(raw) : raw)

/** The table of sites: a row per site with its inputs, the suitability index of each measured or
 * classed input, and the results. */
export function sitesTable(spec: CalcSpec, sites: readonly Raw[], columns: readonly Variable[]): (string | number)[][] {
  const evs = sites.map((r) => evaluateSite(spec, forEvaluation(spec, r)))
  const siCols = columns.filter((v) => (v.curve || v.categories) && evs.some((e) => e.si[v.id] !== undefined))
  const header = ['Site', ...columns.map(heading), ...siCols.map((v) => `SI [${v.code ?? v.id}]`), ...spec.outputs.map((o) => o.label)]
  const rows = sites.map((r, i) => {
    const e = evs[i]
    const input = (v: Variable) => {
      const text = (forEvaluation(spec, r)[v.id] ?? '').trim()
      if (v.categories) return matchCategory(v.categories, text)?.label ?? text
      return text
    }
    return [r.name ?? '', ...columns.map(input), ...siCols.map((v) => full(e.si[v.id])), ...spec.outputs.map((o) => full(e.result?.values[o.id]))]
  })
  return [header, ...rows]
}

export function sitesCsv(spec: CalcSpec, sites: readonly Raw[], columns: readonly Variable[]): string {
  return toCsv(sitesTable(spec, sites, columns))
}

/** Tab-separated, for pasting into a spreadsheet. */
export function sitesTsv(spec: CalcSpec, sites: readonly Raw[], columns: readonly Variable[]): string {
  return sitesTable(spec, sites, columns).map((r) => r.map((c) => String(c).replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n')
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/** The input a CSV column holds: by the code in brackets, the code, the id, or the label. */
function columnFor(header: string, columns: readonly Variable[]): Variable | undefined {
  const bracket = /\[([^\]]+)\]/.exec(header)?.[1]
  const h = norm(header.replace(/\s*\([^)]*\)\s*$/, ''))
  return columns.find((v) => (bracket && v.code && norm(v.code) === norm(bracket)) || (v.code && norm(v.code) === h) || norm(v.id) === h || norm(v.label) === h
    || norm(heading(v)) === norm(header))
}

export interface Imported { sites: Raw[]; used: string[]; ignored: string[] }

/** Sites read from a CSV: one per row; the columns WARM knows are kept, others ignored. */
export function importSites(text: string, columns: readonly Variable[]): Imported {
  const records = parseCsvRecords(text)
  if (!records.length) return { sites: [], used: [], ignored: [] }
  const headers = Object.keys(records[0])
  const map = new Map<string, string>()
  const used: string[] = []
  const ignored: string[] = []
  for (const hd of headers) {
    if (/^(site|name|site name)$/i.test(hd.trim())) {
      map.set(hd, 'name')
      continue
    }
    if (/^SI \[/.test(hd)) continue
    const v = columnFor(hd, columns)
    if (v) {
      map.set(hd, v.id)
      used.push(hd)
    } else {
      ignored.push(hd)
    }
  }
  const sites = records.map((r) => {
    const raw: Raw = {}
    for (const [hd, id] of map) if (r[hd]?.trim()) raw[id] = r[hd].trim()
    return raw
  }).filter((r) => Object.keys(r).length)
  return { sites, used, ignored }
}

/** A saved inputs file: what a calculator's sites were, to reopen later. */
export interface SavedFile { app: 'WARM'; version: string; calculator: string; sites: Raw[]; setup?: string }

export function savedFile(spec: CalcSpec, sites: Raw[], setup?: string): string {
  const file: SavedFile = { app: 'WARM', version: APP_VERSION, calculator: spec.id, sites, ...(setup ? { setup } : {}) }
  return JSON.stringify(file, null, 2)
}

export function readSaved(text: string): SavedFile | string {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return 'This is not a WARM inputs file (it is not JSON).'
  }
  const f = data as Partial<SavedFile>
  if (!f || f.app !== 'WARM' || typeof f.calculator !== 'string' || !Array.isArray(f.sites)) return 'This is not a WARM inputs file.'
  if (!calculator(f.calculator)) return `This file is for a calculator WARM does not have (${f.calculator}).`
  const sites = f.sites.filter((s): s is Raw => !!s && typeof s === 'object')
    .map((s) => Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v === 'string')) as Raw)
  return { app: 'WARM', version: String(f.version ?? ''), calculator: f.calculator, sites, setup: typeof f.setup === 'string' ? f.setup : undefined }
}
