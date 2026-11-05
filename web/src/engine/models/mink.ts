// Mink habitat suitability, two models.
//
// Modified riverine model: Devendorf, R., and T. Yager. 2013. Modification of the Riverine Cover Type
// Component of the Habitat Suitability Index Model for Mink. USACE St. Paul District (Figures 1 to 4,
// pages 3 to 7). Water is SIV1; cover is the geometric mean of SIV5, SIV6 and the stream condition
// (Vstream); the HSI is the lower of the two.
//
// Allen (1986) model: Allen, A. W. 1986. Habitat suitability index models: mink, revised. U.S. Fish
// and Wildlife Service Biological Report 82(10.127). The suitability curves and the cover equations
// for each cover type are as in the ecorest package's library of these models (HSImodels,
// HSImetadata). The HSI is the lower of water (SIV1) and cover for the site's cover type.
import { linear } from '../interp'
import type { Variable } from '../variables'
import { suitability } from '../variables'

const pct = (id: string, label: string, curve: ReturnType<typeof linear>, source: string): Variable =>
  ({ id, code: id, label, unit: '%', min: 0, max: 100, curve, source })

const SIV1_CURVE = linear([0, 0], [25, 0], [75, 1], [100, 1])
const CANOPY_CURVE = linear([0, 0.1], [75, 1], [100, 1])

export const MINK_MODIFIED_VARIABLES: readonly Variable[] = [
  pct('SIV1', 'Share of the year with surface water present', SIV1_CURVE, 'Figure 1, p. 6'),
  pct('SIV5', "Canopy cover of trees and shrubs within 100 m of the water's edge", CANOPY_CURVE, 'Figure 2, p. 6'),
  pct('SIV6', "Shoreline with cover within 1 m of the water's edge", linear([0, 0.05], [5, 0.05], [100, 1]), 'Figure 3, p. 7'),
  { id: 'Vstream', code: 'Vstream', label: 'Stream condition', unit: 'index', min: 0.4, max: 1, source: 'Figure 4, p. 7',
    help: '0.4 heavily disturbed (ditched or channelized), 0.7 moderately disturbed (some ditching or erosion), 1.0 natural channel. Values in between are allowed.' },
]

export interface MinkModifiedResult { si: Record<string, number>; cover: number; water: number; hsi: number }

export function minkModified(v: Readonly<Record<string, number>>): MinkModifiedResult {
  const si = {
    SIV1: suitability(MINK_MODIFIED_VARIABLES[0], v.SIV1)!,
    SIV5: suitability(MINK_MODIFIED_VARIABLES[1], v.SIV5)!,
    SIV6: suitability(MINK_MODIFIED_VARIABLES[2], v.SIV6)!,
    Vstream: v.Vstream,
  }
  const cover = (si.SIV5 * si.SIV6 * si.Vstream) ** (1 / 3)
  const water = si.SIV1
  return { si, cover, water, hsi: Math.min(cover, water) }
}

export type MinkCoverType = 'riverine' | 'emergent' | 'forested'

export const MINK_COVER_TYPES: readonly { value: MinkCoverType; label: string; note: string }[] = [
  { value: 'riverine', label: 'Riverine or lacustrine', note: 'cover = (SIV5 x SIV6)^1/2' },
  { value: 'emergent', label: 'Palustrine emergent wetland', note: 'cover = (4 x SIV4 + SIV5) / 5' },
  { value: 'forested', label: 'Palustrine forested or scrub-shrub wetland', note: 'cover depends on the wetland area' },
]

/** The wetland area (ha) at and above which a forested or scrub-shrub wetland uses the large-wetland
 * cover equation. */
export const MINK_LARGE_WETLAND_HA = 405

export const MINK_ALLEN_VARIABLES: readonly Variable[] = [
  pct('V1', 'Share of the year with surface water present', SIV1_CURVE, 'Allen 1986'),
  pct('V2', 'Tree canopy cover', CANOPY_CURVE, 'Allen 1986'),
  pct('V3', 'Shrub canopy cover', CANOPY_CURVE, 'Allen 1986'),
  pct('V4', 'Canopy cover of emergent herbaceous plants', linear([0, 0], [50, 1], [75, 1], [100, 0.8]), 'Allen 1986'),
  pct('V5', 'Canopy cover of trees and shrubs within 100 m of the wetland edge', CANOPY_CURVE, 'Allen 1986'),
  pct('V6', 'Shoreline with cover', linear([0, 0], [100, 1]), 'Allen 1986'),
]

/** The variables a cover type uses (the forested type's V5 only below 405 ha). */
export function minkAllenVariables(cover: MinkCoverType, areaHa: number | null): readonly string[] {
  if (cover === 'riverine') return ['V1', 'V5', 'V6']
  if (cover === 'emergent') return ['V1', 'V4', 'V5']
  return areaHa !== null && areaHa >= MINK_LARGE_WETLAND_HA ? ['V1', 'V2', 'V3', 'V4'] : ['V1', 'V2', 'V3', 'V4', 'V5']
}

export interface MinkAllenResult { si: Record<string, number>; equation: string; cover: number; water: number; hsi: number }

export function minkAllen(coverType: MinkCoverType, areaHa: number | null, v: Readonly<Record<string, number>>): MinkAllenResult {
  const si: Record<string, number> = {}
  for (const id of minkAllenVariables(coverType, areaHa)) {
    si[id] = suitability(MINK_ALLEN_VARIABLES.find((x) => x.id === id)!, v[id])!
  }
  let cover: number
  let equation: string
  if (coverType === 'riverine') {
    cover = (si.V5 * si.V6) ** 0.5
    equation = 'SIRL = (SIV5 x SIV6)^1/2'
  } else if (coverType === 'emergent') {
    cover = (4 * si.V4 + si.V5) / 5
    equation = 'SIPE = (4 x SIV4 + SIV5) / 5'
  } else if (areaHa !== null && areaHa >= MINK_LARGE_WETLAND_HA) {
    cover = Math.min(1, si.V2 + si.V3 + si.V4)
    equation = 'SIFS1 = min(1, SIV2 + SIV3 + SIV4), wetlands of 405 ha or more'
  } else {
    cover = (Math.min(1, si.V2 + si.V3 + si.V4) + si.V5) / 2
    equation = 'SIFS2 = (min(1, SIV2 + SIV3 + SIV4) + SIV5) / 2, wetlands under 405 ha'
  }
  const water = si.V1
  return { si, equation, cover, water, hsi: Math.min(cover, water) }
}
