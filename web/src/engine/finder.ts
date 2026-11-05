// Model Comparison: rank the 14 riparian models against a project's criteria, or search them by
// keyword. The criteria score is the Shiny app's (app.R 1671-1769), point for point and with its order of
// ties, which reproduces the ERDC technical note's Figure 1; keyword search counts the fields that
// contain the keyword (plain text, not case-sensitive) and lists the best matches first.
import { MODEL_COLUMNS, MODEL_TABLE } from './data'

export const REGIONS = ['Varying', 'Southwest', 'Southeast', 'Northwest', 'Northeast', 'Midwest', 'Mid-Atlantic', 'South Central'] as const
export const MODEL_TYPES = ['Analytical', 'Conceptual', 'Index', 'Spatial'] as const
export const INSTREAM_PROCESSES = ['Adjacent Land Use', 'Climate and Weather'] as const
export const RIPARIAN_PROCESSES = ['Bank Characteristics', 'Habitat Connectivity', 'Stream Habitat', 'Canopy/Ground Cover',
  'Native/Invasive Species', 'Vegetation Composition', 'Species Richness', 'Riparian Functions', 'Floodplain Functions',
  'Climate and Weather'] as const
/** The metric columns: how many of each kind of metric a model has. */
export const METRIC_COLUMNS = ['Adjacent Land Use', 'Climate and Weather', 'Bank Characteristics', 'Habitat Connectivity',
  'Stream Habitat', 'Canopy/Ground Cover', 'Native/Invasive Species', 'Vegetation Composition', 'Species Richness',
  'Riparian Functions', 'Floodplain Functions', 'Landscape Connectivity', 'Buffer Functionality'] as const

export interface RiparianModel {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly region: string
  readonly type: string
  readonly scope: string
  readonly review: string
  readonly structure: string
  /** the number of metrics of each kind (absent when none) */
  readonly metrics: Readonly<Record<string, number>>
  /** every field as the table has it */
  readonly fields: Readonly<Record<string, string>>
}

export const MODELS: readonly RiparianModel[] = MODEL_TABLE.map((r) => ({
  id: r.ID,
  name: r.Model,
  description: r['General Description'],
  region: r['Region of Application'],
  type: r['Model Type'],
  scope: r['Geographic Scope'],
  review: r['Degree of model review'],
  structure: r['Numerical Structure'],
  metrics: Object.fromEntries(METRIC_COLUMNS.filter((c) => r[c].trim() !== '').map((c) => [c, Number(r[c])])),
  fields: r,
}))

export interface Criteria {
  /** a region, or '' for none */
  readonly region: string
  /** a model type, or '' for none */
  readonly type: string
  readonly instream: readonly string[]
  readonly riparian: readonly string[]
}

export const NO_CRITERIA: Criteria = { region: '', type: '', instream: [], riparian: [] }

export function hasCriteria(c: Criteria): boolean {
  return c.region !== '' || c.type !== '' || c.instream.length > 0 || c.riparian.length > 0
}

export interface Score {
  readonly value: number
  /** what earned points: 'region', 'type' and the process names */
  readonly matched: readonly string[]
}

/** A model's criteria score (the Shiny app's points: region, model type, and 1 for each process the
 * model has metrics for, 1.5 when it has more than one). */
export function score(m: RiparianModel, c: Criteria): Score {
  let value = 0
  const matched: string[] = []
  const reg = m.region
  if (c.region) {
    const before = value
    if (c.region === 'Varying') {
      if (reg === 'Varying' || reg.includes('/')) value += 0.5
      if (reg === 'Varying') value += 1
    } else if (reg === 'Varying') {
      value += 0.25
    } else if (reg.includes('/')) {
      for (const t of reg.split('/')) if (t === c.region) value += 1
    } else if (reg === c.region) {
      value += 1
    }
    if (value > before) matched.push('region')
  }
  if (c.type) {
    const before = value
    if (m.type.includes('/')) {
      for (const t of m.type.split('/')) if (t === c.type) value += 1
    } else if (m.type === c.type) {
      value += 1
    }
    if (value > before) matched.push('type')
  }
  for (const group of [c.instream, c.riparian]) {
    for (const p of group) {
      const n = m.metrics[p]
      if (n === undefined) continue
      value += n > 1 ? 1.5 : 1
      if (!matched.includes(p)) matched.push(p)
    }
  }
  return { value, matched }
}

export interface Ranked { readonly model: RiparianModel; readonly score: Score; readonly hits: number }

/** The Shiny app's order: highest score first; models with the same score in the reverse of the table's
 * order (it sorted ascending, stably, and listed from the end). */
export function rankByCriteria(models: readonly RiparianModel[], c: Criteria): RiparianModel[] {
  const scored = models.map((m, i) => ({ m, i, v: score(m, c).value }))
  scored.sort((a, b) => a.v - b.v || a.i - b.i)
  return scored.reverse().map((s) => s.m)
}

/** The number of a model's fields (the table's columns but its ID) that contain the keyword. */
export function keywordHits(m: RiparianModel, keyword: string): number {
  const k = keyword.trim().toLowerCase()
  if (!k) return 0
  let hits = 0
  for (const col of MODEL_COLUMNS) {
    if (col === 'ID') continue
    if ((m.fields[col] ?? '').toLowerCase().includes(k)) hits++
  }
  return hits
}

/** The models for the criteria and keyword: with a keyword, only the models that contain it; with
 * criteria, ranked by score (the Shiny app's order); with a keyword alone, most matching fields first;
 * with neither, the table's order. */
export function findModels(c: Criteria, keyword: string, models: readonly RiparianModel[] = MODELS): Ranked[] {
  const k = keyword.trim()
  const pool = k ? models.filter((m) => keywordHits(m, k) > 0) : [...models]
  let ordered: RiparianModel[]
  if (hasCriteria(c)) {
    ordered = rankByCriteria(pool, c)
  } else if (k) {
    ordered = pool.map((m, i) => ({ m, i, h: keywordHits(m, k) })).sort((a, b) => b.h - a.h || a.i - b.i).map((x) => x.m)
  } else {
    ordered = pool
  }
  return ordered.map((model) => ({ model, score: score(model, c), hits: k ? keywordHits(model, k) : 0 }))
}
