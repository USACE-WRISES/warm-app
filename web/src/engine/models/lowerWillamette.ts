// Lower Willamette River Ecosystem Restoration Project, habitat evaluation models: Tetra Tech, Inc.
// 2014. Appendix F, Planning Models Documentation. Each species' suitability index curves are in
// Section 4.8 (pages as printed); each species' HSI is the arithmetic mean of its variables'
// suitability indices (Tables 4.3 to 4.9), and habitat units are HSI times acres.
//
// WARM 2.0 follows the report where WARM 1.x did not (docs/changes-from-1x.md): the tributary
// salmonid model is one model whose temperature index averages the adult and juvenile curves, and the
// curves marked "fix" below correct WARM 1.x's.
import { type Curve, linear } from '../interp'
import { type Category, type Variable, suitability } from '../variables'

const pct = (id: string, label: string, curve: Curve, source: string, extra: Partial<Variable> = {}): Variable =>
  ({ id, code: id, label, unit: '%', min: 0, max: 100, curve, source, ...extra })
const cats = (...list: [string, string, number, string?][]): Category[] =>
  list.map(([value, label, si, note]) => ({ value, label, si, note }))

export interface LwSpecies {
  readonly id: string
  readonly name: string
  readonly variables: readonly Variable[]
  readonly note?: string
}

