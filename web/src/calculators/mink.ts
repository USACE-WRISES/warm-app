import { MINK_ALLEN_VARIABLES, MINK_COVER_TYPES, MINK_LARGE_WETLAND_HA, MINK_MODIFIED_VARIABLES, minkAllen, minkAllenVariables,
  minkModified, type MinkCoverType } from '../engine/models/mink'
import type { Variable } from '../engine/variables'
import { SOURCES } from './sources'
import { type CalcSpec, categoryOf, type FieldGroup, parseNumber, type Raw, renamed } from './types'

const MODEL: Variable = {
  id: 'model', code: 'Model', label: 'Model and cover type',
  categories: [
    { value: 'modified', label: 'Modified riverine model', note: 'Devendorf and Yager 2013', si: 0 },
    ...MINK_COVER_TYPES.map((c) => ({ value: c.value, label: `Allen (1986): ${c.label.toLowerCase()}`, si: 0 })),
  ],
}
const MOD = MINK_MODIFIED_VARIABLES.map((v) => renamed(v, `mod.${v.id}`))
const ALLEN = MINK_ALLEN_VARIABLES.map((v) => renamed(v, `allen.${v.id}`, { code: `SI${v.id}` }))
const AREA: Variable = { id: 'allen.area', code: 'Area', label: 'Wetland area', unit: 'ha', min: 0, max: 1e9,
  help: `Wetlands of ${MINK_LARGE_WETLAND_HA} ha or more use the large-wetland cover equation.` }

export const MINK: CalcSpec = {
  id: 'mink',
  modelId: 'mink',
  name: 'Modified Mink',
  title: 'Modified Riverine HSI Model for Mink',
  purpose: 'Mink habitat in riverine and wetland cover types.',
  region: 'Varying',
  returns: 'HSI (the lower of water and cover)',
  inputStyle: 'Field measurements',
  citations: [SOURCES.minkModified, SOURCES.minkAllen],
  method: [
    'Each measurement becomes a suitability index (SI) through its curve.',
    'Modified riverine model: cover = (SIV5 x SIV6 x Vstream)^1/3; water = SIV1.',
    'Allen (1986), by cover type: riverine or lacustrine cover = (SIV5 x SIV6)^1/2; palustrine emergent cover = (4 x SIV4 + SIV5) / 5;',
    `palustrine forested or scrub-shrub cover = (min(1, SIV2 + SIV3 + SIV4) + SIV5) / 2 under ${MINK_LARGE_WETLAND_HA} ha, and min(1, SIV2 + SIV3 + SIV4) at ${MINK_LARGE_WETLAND_HA} ha or more; water = SIV1.`,
    'HSI = the lower of water and cover.',
  ],
  variables: [MODEL, ...MOD, AREA, ...ALLEN],
  gridSetup: 'model',
  groups(raw: Raw): FieldGroup[] {
    const setup: FieldGroup = { id: 'setup', title: 'Model', setup: true, fields: [MODEL] }
    const model = categoryOf(this, 'model', raw)
    if (!model) return [setup]
    if (model === 'modified') {
      return [setup, { id: 'water', title: 'Water', fields: [MOD[0]] }, { id: 'cover', title: 'Cover', fields: MOD.slice(1) }]
    }
    const area = parseNumber(raw['allen.area'] ?? '')
    const ids = minkAllenVariables(model as MinkCoverType, area)
    const pick = (list: string[]) => list.filter((id) => ids.includes(id)).map((id) => ALLEN.find((v) => v.id === `allen.${id}`)!)
    return [
      setup,
      ...(model === 'forested' ? [{ id: 'wetland', title: 'Wetland', site: true, fields: [AREA] }] : []),
      { id: 'water', title: 'Water', fields: pick(['V1']) },
      { id: 'cover', title: 'Cover', fields: pick(['V2', 'V3', 'V4', 'V5', 'V6']) },
    ]
  },
  compute(v) {
    if (v.model === 'modified') {
      const r = minkModified({ SIV1: v['mod.SIV1'] as number, SIV5: v['mod.SIV5'] as number, SIV6: v['mod.SIV6'] as number, Vstream: v['mod.Vstream'] as number })
      return { values: { hsi: r.hsi, cover: r.cover, water: r.water }, notes: ['Cover = (SIV5 x SIV6 x Vstream)^1/3'] }
    }
    const values: Record<string, number> = {}
    for (const id of ['V1', 'V2', 'V3', 'V4', 'V5', 'V6']) if (typeof v[`allen.${id}`] === 'number') values[id] = v[`allen.${id}`] as number
    const area = typeof v['allen.area'] === 'number' ? v['allen.area'] : null
    const r = minkAllen(v.model as MinkCoverType, area, values)
    return { values: { hsi: r.hsi, cover: r.cover, water: r.water }, notes: [r.equation] }
  },
  outputs: [
    { id: 'hsi', label: 'Habitat suitability index (HSI)', primary: true, index: true },
    { id: 'cover', label: 'Cover', index: true },
    { id: 'water', label: 'Water', index: true },
  ],
  example: {
    raw: { model: 'modified', 'mod.SIV1': '80', 'mod.SIV5': '65', 'mod.SIV6': '56', 'mod.Vstream': '0.7' },
    note: 'The ERDC technical note\'s test case (Table 2): cover 0.70, water 1, HSI 0.70.',
  },
}
