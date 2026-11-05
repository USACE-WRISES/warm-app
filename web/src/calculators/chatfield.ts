import { chatfield, CHATFIELD_FUNCTIONS, CHATFIELD_MAX, CHATFIELD_MIN, CHATFIELD_VARIABLES } from '../engine/models/chatfield'
import type { Variable } from '../engine/variables'
import { SOURCES } from './sources'
import type { CalcSpec, FieldGroup } from './types'

/** The 32 state variables: SV 1.1 to SV 10.5. */
const SV: Variable[][] = CHATFIELD_VARIABLES.map((names, i) => names.map((label, j) => ({
  id: `sv${i + 1}_${j + 1}`, code: `SV ${i + 1}.${j + 1}`, label, unit: '50-100', min: CHATFIELD_MIN, max: CHATFIELD_MAX,
})))

const TN_EXAMPLE = [85, 75, 55, 85, 65, 50, 95, 55, 60, 70, 90, 80, 70, 65, 65, 70, 95, 90, 90, 80, 55, 85, 70, 65, 80, 55, 90, 95, 50, 60, 75, 90]

export const CHATFIELD: CalcSpec = {
  id: 'chatfield',
  modelId: 'chatfield',
  name: 'Chatfield',
  title: 'Ecological Functions Approach at Chatfield Reservoir',
  purpose: 'Terrestrial and riparian habitat at Chatfield Reservoir, Colorado.',
  region: 'Varying',
  returns: 'Functional condition scores (0 to 1)',
  inputStyle: 'State variable scores (50 to 100)',
  citations: [SOURCES.chatfield],
  method: [
    'Each of the 10 variables scores (mean + minimum) / 2 of its state variables.',
    'Each functional condition score weights the 10 variables (weights sum to 1), then maps 50 to 100 onto 0 to 1: score = weighted sum / 50 - 1.',
    ...CHATFIELD_FUNCTIONS.map((f) => `${f.label}: ${f.weights.map((w, i) => (w ? `${w} x V${i + 1}` : '')).filter(Boolean).join(' + ')}`),
    'Overall = the mean of the four functional condition scores.',
  ],
  variables: SV.flat(),
  groups(): FieldGroup[] {
    return SV.map((fields, i) => ({ id: `v${i + 1}`, title: `Variable ${i + 1}`, fields }))
  },
  compute(v) {
    const r = chatfield(SV.flat().map((x) => v[x.id] as number))
    const values: Record<string, number> = {
      overall: r.overall, hydraulic: r.hydraulic, geomorphic: r.geomorphic, physicochemical: r.physicochemical, biotic: r.biotic,
    }
    r.variables.forEach((x, i) => { values[`v${i + 1}`] = x })
    return { values }
  },
  outputs: [
    { id: 'overall', label: 'Overall functional condition', primary: true, index: true },
    ...CHATFIELD_FUNCTIONS.map((f) => ({ id: f.id, label: `${f.label} functional condition`, index: true })),
    ...CHATFIELD_VARIABLES.map((_, i) => ({ id: `v${i + 1}`, label: `Variable ${i + 1}`, digits: 1, section: 'Variable scores (50 to 100)' })),
  ],
  example: {
    raw: Object.fromEntries(SV.flat().map((x, k) => [x.id, String(TN_EXAMPLE[k])])),
    note: 'The ERDC technical note\'s test case (Table 2): overall score 0.34.',
  },
  notice: 'Score each state variable from 50 to 100.',
}
