// Middle Rio Grande Bosque Riparian Community Index Model: Burks-Copes, K. A., and A. C. Webb. 2012.
// ERDC/EL TR-12-26, Table 3 (index formulas). Every input is a suitability index from 0 to 1.
//
// Cover types 1 to 5 (Hink and Ohmart structure classes I to V: forests, woodlands and shrublands)
// and cover type 6 (class VI: short shrubs, grasses, meadows and marsh) use different biotic
// equations; the hydrology and spatial components are the same for every cover type. The overall
// index is the mean of the three components (Table 11's reach results are such means).

export type BosqueCover = 1 | 2 | 3 | 4 | 5 | 6

export const BOSQUE_HYDRO = ['DEPTHGW', 'WETTEDAREA', 'FLOODFREQ', 'DURATION'] as const
export const BOSQUE_BIOTA_FOREST = ['CANTREE', 'CANSHRUB', 'CANHERB', 'DISTBIGTR', 'NATIVETREE', 'INDICATHB',
  'SPPCOUNT', 'COVGRND', 'CTGRNDCOV', 'DEPTHOM'] as const
export const BOSQUE_BIOTA_MARSH = ['CANSHRUB', 'SPPCOUNT', 'CANGRASS', 'CANFORB', 'CANSEDGE', 'INDICATGR',
  'INDICATFB', 'NATIVESDG'] as const
export const BOSQUE_SPATIAL = ['PATCHSIZE', 'TYPDISTURB', 'DISTPATCH'] as const

/** The variables a cover type uses, in the order the model lists them. */
export function bosqueVariables(cover: BosqueCover): readonly string[] {
  return [...BOSQUE_HYDRO, ...(cover === 6 ? BOSQUE_BIOTA_MARSH : BOSQUE_BIOTA_FOREST), ...BOSQUE_SPATIAL]
}

export interface BosqueResult { hydro: number; biota: number; spatial: number; hsi: number }

/** The community index; v holds the cover type's variables (suitability indices). */
export function bosque(cover: BosqueCover, v: Readonly<Record<string, number>>): BosqueResult {
  const hydro = ((v.FLOODFREQ * v.DURATION) ** 0.5 + v.DEPTHGW + v.WETTEDAREA) / 3
  const biota = cover === 6
    ? ((v.CANSHRUB * v.SPPCOUNT) + (v.CANGRASS * v.INDICATGR) + (v.CANFORB * v.INDICATFB) + (v.CANSEDGE * v.NATIVESDG)) / 4
    : (3 * ((((v.CANTREE * v.NATIVETREE * v.DISTBIGTR) ** 0.5 + v.CANSHRUB) / 2) * v.SPPCOUNT) ** 0.5
      + (v.CANHERB * v.INDICATHB) + v.DEPTHOM + (v.COVGRND * v.CTGRNDCOV) ** 0.5) / 6
  const spatial = (2 * ((v.PATCHSIZE * v.DISTPATCH) ** 0.5) + v.TYPDISTURB) / 3
  return { hydro, biota, spatial, hsi: (hydro + biota + spatial) / 3 }
}
