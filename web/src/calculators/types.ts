// A calculator: one model's inputs, how they group on the page, how a site's values are checked, and
// what the model returns. Every calculator page, form and many-sites grid is built from one of these
// (src/views/calculator.ts), so all nine look and work alike.
import { suitability, type Category, type Variable } from '../engine/variables'

/** A site's inputs as typed or pasted, by variable id. */
export type Raw = Record<string, string>
/** A site's checked values: numbers, or category values. */
export type Parsed = Record<string, number | string>

export interface FieldGroup {
  readonly id: string
  readonly title: string
  readonly note?: string
  readonly fields: readonly Variable[]
  /** the model's setup choice (cover type, species), shown first with the site's name */
  readonly setup?: boolean
  /** an input of the whole site (its area), shown with the site's name rather than as a group */
  readonly site?: boolean
}

export interface OutputSpec {
  readonly id: string
  readonly label: string
  /** the calculator's main result: shown large, with a meter */
  readonly primary?: boolean
  /** decimals shown (3 by default) */
  readonly digits?: number
  /** a 0 to 1 index: drawn with a bar */
  readonly index?: boolean
  /** results listed together under a heading (Chatfield's variable scores) */
  readonly section?: string
}

export interface Computed {
  /** each output's value; null where it does not apply (habitat units without an area) */
  readonly values: Readonly<Record<string, number | null>>
  /** words shown with the result: the equation used, the stand's stage */
  readonly notes?: readonly string[]
}

export interface CalcSpec {
  readonly id: string
  /** the model's ID in the model table (web/data/models.csv) */
  readonly modelId: string
  /** the short name in menus and cards */
  readonly name: string
  /** the model's full title */
  readonly title: string
  readonly purpose: string
  readonly region: string
  /** what it returns, in a few words */
  readonly returns: string
  /** how the inputs are entered */
  readonly inputStyle: string
  readonly citations: readonly { readonly text: string; readonly url?: string }[]
  /** "How it's calculated": one line each */
  readonly method: readonly string[]
  /** every input a site can have, in the many-sites grid's order */
  readonly variables: readonly Variable[]
  /** the groups shown for a site's current values (the setup choice first) */
  groups(raw: Raw): FieldGroup[]
  /** the results, given every shown input checked and valid */
  compute(v: Parsed): Computed
  readonly outputs: readonly OutputSpec[]
  /** in the many-sites grid, an input chosen once for the whole grid (Lower Willamette's species) */
  readonly gridSetup?: string
  /** a worked example to load (from the ERDC technical note or the source report) */
  readonly example?: { readonly raw: Raw; readonly note: string }
  /** a note about the calculator shown under its title */
  readonly notice?: string
  /** Resaca: the species composition table feeds two of the inputs in the one-site form */
  readonly speciesTable?: boolean
}

export interface Evaluation {
  readonly groups: FieldGroup[]
  readonly fields: Variable[]
  readonly parsed: Parsed
  readonly errors: Readonly<Record<string, string>>
  /** required inputs not yet filled in, in page order */
  readonly missing: string[]
  /** the suitability index each measured or classed input gives */
  readonly si: Readonly<Record<string, number>>
  readonly result: Computed | null
}

/** A number as people type it: thousands commas, a trailing percent sign and spaces allowed. */
export function parseNumber(text: string): number | null {
  let t = text.trim().replace(/%$/, '').trim()
  if (/^[-+]?\d{1,3}(,\d{3})+(\.\d*)?$/.test(t)) t = t.replace(/,/g, '')
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/** The category a typed or pasted value names: its value, label or an alias, or a label's unique start. */
export function matchCategory(categories: readonly Category[], text: string): Category | undefined {
  const t = norm(text)
  if (!t) return undefined
  const exact = categories.find((c) => norm(c.value) === t || norm(c.label) === t || (c.aliases ?? []).some((a) => norm(a) === t))
  if (exact) return exact
  const starts = categories.filter((c) => norm(c.label).startsWith(t))
  return starts.length === 1 ? starts[0] : undefined
}

/** The range a number input takes, in words. */
export function rangeText(v: Variable): string {
  if (v.min !== undefined && v.max !== undefined) return `from ${v.min} to ${v.max}`
  if (v.min !== undefined) return `of ${v.min} or more`
  if (v.max !== undefined) return `of ${v.max} or less`
  return ''
}

/** One input checked: its value, or what is wrong with it. */
export function parseValue(v: Variable, text: string): { value: number | string } | { error: string } {
  if (v.categories) {
    const c = matchCategory(v.categories, text)
    return c ? { value: c.value } : { error: `Choose one of: ${v.categories.map((x) => x.label).join(', ')}.` }
  }
  const n = parseNumber(text)
  const range = rangeText(v)
  if (n === null) return { error: `Enter a ${v.integer ? 'whole number' : 'number'}${range ? ` ${range}` : ''}.` }
  if (v.integer && !Number.isInteger(n)) return { error: `Enter a whole number${range ? ` ${range}` : ''}.` }
  if ((v.min !== undefined && n < v.min) || (v.max !== undefined && n > v.max)) return { error: `Enter a number ${range}.` }
  return { value: n }
}

/** A site checked and, when every shown input is valid, computed. */
export function evaluateSite(spec: CalcSpec, raw: Raw): Evaluation {
  const groups = spec.groups(raw)
  const fields = groups.flatMap((g) => g.fields)
  const setup = new Set(groups.filter((g) => g.setup).flatMap((g) => g.fields.map((f) => f.id)))
  const parsed: Parsed = {}
  const errors: Record<string, string> = {}
  const missing: string[] = []
  const si: Record<string, number> = {}
  for (const f of fields) {
    const text = (raw[f.id] ?? '').trim()
    if (!text) {
      if (!f.optional) missing.push(f.id)
      continue
    }
    const r = parseValue(f, text)
    if ('error' in r) {
      errors[f.id] = r.error
      continue
    }
    parsed[f.id] = r.value
    const s = setup.has(f.id) ? null : suitability(f, r.value)
    if (s !== null) si[f.id] = s
  }
  const complete = missing.length === 0 && Object.keys(errors).length === 0
  return { groups, fields, parsed, errors, missing, si, result: complete ? spec.compute(parsed) : null }
}

/** The value of an input that is a category (its key), or undefined. */
export function categoryOf(spec: CalcSpec, id: string, raw: Raw): string | undefined {
  const v = spec.variables.find((x) => x.id === id)
  if (!v?.categories) return undefined
  return matchCategory(v.categories, raw[id] ?? '')?.value
}

/** A variable with a new id (one model's variables kept apart from another's in the same calculator). */
export function renamed(v: Variable, id: string, extra: Partial<Variable> = {}): Variable {
  return { ...v, id, ...extra }
}
