import { UMRS_STRUCTURE, UMRS_VARIABLES, upperMississippi } from '../engine/models/upperMississippi'
import type { Variable } from '../engine/variables'
import { SOURCES } from './sources'
import type { CalcSpec, FieldGroup } from './types'

const AREA: Variable = { id: 'area', code: 'Area', label: 'Management area', unit: 'acres', min: 0, max: 1e9, optional: true,
  help: 'Optional: habitat units are the HSI times the acres.' }

export const UPPER_MISSISSIPPI: CalcSpec = {
  id: 'upper-mississippi',
  modelId: 'upper-mississippi',
  name: 'Upper Mississippi',
  title: 'Upper Mississippi River System (UMRS) Floodplain Forest Habitat Model',
  purpose: 'Habitat changes from common management actions in floodplain (bottomland) forests, assessed by management area.',
  region: 'Southeast',
  returns: 'HSI and habitat units',
  inputStyle: 'Field measurements and indicator scores',
  citations: [SOURCES.upperMississippi],
  method: [
    'V1 to V4: each measurement becomes a suitability index through its curve (Figures 3 to 6).',
    'V5, structural diversity: the mean of five indicators, each scored 0 to 1 in steps of 0.2 (page 16).',
    'HSI = (V1 + V2 + V3 + V4 + V5) / 5; habitat units = HSI x acres.',
  ],
  variables: [...UMRS_VARIABLES, ...UMRS_STRUCTURE, AREA],
  groups(): FieldGroup[] {
    return [
      { id: 'measured', title: 'Forest measurements', fields: UMRS_VARIABLES },
      { id: 'structure', title: 'Structural diversity (V5)', note: 'Score each indicator from 0 to 1 in steps of 0.2.', fields: UMRS_STRUCTURE },
      { id: 'area', title: 'Area', fields: [AREA] },
    ]
  },
  compute(v) {
    const values = Object.fromEntries([...UMRS_VARIABLES, ...UMRS_STRUCTURE].map((x) => [x.id, Number(v[x.id])]))
    const r = upperMississippi(values, typeof v.area === 'number' ? v.area : null)
    return { values: { hsi: r.hsi, structure: r.structure, hu: r.hu } }
  },
  outputs: [
    { id: 'hsi', label: 'Habitat suitability index (HSI)', primary: true, index: true },
    { id: 'structure', label: 'Structural diversity (V5)', index: true },
    { id: 'hu', label: 'Habitat units (HU)', digits: 2 },
  ],
  example: {
    raw: { canopy: '5', forest: '5', invasive: '0', regen: '0', horizontal: '0.4', vertical: '0.6', sizeClass: '0.8', deadWood: '0.2', species: '1', area: '100' },
    note: 'The ERDC technical note\'s test case (Table 2): HSI 0.33 and 33 habitat units.',
  },
}
