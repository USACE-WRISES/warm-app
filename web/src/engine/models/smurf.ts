// Simple Model for Urban Riparian Function (SMURF), Version 1.0: McKay, S. K., M. Goss, F. Veraldi, and
// L. Mattingly. In review. USACE Louisville District. SMURF's own R function (section 4.4 of its
// report) turns each input into a suitability index with ecorest's SIcalc (linear between the
// curves' breakpoints, flat beyond them), averages each module's indices (instream, fauna, corridor),
// and takes the geometric mean of the three modules as the HSI; habitat units are HSI times area.
// WARM rounds the module indices, the HSI, the area and the habitat units to 3 decimals, as the Shiny app
// did, with R's rounding.
import { SMURF_CURVES } from '../data'
import { approx, type Curve } from '../interp'
import { rround } from '../rround'
import { rmean } from '../stats'
import type { Variable } from '../variables'

const curveOf = (module: keyof typeof SMURF_CURVES, k: number): Curve => ({ kind: 'linear', points: SMURF_CURVES[module][k].points })
const score = (id: string, code: string, label: string, module: keyof typeof SMURF_CURVES, k: number, help?: string): Variable =>
  ({ id, code, label, unit: '0-20', min: 0, max: 20, curve: curveOf(module, k), help })

/** Canopy structure enters both the instream and the fauna module (one field measurement). */
const CANSTR: Variable = {
  id: 'canstr', code: 'canstr.score', label: 'Canopy structure', unit: '0-6', min: 0, max: 6, curve: curveOf('instream', 5),
  help: 'Overstory, midstory and understory quality, each scored 0 (low), 1 (medium) or 2 (high), added together.',
}

export const SMURF_MODULES: readonly { id: 'instream' | 'fauna' | 'corridor'; label: string; variables: readonly Variable[] }[] = [
  {
    id: 'instream', label: 'Instream function',
    variables: [
      { id: 'hydatt', code: 'hyd.att', label: 'Incision ratio (bank height / bankfull depth)', unit: 'ratio', min: 0, max: 100, curve: curveOf('instream', 0),
        help: 'Near 1 means the stream reaches its floodplain often; 3 or more means a deeply incised channel.' },
      { id: 'stripwidth', code: 'stripwidth.ft', label: 'Average buffer width in the reach', unit: 'ft', min: 0, max: 100000, curve: curveOf('instream', 1) },
      score('flowpath', 'flowpath.score', 'Flowpaths through the buffer', 'instream', 2, 'How much runoff passes through the buffer rather than around it (SMURF Appendix B); 20 is ideal.'),
      { id: 'shading', code: 'shading.ratio', label: 'Shading ratio (canopy height within 25 ft of the bank / bankfull width)', unit: 'ratio', min: 0, max: 1000, curve: curveOf('instream', 3) },
      score('cancov', 'cancov.score', 'Stream canopy cover', 'instream', 4, 'Visual estimate from the stream (SMURF Appendix B); 20 is ideal.'),
      CANSTR,
      score('carbret', 'carbret.score', 'Organic matter retention in the stream', 'instream', 6, 'Potential to hold leaves and wood rather than wash them out; 20 is ideal.'),
    ],
  },
  {
    id: 'fauna', label: 'Native faunal habitat',
    variables: [
      CANSTR,
      score('deadfall', 'deadfall.score', 'Deadfall (fallen logs)', 'fauna', 1, '20 is ideal.'),
      score('snag', 'snag.score', 'Snags (standing dead wood)', 'fauna', 2, '20 is ideal.'),
      { id: 'batcan', code: 'batcan.score', label: 'Bat canopy structure', unit: '0-4', min: 0, max: 4, curve: curveOf('fauna', 3),
        help: '(2 - midstory) / 2 x (overstory + woody shrubs), with each layer scored 0, 1 or 2.' },
      score('embed', 'embed.score', 'Stream embeddedness', 'fauna', 4, 'Qualitative scale (SMURF Appendix B); 20 is ideal, the least embedded.'),
      score('detritus', 'detritus.score', 'Detrital ground cover (leaf litter)', 'fauna', 5, '20 is ideal.'),
      score('herb', 'herb.score', 'Herbaceous ground cover', 'fauna', 6, '20 is ideal.'),
      score('invveg', 'inv.veg.score', 'Invasive plant dominance', 'fauna', 7, 'Qualitative scale; 20 is ideal, the least invaded.'),
    ],
  },
  {
    id: 'corridor', label: 'Ecological corridor',
    variables: [
      score('bufdev', 'buffer.dev.score', 'Buffer development', 'corridor', 0, 'Development and human use in the buffer (SMURF Appendix B); 20 is ideal, undisturbed.'),
      { id: 'edge', code: 'edge.density.perft', label: 'Edge density (buffer perimeter / buffer area)', unit: 'ft/ft²', min: 0, max: 100, curve: curveOf('corridor', 1) },
      { id: 'corridorwidth', code: 'corridorwidth.ft', label: 'Average corridor width', unit: 'ft', min: 0, max: 100000, curve: curveOf('corridor', 2) },
      { id: 'corridormin', code: 'corridormin.ft', label: 'Narrowest corridor width in the reach', unit: 'ft', min: 0, max: 100000, curve: curveOf('corridor', 3) },
    ],
  },
]

export interface SmurfResult {
  si: Record<string, number[]>
  instream: number
  fauna: number
  corridor: number
  hsi: number
  area: number
  hu: number
}

/** SMURF's function as its report writes it: each module's inputs in the curves' order (7 instream,
 * 8 fauna, 4 corridor) and the area. */
export function smurfModules(instream: readonly number[], fauna: readonly number[], corridor: readonly number[], area: number): SmurfResult {
  const inputs = { instream, fauna, corridor }
  const si: Record<string, number[]> = {}
  const index: Record<string, number> = {}
  for (const m of SMURF_MODULES) {
    si[m.id] = inputs[m.id].map((x, k) => approx(SMURF_CURVES[m.id][k].points, x))
    index[m.id] = rround(rmean(si[m.id]), 3)
  }
  const hsi = rround((index.instream * index.fauna * index.corridor) ** (1 / 3), 3)
  const a = rround(area, 3)
  return { si, instream: index.instream, fauna: index.fauna, corridor: index.corridor, hsi, area: a, hu: rround(hsi * a, 3) }
}

/** v: the inputs by id (canopy structure once, for both modules); area: the riparian area assessed. */
export function smurf(v: Readonly<Record<string, number>>, area: number): SmurfResult {
  const of = (id: 'instream' | 'fauna' | 'corridor') => SMURF_MODULES.find((m) => m.id === id)!.variables.map((x) => v[x.id])
  return smurfModules(of('instream'), of('fauna'), of('corridor'), area)
}
