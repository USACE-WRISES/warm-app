// The nine calculators, in the order WARM lists them.
import { BOSQUE } from './bosque'
import { CHATFIELD } from './chatfield'
import { COTTONWOOD } from './cottonwood'
import { LOWER_WILLAMETTE } from './lowerWillamette'
import { MINK } from './mink'
import { RESACA } from './resaca'
import { SKOKOMISH } from './skokomish'
import { SMURF } from './smurf'
import type { CalcSpec } from './types'
import { UPPER_MISSISSIPPI } from './upperMississippi'

export const CALCULATORS: readonly CalcSpec[] = [BOSQUE, CHATFIELD, COTTONWOOD, LOWER_WILLAMETTE, MINK, RESACA, SMURF, SKOKOMISH, UPPER_MISSISSIPPI]

export function calculator(id: string): CalcSpec | undefined {
  return CALCULATORS.find((c) => c.id === id)
}

/** The calculator for a model in the model table, if WARM has one. */
export function calculatorForModel(modelId: string): CalcSpec | undefined {
  return CALCULATORS.find((c) => c.modelId === modelId)
}
