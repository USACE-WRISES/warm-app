// Community-Based Ecosystem Response Model for the Cottonwood Riparian Forests of the Missouri River:
// Burks-Copes, K. A. 2016. ERDC/EL Final Report. Every input but stand age is a suitability index from
// 0 to 1. Mature stands (over 25 years) and young stands (2 to 25 years) use different hydrology and
// biotic equations; the ecosystem response index (ERI) weights hydrology three times. As in the Shiny app,
// stands younger than 2 years score 0.

export type CottonwoodStage = 'mature' | 'young' | 'establishing'

export const COTTONWOOD_MATURE = ['LCPI', 'DEPTHGW', 'RICHNATIVE', 'CVALUE', 'WIS', 'ADJLANDUSE', 'PATCHSIZE',
  'DISPATCH', 'PROPCTW', 'RECRUIT', 'INTERSPERS'] as const
export const COTTONWOOD_YOUNG = ['LCPI', 'RICHNATIVE', 'CVALUE', 'WIS', 'CANHERB', 'CANSHRUB', 'ADJLANDUSE',
  'PATCHSIZE', 'DISPATCH', 'PROPCTW', 'RECRUIT', 'INTERSPERS'] as const

export function cottonwoodStage(age: number): CottonwoodStage {
  if (age > 25) return 'mature'
  if (age >= 2) return 'young'
  return 'establishing'
}

/** The variables a stand of this age uses. */
export function cottonwoodVariables(age: number): readonly string[] {
  const stage = cottonwoodStage(age)
  return stage === 'mature' ? COTTONWOOD_MATURE : stage === 'young' ? COTTONWOOD_YOUNG : []
}

export interface CottonwoodResult { stage: CottonwoodStage; hydro: number | null; biota: number | null; spatial: number | null; eri: number }

export function cottonwood(age: number, v: Readonly<Record<string, number>>): CottonwoodResult {
  const stage = cottonwoodStage(age)
  if (stage === 'establishing') return { stage, hydro: null, biota: null, spatial: null, eri: 0 }
  const hydro = stage === 'mature' ? (v.LCPI + v.DEPTHGW) / 2 : v.LCPI
  const biota = stage === 'mature'
    ? (v.RICHNATIVE + v.CVALUE + v.WIS) / 3
    : ((v.RICHNATIVE + v.CVALUE + v.WIS) / 3 + (v.CANHERB + v.CANSHRUB) / 2) / 2
  const spatial = ((((v.PATCHSIZE + v.DISPATCH) / 2) * v.PROPCTW) + v.ADJLANDUSE + v.RECRUIT + v.INTERSPERS) / 4
  return { stage, hydro, biota, spatial, eri: ((3 * hydro) + biota + spatial) / 5 }
}
