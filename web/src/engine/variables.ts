// A model's input variable: what it measures, its units and limits, and how it maps to a suitability
// index (a curve for a measurement, a list of categories for a class, or nothing when the input is
// itself a suitability index). The calculators' forms and grids are built from these.
import { type Curve, evaluate } from './interp'

export interface Category {
  readonly value: string
  readonly label: string
  /** the suitability index the category scores */
  readonly si: number
  /** more words, shown with the choice */
  readonly note?: string
  /** other names a pasted or imported value may use (the Shiny app's labels) */
  readonly aliases?: readonly string[]
}

export interface Variable {
  /** the key in a site's inputs */
  readonly id: string
  /** the model's own name for it (DEPTHGW, V1, SIV5) */
  readonly code?: string
  /** what it measures, in plain words */
  readonly label: string
  /** the unit shown with the field ('%', 'm', 'SI 0-1') */
  readonly unit?: string
  readonly min?: number
  readonly max?: number
  /** a whole number (counts) */
  readonly integer?: boolean
  /** how a measurement maps to a suitability index */
  readonly curve?: Curve
  /** the classes to choose from */
  readonly categories?: readonly Category[]
  /** guidance shown under the field */
  readonly help?: string
  /** where the source document defines it */
  readonly source?: string
  /** not needed for the main result (an area for habitat units) */
  readonly optional?: boolean
}

/** A suitability-index input: 0 to 1, entered as is. */
export const si = (id: string, label: string, extra: Partial<Variable> = {}): Variable =>
  ({ id, code: id, label, unit: 'SI 0-1', min: 0, max: 1, ...extra })

/** The suitability index a variable gives for a measurement or a category (null when it has none). */
export function suitability(v: Variable, value: number | string): number | null {
  if (v.categories) return v.categories.find((c) => c.value === value)?.si ?? null
  if (typeof value !== 'number') return null
  if (v.curve) return evaluate(v.curve, value)
  return null
}
