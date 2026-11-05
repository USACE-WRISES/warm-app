import { bosque, type BosqueCover, BOSQUE_BIOTA_FOREST, BOSQUE_BIOTA_MARSH, BOSQUE_HYDRO, BOSQUE_SPATIAL } from '../engine/models/bosque'
import { si, type Variable } from '../engine/variables'
import { SOURCES } from './sources'
import { categoryOf, type CalcSpec, type FieldGroup, type Raw } from './types'

const COVER: Variable = {
  id: 'cover', code: 'Cover type', label: 'Cover type',
  categories: [
    { value: '1', label: 'Type 1: mature riparian forest', note: 'over 40 ft, closed canopy, established understory', si: 1 },
    { value: '2', label: 'Type 2: mature riparian forest', note: 'over 40 ft, nearly closed canopy, limited understory', si: 2 },
    { value: '3', label: 'Type 3: intermediate-aged riparian woodland', note: 'closed canopy', si: 3 },
    { value: '4', label: 'Type 4: intermediate-aged woodland or savannah', note: 'broken canopy, mostly grass understory', si: 4 },
    { value: '5', label: 'Type 5: riparian shrubland', note: 'no tall trees', si: 5 },
    { value: '6', label: 'Type 6: meadow, grassland and marsh', note: 'short shrubs and grasses, open areas, wet meadows', si: 6 },
  ],
}

const LABELS: Record<string, string> = {
  DEPTHGW: 'Depth to groundwater', WETTEDAREA: 'Share of the polygon that is wet', FLOODFREQ: 'Flooding frequency (events per year)',
  DURATION: 'Average duration of flooding (days)', CANTREE: 'Canopy cover of overstory trees', CANSHRUB: 'Canopy cover of shrubs',
  CANHERB: 'Canopy cover of herbaceous plants', DISTBIGTR: 'Distance from the sample point to the biggest tree',
  NATIVETREE: 'Share of the tall tree canopy that is native', INDICATHB: 'Share of the herbaceous canopy that is an undesirable indicator',
  SPPCOUNT: 'Number of native tree and shrub species', COVGRND: 'Ground cover present', CTGRNDCOV: 'Number of ground cover categories present',
  DEPTHOM: 'Depth of organic matter', CANGRASS: 'Canopy cover of grasses', CANFORB: 'Canopy cover of forbs', CANSEDGE: 'Canopy cover of sedges',
  INDICATGR: 'Share of the grass canopy that is an undesirable indicator', INDICATFB: 'Share of the forb canopy that is an undesirable indicator',
  NATIVESDG: 'Share of the sedge canopy that is a desirable species', PATCHSIZE: 'Size of the patch',
  TYPDISTURB: 'Type of human disturbance (land use within 2 km)', DISTPATCH: 'Distance to the nearest patch of forest or meadow',
}
const V = (id: string): Variable => si(id, LABELS[id])
const ALL = [...new Set([...BOSQUE_HYDRO, ...BOSQUE_BIOTA_FOREST, ...BOSQUE_BIOTA_MARSH, ...BOSQUE_SPATIAL])].map(V)
const byId = (ids: readonly string[]) => ids.map((id) => ALL.find((v) => v.id === id)!)

export const BOSQUE: CalcSpec = {
  id: 'bosque',
  modelId: 'bosque',
  name: 'Bosque Rio Grande',
  title: 'Middle Rio Grande Bosque Riparian Community Index Model',
  purpose: 'Forest, shrub and meadow communities of the Middle Rio Grande bosque, New Mexico.',
  region: 'Southwest',
  returns: 'Community index (HSI)',
  inputStyle: 'Suitability indices (0 to 1)',
  citations: [SOURCES.bosque],
  method: [
    'Cover types 1 to 6 are the Hink and Ohmart structure classes I to VI. Types 1 to 5 share one biotic equation; type 6 has its own.',
    'Hydrology = ((FLOODFREQ x DURATION)^1/2 + DEPTHGW + WETTEDAREA) / 3',
    'Biotic integrity, cover types 1 to 5 = {3 x [((CANTREE x NATIVETREE x DISTBIGTR)^1/2 + CANSHRUB) / 2 x SPPCOUNT]^1/2 + CANHERB x INDICATHB + DEPTHOM + (COVGRND x CTGRNDCOV)^1/2} / 6',
    'Biotic integrity, cover type 6 = (CANSHRUB x SPPCOUNT + CANGRASS x INDICATGR + CANFORB x INDICATFB + CANSEDGE x NATIVESDG) / 4',
    'Spatial integrity = (2 x (PATCHSIZE x DISTPATCH)^1/2 + TYPDISTURB) / 3',
    'HSI = (Hydrology + Biotic integrity + Spatial integrity) / 3 (Table 3 of the model documentation)',
  ],
  variables: [COVER, ...ALL],
  groups(raw: Raw): FieldGroup[] {
    const setup: FieldGroup = { id: 'setup', title: 'Cover type', setup: true, fields: [COVER] }
    const cover = categoryOf(this, 'cover', raw)
    if (!cover) return [setup]
    const marsh = cover === '6'
    return [
      setup,
      { id: 'hydro', title: 'Hydrology', fields: byId(BOSQUE_HYDRO) },
      { id: 'biota', title: 'Structure, soils and biotic integrity', fields: byId(marsh ? BOSQUE_BIOTA_MARSH : BOSQUE_BIOTA_FOREST) },
      { id: 'spatial', title: 'Spatial integrity and disturbance', fields: byId(BOSQUE_SPATIAL) },
    ]
  },
  compute(v) {
    const r = bosque(Number(v.cover) as BosqueCover, v as Record<string, number>)
    return { values: { hsi: r.hsi, hydro: r.hydro, biota: r.biota, spatial: r.spatial } }
  },
  outputs: [
    { id: 'hsi', label: 'Community index (HSI)', primary: true, index: true },
    { id: 'hydro', label: 'Hydrology', index: true },
    { id: 'biota', label: 'Structure, soils and biotic integrity', index: true },
    { id: 'spatial', label: 'Spatial integrity and disturbance', index: true },
  ],
  notice: "Enter suitability indices (0 to 1) read from the model's curves (Appendix E).",
}
