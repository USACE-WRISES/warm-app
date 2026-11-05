// Upper Mississippi River System Floodplain Forest Habitat Model: USACE. 2021. St. Paul, Rock Island
// and St. Louis Districts. Four measured variables (Figures 3 to 6) and a structural diversity score
// (the mean of five indicators, each 0 to 1 in steps of 0.2, page 16); the HSI is their mean and
// habitat units are HSI times the management area's acres.
import { evaluate, linear } from '../interp'
import type { Category, Variable } from '../variables'

const pct = (id: string, code: string, label: string, curve: ReturnType<typeof linear>, source: string, help?: string): Variable =>
  ({ id, code, label, unit: '%', min: 0, max: 100, curve, source, help })

export const UMRS_VARIABLES: readonly Variable[] = [
  // fix: WARM 1.x scored 0.8 + 0.8x at 90 percent and above
  pct('canopy', 'V1', 'Canopy cover', linear([0, 0], [20, 0.1], [40, 0.4], [70, 1], [80, 1], [90, 0.8], [100, 0.8]), 'Figure 3, p. 7',
    'Average over all the plots in the management area; unforested inclusions count as 0%, open water and marsh are left out.'),
  // fix: WARM 1.x used a slope of 0.15 between 40 and 60 percent
  pct('forest', 'V2', 'Desired forest type', linear([0, 0], [20, 0.1], [40, 0.3], [60, 0.6], [75, 0.8], [100, 1]), 'Figure 4, p. 8'),
  pct('invasive', 'V3', 'Invasive species cover', linear([0, 1], [10, 0.9], [20, 0.3], [40, 0.1], [50, 0.05], [75, 0.01], [100, 0]), 'Figure 5, p. 9',
    'Ground cover of invasive species that keep the forest from regenerating.'),
  { id: 'regen', code: 'V4', label: 'Regeneration, as a share of the desired stocking', unit: '%', min: 0, max: 1000,
    curve: linear([0, 0], [20, 0.1], [40, 0.5], [80, 0.9], [100, 1]), source: 'Figure 6, p. 10',
    help: 'Stocking above the target scores 1.0.' },
]

const STEPS: Category[] = [0, 0.2, 0.4, 0.6, 0.8, 1].map((x) => ({ value: String(x), label: x.toFixed(1), si: x }))

/** The five structural diversity indicators (V5 is their mean). */
export const UMRS_STRUCTURE: readonly Variable[] = [
  { id: 'horizontal', code: 'V5a', label: 'Horizontal structural diversity', categories: STEPS },
  { id: 'vertical', code: 'V5b', label: 'Vertical structural diversity', categories: STEPS },
  { id: 'sizeClass', code: 'V5c', label: 'Size class diversity', categories: STEPS },
  { id: 'deadWood', code: 'V5d', label: 'Standing dead wood', categories: STEPS },
  { id: 'species', code: 'V5e', label: 'Tree species diversity', categories: STEPS },
]

export interface UmrsResult { si: Record<string, number>; structure: number; hsi: number; hu: number | null }

/** v: the four measurements and the five indicator scores (numbers), by id. */
export function upperMississippi(v: Readonly<Record<string, number>>, area: number | null): UmrsResult {
  const si: Record<string, number> = {}
  for (const x of UMRS_VARIABLES) si[x.id] = evaluate(x.curve!, v[x.id])
  let s = 0
  for (const x of UMRS_STRUCTURE) s += v[x.id]
  const structure = s / 5
  const hsi = (si.canopy + si.forest + si.invasive + si.regen + structure) / 5
  return { si, structure, hsi, hu: area === null ? null : hsi * area }
}
