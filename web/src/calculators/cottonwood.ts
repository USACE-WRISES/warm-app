import { cottonwood, cottonwoodStage, COTTONWOOD_MATURE, COTTONWOOD_YOUNG } from '../engine/models/cottonwood'
import { si, type Variable } from '../engine/variables'
import { SOURCES } from './sources'
import { type CalcSpec, type FieldGroup, parseNumber, type Raw } from './types'

const AGE: Variable = { id: 'age', code: 'Age', label: 'Stand age', unit: 'years', min: 0, max: 1000,
  help: 'Over 25 years is a mature stand; 2 to 25 years a young stand. Stands under 2 years score 0.' }

const LABELS: Record<string, string> = {
  LCPI: 'Land capability potential index', DEPTHGW: 'Depth to groundwater', RICHNATIVE: 'Native species richness',
  CVALUE: 'Mean coefficient of conservatism (mean C)', WIS: 'Wetland indicator score', CANHERB: 'Herbaceous canopy cover',
  CANSHRUB: 'Shrub canopy cover', ADJLANDUSE: 'Adjacent land use (natural, pasture, farmed, urban)', PATCHSIZE: 'Patch size',
  DISPATCH: 'Distance to the nearest patch', PROPCTW: 'Level of cottonwood dominance', RECRUIT: 'Level of recruitment',
  INTERSPERS: 'Relative interspersion of habitats',
}
const ORDER = ['LCPI', 'DEPTHGW', 'RICHNATIVE', 'CVALUE', 'WIS', 'CANHERB', 'CANSHRUB', 'ADJLANDUSE', 'PATCHSIZE', 'DISPATCH', 'PROPCTW', 'RECRUIT', 'INTERSPERS']
const ALL = ORDER.map((id) => si(id, LABELS[id]))
const pick = (ids: readonly string[], from: readonly string[]) => ids.filter((id) => from.includes(id)).map((id) => ALL.find((v) => v.id === id)!)

export const COTTONWOOD: CalcSpec = {
  id: 'cottonwood',
  modelId: 'cottonwood',
  name: 'Cottonwood Missouri',
  title: 'Community-Based Ecosystem Response Model for the Cottonwood Riparian Forests of the Missouri River',
  purpose: 'Ecosystem benefits for cottonwood riparian forests along the Missouri River, scored at the community scale.',
  region: 'West, Midwest and Southeast',
  returns: 'Ecosystem response index (ERI)',
  inputStyle: 'Suitability indices (0 to 1)',
  citations: [SOURCES.cottonwood],
  method: [
    'Mature stands (over 25 years): Hydrology = (LCPI + DEPTHGW) / 2; Biota = (RICHNATIVE + CVALUE + WIS) / 3',
    'Young stands (2 to 25 years): Hydrology = LCPI; Biota = [(RICHNATIVE + CVALUE + WIS) / 3 + (CANHERB + CANSHRUB) / 2] / 2',
    'Spatial = [(PATCHSIZE + DISPATCH) / 2 x PROPCTW + ADJLANDUSE + RECRUIT + INTERSPERS] / 4',
    'ERI = (3 x Hydrology + Biota + Spatial) / 5; stands under 2 years score 0',
  ],
  variables: [AGE, ...ALL],
  groups(raw: Raw): FieldGroup[] {
    const setup: FieldGroup = { id: 'setup', title: 'Stand', setup: true, fields: [AGE] }
    const age = parseNumber(raw.age ?? '')
    if (age === null || age < 0) return [setup]
    const stage = cottonwoodStage(age)
    if (stage === 'establishing') return [setup]
    const ids = stage === 'mature' ? COTTONWOOD_MATURE : COTTONWOOD_YOUNG
    return [
      setup,
      { id: 'hydro', title: 'Hydrology', fields: pick(['LCPI', 'DEPTHGW'], ids) },
      { id: 'biota', title: 'Biota', fields: pick(['RICHNATIVE', 'CVALUE', 'WIS', 'CANHERB', 'CANSHRUB'], ids) },
      { id: 'spatial', title: 'Spatial', fields: pick(['ADJLANDUSE', 'PATCHSIZE', 'DISPATCH', 'PROPCTW', 'RECRUIT', 'INTERSPERS'], ids) },
    ]
  },
  compute(v) {
    const r = cottonwood(v.age as number, v as Record<string, number>)
    const stage = r.stage === 'mature' ? 'Mature stand (over 25 years)' : r.stage === 'young' ? 'Young stand (2 to 25 years)' : 'Stand under 2 years: the index is 0'
    return { values: { eri: r.eri, hydro: r.hydro, biota: r.biota, spatial: r.spatial }, notes: [stage] }
  },
  outputs: [
    { id: 'eri', label: 'Ecosystem response index (ERI)', primary: true, index: true },
    { id: 'hydro', label: 'Hydrology', index: true },
    { id: 'biota', label: 'Biota', index: true },
    { id: 'spatial', label: 'Spatial', index: true },
  ],
  example: {
    raw: { age: '30', LCPI: '0.6', DEPTHGW: '0.8', RICHNATIVE: '0.3', CVALUE: '0.6', WIS: '0.1', CANHERB: '0.2', CANSHRUB: '0.7',
      ADJLANDUSE: '0.3', PATCHSIZE: '0.9', DISPATCH: '1', PROPCTW: '0.6', RECRUIT: '0.6', INTERSPERS: '0.6' },
    note: 'The ERDC technical note\'s test case (Table 2): ERI 0.59.',
  },
  notice: "Enter each variable's suitability index (0 to 1), read from the model's curves for the measured value.",
}
