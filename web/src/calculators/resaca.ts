import { RESACA_SPECIES, type ResacaSpecies } from '../engine/data'
import { resaca, RESACA_HABITATS, RESACA_REGIMES, RESACA_VARIABLES, type ResacaHabitat } from '../engine/models/resaca'
import type { Variable } from '../engine/variables'
import { SOURCES } from './sources'
import { type CalcSpec, categoryOf, type FieldGroup, parseNumber, type Raw } from './types'

const HABITAT: Variable = {
  id: 'habitat', code: 'Habitat', label: 'Habitat',
  categories: RESACA_HABITATS.map((h) => ({ value: h.value, label: h.label, si: 0, note: h.value,
    aliases: [h.value, { TERF: 'Texas Ebony Resaca Forest', STPW: 'Subtropical Texas Palmetto Woodland', TESES: 'Ebony/Snake-eyes Shrubland' }[h.value]] })),
}
const V = (id: string) => RESACA_VARIABLES.find((v) => v.id === id)!
const REGIME: Variable = { ...V('regime'), categories: V('regime').categories!.map((c, i) => ({ ...c,
  aliases: [['Permanent/Connected'], ['Semipermanent/Disconnected'], ['Dry']][i] })) }
const SSI_SUM: Variable = { id: 'ssiSum', code: 'Sum of SSI', label: 'Sum of the species suitability indices (SSI)', unit: 'SSI', min: 0, max: 1000,
  help: 'The SSIs of the species present, added up. Species off the reference list add 0.' }
const PRESENT: Variable = { id: 'present', code: 'Species present', label: 'Number of plant species present', unit: 'species', min: 1, max: 1000, integer: true,
  help: 'All plant species found at the site, on the reference list or not.' }

export const RESACA: CalcSpec = {
  id: 'resaca',
  modelId: 'resaca',
  name: 'Resaca',
  title: 'Resaca Reference Condition Model (RRCM)',
  purpose: 'Condition of resacas, former Rio Grande channels, in Cameron County, Texas.',
  region: 'Southwest',
  returns: 'Resaca reference condition index (RRCI)',
  inputStyle: 'Field measurements, classes and a species list',
  citations: [SOURCES.resaca],
  method: [
    'Bank condition = (slope index + bank canopy index) / 2; slope index = 0.0667 x X below 1:15, else 1; bank canopy index = cover / 75, at most 1.',
    'Vegetation = (composition + richness + riparian canopy + aquatic canopy) / 4; riparian canopy = cover / 85 and aquatic canopy = cover / 60, at most 1.',
    'Composition = sum of SSI / reference richness, and richness = species present / reference richness, while the species present are no more than the reference richness; above it, composition = sum of SSI / species present and richness = 1.',
    'Invasives = 1 - invasive share / 100. Water = (water regime + depth / 5, at most 1) / 2.',
    'RRCI = (Bank condition + Vegetation + Invasives + Water) / 4.',
  ],
  variables: [HABITAT, V('slope'), V('bank'), SSI_SUM, PRESENT, V('ripcan'), V('aqcan'), V('invasives'), REGIME, V('depth')],
  groups(raw: Raw): FieldGroup[] {
    const setup: FieldGroup = { id: 'setup', title: 'Habitat', setup: true, fields: [HABITAT] }
    if (!categoryOf(this, 'habitat', raw)) return [setup]
    return [
      setup,
      { id: 'bankCondition', title: 'Bank condition', fields: [V('slope'), V('bank')] },
      { id: 'vegetation', title: 'Vegetation', fields: [SSI_SUM, PRESENT, V('ripcan'), V('aqcan')] },
      { id: 'invasives', title: 'Invasive species', fields: [V('invasives')] },
      { id: 'water', title: 'Water', fields: [REGIME, V('depth')] },
    ]
  },
  compute(v) {
    const regime = RESACA_REGIMES.find((r) => r.value === v.regime)!.si
    const r = resaca({ habitat: v.habitat as ResacaHabitat, slope: v.slope as number, bank: v.bank as number, ssiSum: v.ssiSum as number,
      present: v.present as number, ripcan: v.ripcan as number, aqcan: v.aqcan as number, invasives: v.invasives as number, regime, depth: v.depth as number })
    return { values: { rrci: r.rrci, bankCondition: r.bankCondition, vegetation: r.vegetation, invasives: r.invasives, water: r.water,
      composition: r.composition, richness: r.richness } }
  },
  outputs: [
    { id: 'rrci', label: 'Resaca reference condition index (RRCI)', primary: true, index: true },
    { id: 'bankCondition', label: 'Bank condition', index: true },
    { id: 'vegetation', label: 'Vegetation', index: true },
    { id: 'invasives', label: 'Invasive species', index: true },
    { id: 'water', label: 'Water', index: true },
    { id: 'composition', label: 'Species composition', index: true, section: 'Vegetation parts' },
    { id: 'richness', label: 'Species richness', index: true, section: 'Vegetation parts' },
  ],
  speciesTable: true,
  example: {
    raw: { habitat: 'STPW', slope: '2', bank: '2', ripcan: '30', aqcan: '12', invasives: '38', regime: 'permanent', depth: '2',
      'sp.1.comp': '0.01', 'sp.1.ssi': '0', 'sp.2.comp': '2' },
    note: 'The ERDC technical note\'s test case (Table 2 and Figure 4): two species present, RRCI 0.39.',
  },
}

