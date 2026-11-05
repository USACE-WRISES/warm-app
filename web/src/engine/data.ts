// The app's data tables (web/data, the authoritative copies), read at build time.
import modelsCsv from '../../data/models.csv?raw'
import resacaCsv from '../../data/resaca_species.csv?raw'
import corridorCsv from '../../data/smurf_corridor.csv?raw'
import faunaCsv from '../../data/smurf_fauna.csv?raw'
import instreamCsv from '../../data/smurf_instream.csv?raw'
import { parseCsv, parseCsvRecords } from './csv'
import type { Point } from './interp'

/** The model table (WARM's Model Comparison data: Wiest et al. 2023, ERDC/TN EMRRP-ER-26). */
export const MODEL_TABLE: readonly Record<string, string>[] = parseCsvRecords(modelsCsv)
/** Its column names, in order. */
export const MODEL_COLUMNS: readonly string[] = parseCsv(modelsCsv)[0]

/** Suitability curves in ecorest's format: for each variable a column of x values and a column of SI
 * values, rows padded with NA. Each curve's breakpoints, in order, with its column names. */
export interface NamedCurve { readonly name: string; readonly siName: string; readonly points: readonly Point[] }
export function curvesFromCsv(text: string): NamedCurve[] {
  const [header, ...rows] = parseCsv(text)
  const out: NamedCurve[] = []
  for (let c = 0; c + 1 < header.length; c += 2) {
    const points: Point[] = []
    for (const r of rows) {
      const x = r[c]?.trim()
      const y = r[c + 1]?.trim()
      if (!x || !y || x === 'NA' || y === 'NA') continue
      points.push([Number(x), Number(y)])
    }
    out.push({ name: header[c], siName: header[c + 1], points })
  }
  return out
}

/** SMURF's suitability curves (SMURF Version 1.0, the parameter files of 2020-09-10). */
export const SMURF_CURVES = {
  instream: curvesFromCsv(instreamCsv),
  fauna: curvesFromCsv(faunaCsv),
  corridor: curvesFromCsv(corridorCsv),
} as const

/** A Resaca species and its reference abundance range (% composition) in each habitat it belongs to. */
export interface ResacaSpecies {
  readonly common: string
  readonly scientific: string
  readonly ranges: Partial<Record<'TERF' | 'STPW' | 'TESES', readonly [number, number]>>
}
export const RESACA_SPECIES: readonly ResacaSpecies[] = parseCsvRecords(resacaCsv).map((r) => {
  const range = (lo: string, hi: string): readonly [number, number] | undefined =>
    r[lo].trim() && r[hi].trim() ? [Number(r[lo]), Number(r[hi])] : undefined
  const ranges: Partial<Record<'TERF' | 'STPW' | 'TESES', readonly [number, number]>> = {}
  const terf = range('TERF Min', 'TERF Max')
  const stpw = range('STPW Min', 'STPW Max')
  const teses = range('TESES Min', 'TESES Max')
  if (terf) ranges.TERF = terf
  if (stpw) ranges.STPW = stpw
  if (teses) ranges.TESES = teses
  return { common: r['Common Name'], scientific: r['Scientific Name'], ranges }
})
