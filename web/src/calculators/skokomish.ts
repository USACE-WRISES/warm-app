import { skokomish, type SkokomishFactor, skokomishFactor, SKOKOMISH_FACTORS, SKOKOMISH_VARIABLES } from '../engine/models/skokomish'
import type { Variable } from '../engine/variables'
import { SOURCES } from './sources'
import { type CalcSpec, categoryOf, type FieldGroup, type Raw } from './types'

const FACTOR: Variable = {
  id: 'factor', code: 'Limiting factor', label: 'Limiting factor of the assessment area',
  categories: SKOKOMISH_FACTORS.map((f) => ({ value: f.value, label: f.label, si: 0,
    aliases: [{ inChannel: 'In-Channel Habitat', floodplain: 'Floodplain Habitat', capacityInChannel: 'Channel Capacity and In-Channel Habitat' }[f.value]] })),
}
const ACRES: Variable = { id: 'acres', code: 'Acres', label: 'Affected area', unit: 'acres', min: 0, max: 1e9, optional: true,
  help: 'Optional. Habitat units = HQI x affected acres.' }

export const SKOKOMISH: CalcSpec = {
  id: 'skokomish',
  modelId: 'skokomish',
  name: 'Skokomish',
  title: 'Skokomish River Ecosystem Restoration Project Environmental Benefits Analysis',
  purpose: 'Habitat quality in the Skokomish River valley, Washington.',
  region: 'Northwest',
  returns: 'HQI and habitat units',
  inputStyle: 'Suitability indices (0 to 1)',
  citations: [SOURCES.skokomish],
  method: [
    ...SKOKOMISH_FACTORS.map((f) => `${f.label}: ${f.note}`),
    'Habitat units = HQI x affected acres (page 53). Variables are numbered as in the report (Figure 27).',
  ],
  variables: [FACTOR, ...SKOKOMISH_VARIABLES, ACRES],
  groups(raw: Raw): FieldGroup[] {
    const setup: FieldGroup = { id: 'setup', title: 'Limiting factor', setup: true, fields: [FACTOR] }
    const f = categoryOf(this, 'factor', raw) as SkokomishFactor | undefined
    if (!f) return [setup]
    const ids = skokomishFactor(f).variables
    return [
      setup,
      { id: 'vars', title: 'Habitat variables', fields: SKOKOMISH_VARIABLES.filter((v) => ids.includes(v.id)) },
      { id: 'area', title: 'Area', site: true, fields: [ACRES] },
    ]
  },
  compute(v) {
    const r = skokomish(v.factor as SkokomishFactor, v as Record<string, number>, typeof v.acres === 'number' ? v.acres : null)
    return { values: { hqi: r.hqi, hu: r.hu } }
  },
  outputs: [
    { id: 'hqi', label: 'Habitat quality index (HQI)', primary: true, index: true },
    { id: 'hu', label: 'Habitat units (HU)', digits: 2 },
  ],
  example: {
    raw: { factor: 'capacityInChannel', V1: '0.72', V2: '0.83', V5: '0.97', acres: '219' },
    note: 'The ERDC technical note\'s test case (Table 2 and Figure 3): HQI 0.84 and 183.96 habitat units.',
  },
  notice: 'Enter suitability indices (0 to 1). The (i) button says what the report measures.',
}