/** The species table's keys in a site's inputs: sp.<row>.comp and sp.<row>.ssi (rows from 0). */
export const speciesKey = (row: number, part: 'comp' | 'ssi') => `sp.${row}.${part}`

export interface SpeciesRow { readonly index: number; readonly species: ResacaSpecies; readonly range?: readonly [number, number] }

/** The species rows for a habitat: those on its reference list first, then the rest. */
export function speciesRows(habitat: ResacaHabitat | undefined): SpeciesRow[] {
  const rows = RESACA_SPECIES.map((species, index) => ({ index, species, range: habitat ? species.ranges[habitat] : undefined }))
  return [...rows.filter((r) => r.range), ...rows.filter((r) => !r.range)]
}

export interface SpeciesTotals {
  /** species with a composition above 0 */
  present: number
  /** the SSI of the present reference species, summed (null while one is missing or invalid) */
  ssiSum: number | null
  /** present reference species still without a valid SSI */
  needSsi: number[]
  /** rows whose composition or SSI is not a valid number */
  invalid: number[]
}

/** The species table summed into the model's two species inputs. A species off the habitat's reference
 * list counts toward richness with an SSI of 0. */
export function speciesTotals(raw: Raw, habitat: ResacaHabitat | undefined): SpeciesTotals {
  let present = 0
  let sum = 0
  const needSsi: number[] = []
  const invalid: number[] = []
  RESACA_SPECIES.forEach((sp, i) => {
    const compText = (raw[speciesKey(i, 'comp')] ?? '').trim()
    if (!compText) return
    const comp = parseNumber(compText)
    if (comp === null || comp < 0 || comp > 100) {
      invalid.push(i)
      return
    }
    if (comp <= 0) return
    present++
    if (!habitat || !sp.ranges[habitat]) return
    const ssiText = (raw[speciesKey(i, 'ssi')] ?? '').trim()
    const ssi = ssiText ? parseNumber(ssiText) : null
    if (!ssiText) needSsi.push(i)
    else if (ssi === null || ssi < 0 || ssi > 1) invalid.push(i)
    else sum += ssi
  })
  return { present, ssiSum: needSsi.length || invalid.length ? null : sum, needSsi, invalid }
}

/** Whether a site's species table has any composition entered. */
export function hasSpecies(raw: Raw): boolean {
  return Object.entries(raw).some(([k, v]) => /^sp\.\d+\.comp$/.test(k) && v.trim() !== '')
}

/** A site's inputs with the species table's totals written into its two species inputs (when the
 * table is in use; otherwise the two inputs are entered directly, as in the many-sites grid). */
export function withSpeciesTotals(raw: Raw): Raw {
  if (!hasSpecies(raw)) return raw
  const habitat = categoryOf(RESACA, 'habitat', raw) as ResacaHabitat | undefined
  const t = speciesTotals(raw, habitat)
  return { ...raw, present: t.present ? String(t.present) : '', ssiSum: t.ssiSum === null || !t.present ? '' : String(t.ssiSum) }
}

/** A site for the grid: the species table summed into the two inputs, and the table itself left out. */
export function withoutSpeciesTable(raw: Raw): Raw {
  return Object.fromEntries(Object.entries(withSpeciesTotals(raw)).filter(([k]) => !k.startsWith('sp.')))
}