export const LW_SPECIES: readonly LwSpecies[] = [
  {
    id: 'turtle',
    name: 'Western pond turtle',
    variables: [
      pct('V1', 'Area with the water depth adults prefer (1 to 2 m)', linear([0, 0], [20, 0.5], [50, 1], [75, 1], [100, 0.2]), 'p. 28'),
      // fix: WARM 1.x computed ((x - 5) / 5) x 0.2 between 0 and 25 percent
      pct('V2', "Cover along the water's edge (canopy, large wood, emergent plants)", linear([0, 0], [25, 0.2], [50, 0.5], [75, 1], [100, 1]), 'p. 29'),
      { id: 'V3', code: 'V3', label: 'Water temperature during low flows (late summer and early fall)', unit: '°C', min: 0, max: 40,
        curve: linear([5, 0], [10, 0.2], [15, 0.6], [20, 1], [25, 1], [30, 0.6]), source: 'p. 29' },
      pct('V4', 'Area with water shallower than 0.3 m', linear([0, 0.1], [25, 1], [50, 1], [75, 0.3], [100, 0]), 'p. 29'),
      { id: 'V5', code: 'V5', label: 'Suitable nesting sites', source: 'p. 29',
        categories: cats(['none', 'None', 0], ['very-few', 'Very few', 0.2, '1 to 2 in the project area'], ['sparse', 'Sparse', 0.5, '3 to 4 in the project area'],
          ['moderate', 'Moderate', 0.8, '5 to 7 in the project area'], ['abundant', 'Abundant', 1, 'more than 7 in the project area']) },
    ],
  },
  {
    id: 'beaver',
    name: 'Beaver',
    variables: [
      pct('V1', 'Tree canopy closure (woody plants 5 m or taller)', linear([0, 0], [25, 0.5], [50, 1], [75, 0.8], [100, 0.6]), 'p. 30'),
      pct('V2', 'Trees 2.5 to 15.2 cm (1 to 6 in) in diameter', linear([0, 0.2], [25, 0.4], [50, 0.6], [75, 0.8], [100, 1]), 'p. 30'),
      pct('V3', 'Shrub crown cover (woody plants under 5 m)', linear([0, 0], [25, 0.6], [50, 1], [75, 0.9], [100, 0.8]), 'p. 30'),
      { id: 'V4', code: 'V4', label: 'Average height of the shrub canopy', unit: 'm', min: 0, max: 20,
        curve: linear([0, 0], [1, 0.3], [2, 1]), source: 'p. 30' },
      { id: 'V5', code: 'V5', label: 'Species composition of the woody plants', source: 'pp. 30-31',
        categories: cats(['A', 'Class A', 1, 'more than 50% aspen, willow, cottonwood or alder'], ['B', 'Class B', 0.6, 'other deciduous species'],
          ['C', 'Class C', 0.2, 'coniferous species']) },
    ],
  },
  {
    id: 'woodDuck',
    name: 'Wood duck',
    variables: [
      pct('V1', 'Water surface covered by brood cover (shrubs, tree crowns within 1 m of the water, fallen wood, herbaceous plants)',
        linear([0, 0], [25, 0.4], [40, 0.8], [50, 1], [75, 1], [85, 0.6], [100, 0]), 'p. 31'),
    ],
  },
  {
    id: 'yellowWarbler',
    name: 'Yellow warbler',
    variables: [
      pct('V1', 'Deciduous shrub crown cover', linear([0, 0], [25, 0.4], [50, 0.75], [60, 1], [80, 1], [90, 0.8], [100, 0.6]), 'p. 31'),
      // the report gives ranges (0-20, 20-40, ...); each range includes its upper bound, as in its Appendix B
      pct('V2', 'Overall canopy cover', { kind: 'steps', upTo: [20, 40, 60, 70, 80], si: [0, 0.1, 0.2, 0.8, 1, 0.1] }, 'pp. 31-32'),
      // fix: WARM 1.x scored only 0, exactly 1 and 2 or more
      { id: 'V3', code: 'V3', label: 'Average height of the deciduous shrub canopy', unit: 'm', min: 0, max: 20,
        curve: linear([0, 0], [2, 1]), source: 'p. 32' },
      pct('V4', 'Shrub canopy made up of hydrophytic shrubs', linear([0, 0.1], [25, 0.3], [50, 0.55], [75, 0.8], [100, 1]), 'p. 32'),
    ],
  },
  {
    id: 'amphibians',
    name: 'Native amphibians',
    variables: [
      // the report is silent between 40 and 50 percent; the index falls in a line from 1 to 0.2 there
      pct('V1', 'Area with permanent water', linear([0, 0], [10, 0.6], [25, 1], [40, 1], [50, 0.2]), 'p. 32'),
      pct('V2', 'Area with emergent or submerged wetland and aquatic plants', linear([0, 0], [25, 0.5], [50, 1]), 'p. 32'),
      pct('V3', "Ground cover along the water's edge", linear([0, 0], [25, 0.3], [50, 0.6], [75, 0.9], [100, 1]), 'p. 33'),
      // fix: WARM 1.x had 0.1 at 10 m
      { id: 'V4', code: 'V4', label: 'Width of the riparian zone', unit: 'm', min: 0, max: 1000,
        curve: linear([0, 0], [10, 0.2], [30, 0.6], [60, 1]), source: 'p. 33' },
      { id: 'V5', code: 'V5', label: 'Maximum water temperature during low flows', unit: '°C', min: 0, max: 40,
        curve: linear([0, 0.1], [5, 0.5], [10, 1], [15, 0.3], [20, 0]), source: 'p. 33' },
      { id: 'V6', code: 'V6', label: 'Land use within 200 m of the wetland edge', source: 'p. 33',
        categories: [...cats(['developed', 'Developed', 0], ['row-crops', 'Row crops', 0.1], ['pasture', 'Managed pasture', 0.5]),
          { value: 'fallow', label: 'Fallow grass or herbs', si: 0.7, aliases: ['Fallow Grass/herbs'] },
          { value: 'shrubs-trees', label: 'Shrubs or trees', si: 1, aliases: ['Shrubs/trees'] }] },
    ],
  },
  {
    id: 'salmonidTributary',
    name: 'Salmonids (tributaries)',
    note: 'One model for prespawning adults and juveniles: the temperature index averages the two life stages (report p. 34).',
    variables: [
      // fix: WARM 1.x offered two broken models; the juvenile curve rises to 1.0 at 15 degrees
      { id: 'FV1', code: 'FV1', label: 'Maximum water temperature during low flows', unit: '°C', min: 0, max: 40, source: 'p. 34',
        curve: { kind: 'mean', labels: ['Prespawning adults', 'Juveniles'],
          curves: [linear([0, 0], [5, 0.5], [10, 1], [15, 0.9], [20, 0.5], [25, 0]), linear([0, 0], [5, 0.3], [10, 0.9], [15, 1], [20, 0.9], [25, 0])] } },
      // fix: WARM 1.x rose from 0.2 to 0.8 between 0 and 25 percent
      pct('FV2', 'Pools during the low-water period', linear([0, 0.2], [25, 0.6], [50, 1], [75, 0.9], [100, 0.2]), 'p. 34'),
      pct('FV3', 'Instream cover (large wood), as a share of the surface area', linear([0, 0.1], [10, 0.2], [20, 0.4], [30, 0.8], [40, 1]), 'p. 34'),
      { id: 'FV4', code: 'FV4', label: 'Main substrate in riffles and runs', source: 'p. 34',
        categories: cats(['A', 'Class A', 1, 'rubble or small boulders; little gravel, large boulders or bedrock'],
          ['B', 'Class B', 0.6, 'rubble, gravel, boulders and fines in about equal amounts, or mostly gravel'],
          ['C', 'Class C', 0.3, 'mostly fines, bedrock or large boulders; rubble and gravel under 25%']) },
    ],
  },
  {
    id: 'salmonidMainstem',
    name: 'Native salmonids (mainstem)',
    variables: [
      // fix: WARM 1.x fed each input to another variable's curve and left three substrates blank
      { id: 'V1', code: 'V1', label: 'Water depth within 20 m of the shore', unit: 'm', min: 0, max: 100, source: 'p. 35',
        curve: { kind: 'steps', upTo: [0.5, 3, 10], si: [0.5, 1, 0.6, 0] } },
      { id: 'V2', code: 'V2', label: 'Substrate', source: 'p. 35',
        categories: cats(['bedrock', 'Bedrock', 0.25], ['riprap', 'Riprap', 0.35], ['sand', 'Sand', 1], ['fines', 'Fines', 0.45]) },
      pct('V3', 'Bank vegetation cover', { kind: 'steps', upTo: [10, 20, 30, 40, 80], si: [0, 0.3, 1, 0.6, 0.2, 0.1] }, 'p. 35'),
    ],
  },
]

export function lwSpecies(id: string): LwSpecies | undefined {
  return LW_SPECIES.find((s) => s.id === id)
}

export interface LowerWillametteResult { si: Record<string, number>; hsi: number; hu: number | null }

/** The species' HSI from its variables' values (measurements or category values), and HU when the
 * acres are given. */
export function lowerWillamette(species: LwSpecies, values: Readonly<Record<string, number | string>>, acres: number | null): LowerWillametteResult {
  const si: Record<string, number> = {}
  let sum = 0
  for (const v of species.variables) {
    const s = suitability(v, values[v.id])
    if (s === null) throw new Error(`${species.name}: ${v.code} has no suitability index`)
    si[v.id] = s
    sum += s
  }
  const hsi = sum / species.variables.length
  return { si, hsi, hu: acres === null ? null : hsi * acres }
}
