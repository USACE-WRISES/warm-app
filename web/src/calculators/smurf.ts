import { smurf, SMURF_MODULES } from '../engine/models/smurf'
import type { Variable } from '../engine/variables'
import { SOURCES } from './sources'
import type { CalcSpec, FieldGroup } from './types'

const AREA: Variable = { id: 'area', code: 'Area', label: 'Riparian area assessed', unit: 'acres', min: 0, max: 1e9,
  help: 'SMURF assesses the left and right bank riparian areas separately.' }
const unique = (vs: readonly Variable[]) => vs.filter((v, i) => vs.findIndex((w) => w.id === v.id) === i)
const MODULE = (id: string) => SMURF_MODULES.find((m) => m.id === id)!

export const SMURF: CalcSpec = {
  id: 'smurf',
  modelId: 'smurf',
  name: 'SMURF',
  title: 'Simple Model for Urban Riparian Function (SMURF)',
  purpose: 'Riparian function in urban stream corridors.',
  region: 'Northeast',
  returns: 'HSI and habitat units',
  inputStyle: 'Field measurements and 0 to 20 scores',
  citations: [SOURCES.smurf],
  method: [
    'Each input becomes a suitability index through its curve, linear between breakpoints and flat beyond them (ecorest SIcalc).',
    'Instream, fauna and corridor indices: the mean of each module\'s suitability indices, rounded to 3 decimals.',
    'HSI = (Instream x Fauna x Corridor)^1/3, rounded to 3 decimals; habitat units = HSI x area.',
  ],
  variables: [AREA, ...unique(SMURF_MODULES.flatMap((m) => m.variables))],
  groups(): FieldGroup[] {
    return [
      { id: 'area', title: 'Area', site: true, fields: [AREA] },
      { id: 'instream', title: MODULE('instream').label, fields: MODULE('instream').variables },
      { id: 'fauna', title: MODULE('fauna').label, note: 'Also uses the canopy structure entered under instream function.',
        fields: MODULE('fauna').variables.filter((v) => v.id !== 'canstr') },
      { id: 'corridor', title: MODULE('corridor').label, fields: MODULE('corridor').variables },
    ]
  },
  compute(v) {
    const r = smurf(v as Record<string, number>, v.area as number)
    return { values: { hsi: r.hsi, instream: r.instream, fauna: r.fauna, corridor: r.corridor, hu: r.hu } }
  },
  outputs: [
    { id: 'hsi', label: 'Habitat suitability index (HSI)', primary: true, index: true },
    { id: 'instream', label: 'Instream function', index: true },
    { id: 'fauna', label: 'Native faunal habitat', index: true },
    { id: 'corridor', label: 'Ecological corridor', index: true },
    { id: 'hu', label: 'Habitat units (HU)' },
  ],
  example: {
    raw: { area: '10', hydatt: '1.5', stripwidth: '120', flowpath: '12', shading: '5', cancov: '20', canstr: '1', carbret: '10',
      deadfall: '3', snag: '10', batcan: '2', embed: '20', detritus: '10', herb: '15', invveg: '5',
      bufdev: '0', edge: '0.005', corridorwidth: '25', corridormin: '20' },
    note: 'Built from the SMURF report\'s module tests (Tables 5 to 7): instream 0.74, fauna 0.48 and corridor 0.36.',
  },
}
