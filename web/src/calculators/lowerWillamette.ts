import { LW_SPECIES, lowerWillamette, lwSpecies } from '../engine/models/lowerWillamette'
import type { Variable } from '../engine/variables'
import { SOURCES } from './sources'
import { type CalcSpec, categoryOf, type FieldGroup, type Raw, renamed } from './types'

const SPECIES: Variable = {
  id: 'species', code: 'Species', label: 'Species or guild',
  categories: LW_SPECIES.map((s) => ({ value: s.id, label: s.name, si: 0 })),
}
const ACRES: Variable = { id: 'acres', code: 'Acres', label: 'Area', unit: 'acres', min: 0, max: 1e9, optional: true,
  help: 'Optional. Habitat units = HSI x acres.' }

/** Each species' variables, kept apart by a prefix (turtle.V1, beaver.V1). */
const SPECIES_VARS: Record<string, Variable[]> = Object.fromEntries(
  LW_SPECIES.map((s) => [s.id, s.variables.map((v) => renamed(v, `${s.id}.${v.id}`))]))

export const LOWER_WILLAMETTE: CalcSpec = {
  id: 'lower-willamette',
  modelId: 'lower-willamette',
  name: 'Lower Willamette',
  title: 'Lower Willamette River Ecosystem Restoration Project Model',
  purpose: 'Fish and wildlife habitat along the Lower Willamette River, Oregon.',
  region: 'Northwest',
  returns: 'HSI and habitat units, by species',
  inputStyle: 'Field measurements and classes',
  citations: [SOURCES.lowerWillamette],
  method: [
    'Each measured variable becomes a suitability index through the species\' curve (Section 4.8 of the documentation); a class takes its listed score.',
    'Each species\' HSI is the arithmetic mean of its suitability indices (Tables 4.3 to 4.9).',
    'Salmonids (tributaries): the temperature index is the mean of the prespawning adult and juvenile curves (page 34).',
    'Habitat units = HSI x acres.',
  ],
  variables: [SPECIES, ...LW_SPECIES.flatMap((s) => SPECIES_VARS[s.id]), ACRES],
  gridSetup: 'species',
  groups(raw: Raw): FieldGroup[] {
    const setup: FieldGroup = { id: 'setup', title: 'Species', setup: true, fields: [SPECIES] }
    const id = categoryOf(this, 'species', raw)
    if (!id) return [setup]
    const sp = lwSpecies(id)!
    return [
      setup,
      { id: 'vars', title: 'Habitat variables', note: sp.note, fields: SPECIES_VARS[id] },
      { id: 'area', title: 'Area', site: true, fields: [ACRES] },
    ]
  },
  compute(v) {
    const sp = lwSpecies(v.species as string)!
    const values = Object.fromEntries(sp.variables.map((x) => [x.id, v[`${sp.id}.${x.id}`]]))
    const r = lowerWillamette(sp, values, typeof v.acres === 'number' ? v.acres : null)
    return { values: { hsi: r.hsi, hu: r.hu } }
  },
  outputs: [
    { id: 'hsi', label: 'Habitat suitability index (HSI)', primary: true, index: true },
    { id: 'hu', label: 'Habitat units (HU)', digits: 2 },
  ],
  example: {
    raw: { species: 'turtle', 'turtle.V1': '25', 'turtle.V2': '90', 'turtle.V3': '20', 'turtle.V4': '10', 'turtle.V5': 'none', acres: '52' },
    note: 'The ERDC technical note\'s test case (Table 2): western pond turtle, HSI 0.61 and 31.65 habitat units.',
  },
}
