// Resaca Reference Condition Model (RRCM): USACE Galveston District. 2017. Resaca Reference Condition
// Model Documentation, Brownsville Resaca Ecosystem Restoration Study. As WARM 1.x computes it (the
// ERDC technical note's test reproduces the model's published spreadsheet): four categories, bank
// condition, vegetation, invasives and water, each scored 0 to 1, averaged into the Resaca Reference
// Condition Index (RRCI). The model approval plan of 2016 differs on two points (docs/changes-from-1x.md).
import { linear } from '../interp'
import { type Variable } from '../variables'

export type ResacaHabitat = 'TERF' | 'STPW' | 'TESES'

/** The three habitats and the number of plant species at their reference sites. */
export const RESACA_HABITATS: readonly { value: ResacaHabitat; label: string; reference: number }[] = [
  { value: 'TERF', label: 'Texas ebony resaca forest', reference: 24 },
  { value: 'STPW', label: 'Subtropical Texas palmetto woodland', reference: 18 },
  { value: 'TESES', label: 'Texas ebony and snake-eyes shrubland', reference: 20 },
]

export const RESACA_REGIMES = [
  { value: 'permanent', label: 'Permanent and connected', si: 1 },
  { value: 'semipermanent', label: 'Semipermanent and disconnected', si: 0.5 },
  { value: 'dry', label: 'Dry (sedimented in or dry much of the year)', si: 0 },
] as const

/** The bank slope's index: 0.0667 per unit of run below 1:15, and 1.0 at 1:15 or flatter. */
export const slopeSI = (run: number): number => (run < 15 ? 0.0667 * run : 1)

export const RESACA_VARIABLES: readonly Variable[] = [
  { id: 'slope', code: 'Slope', label: 'Bank slope, as 1:X (enter the X)', unit: '1:X', min: 0, max: 1000,
    curve: { kind: 'fn', f: (x) => slopeSI(x), domain: [0, 20] }, help: 'A vertical bulkhead is 0. Slopes of 1:15 or flatter score 1.0.' },
  { id: 'bank', code: 'Bank canopy', label: 'Bank canopy cover', unit: '%', min: 0, max: 100, curve: linear([0, 0], [75, 1], [100, 1]) },
  { id: 'ripcan', code: 'Riparian canopy', label: 'Riparian canopy cover', unit: '%', min: 0, max: 100, curve: linear([0, 0], [85, 1], [100, 1]) },
  { id: 'aqcan', code: 'Aquatic canopy', label: 'Aquatic canopy cover (emergent and aquatic plants)', unit: '%', min: 0, max: 100, curve: linear([0, 0], [60, 1], [100, 1]) },
  { id: 'invasives', code: 'Invasives', label: 'Invasive share of the plant community', unit: '%', min: 0, max: 100, curve: linear([0, 1], [100, 0]) },
  { id: 'regime', code: 'Water regime', label: 'Water regime', categories: RESACA_REGIMES.map((r) => ({ value: r.value, label: r.label, si: r.si })) },
  { id: 'depth', code: 'Depth', label: 'Mean maximum water depth', unit: 'ft', min: 0, max: 100, curve: linear([0, 0], [5, 1]) },
]

export interface ResacaInputs {
  habitat: ResacaHabitat
  slope: number
  bank: number
  /** the sum of the present species' suitability indices (SSI) for the habitat */
  ssiSum: number
  /** the number of plant species present */
  present: number
  ripcan: number
  aqcan: number
  invasives: number
  /** the water regime's index */
  regime: number
  depth: number
}

export interface ResacaResult {
  slope: number
  bank: number
  bankCondition: number
  composition: number
  richness: number
  ripcan: number
  aqcan: number
  vegetation: number
  invasives: number
  regime: number
  depth: number
  water: number
  rrci: number
}

/** Species composition and richness: at or below the reference richness, both are over the reference
 * count; above it, composition is over the species present and richness is 1. */
export function resacaSpecies(habitat: ResacaHabitat, ssiSum: number, present: number): { composition: number; richness: number } {
  const n = RESACA_HABITATS.find((h) => h.value === habitat)!.reference
  return present <= n ? { composition: ssiSum / n, richness: present / n } : { composition: ssiSum / present, richness: 1 }
}

export function resaca(x: ResacaInputs): ResacaResult {
  const slope = slopeSI(x.slope)
  const bank = x.bank > 75 ? 1 : x.bank / 75
  const { composition, richness } = resacaSpecies(x.habitat, x.ssiSum, x.present)
  const ripcan = x.ripcan > 85 ? 1 : x.ripcan / 85
  const aqcan = x.aqcan > 60 ? 1 : x.aqcan / 60
  const invasives = 1 - (x.invasives / 100)
  const depth = x.depth < 5 ? x.depth / 5 : 1
  const bankCondition = (slope + bank) / 2
  const vegetation = (composition + richness + ripcan + aqcan) / 4
  const water = (x.regime + depth) / 2
  return {
    slope, bank, bankCondition, composition, richness, ripcan, aqcan, vegetation, invasives,
    regime: x.regime, depth, water, rrci: (bankCondition + vegetation + invasives + water) / 4,
  }
}
