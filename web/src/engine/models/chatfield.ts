// Ecological Functions Approach for Terrestrial Habitats at Chatfield Reservoir: ERO Resources
// Corporation. 2009. ERO Project #4048. As in WARM 1.x (and the model's published spreadsheet, which
// the ERDC technical note's test case reproduces): 32 state variable (SV) scores from 50 to 100, in ten
// variables; each variable scores (mean + minimum) / 2 of its SVs; four functional condition scores
// weight the variables and map 50..100 onto 0..1; the overall score is their mean.

/** The ten variables and their state variables (SV numbers and names, as the model's sheet has them). */
export const CHATFIELD_VARIABLES: readonly (readonly string[])[] = [
  ['Total Volume', 'Peak Flows', 'Base Flows', 'Flow Variability'],
  ['Land Erosion', 'Channel Erosion', 'Transport'],
  ['Temperature Regime', 'Organics / Nutrients', 'Inorganics / Toxins'],
  ['Saturation Frequency', 'Floodplain Width', 'Saturation Duration'],
  ['Woody Vegetation Structure', 'Herbaceous Vegetation Structure', 'Species Diversity'],
  ['Large Woody Debris', 'Detritus'],
  ['Evolutionary Stage', 'Planform', 'Dimension', 'Profile'],
  ['Dynamic Equilibrium', 'Resilience'],
  ['Hydraulic Structure', 'Coarse Scale', 'Fine Scale'],
  ['Microbes', 'Macrophytes', 'Macroinvertebrates', 'Fish and Amphibians', 'Other Animals'],
]

/** The four functional condition scores and each variable's weight (each row sums to 1). */
export const CHATFIELD_FUNCTIONS = [
  { id: 'hydraulic', label: 'Hydraulic', weights: [0.3, 0, 0, 0.3, 0.05, 0, 0.1, 0.1, 0.15, 0] },
  { id: 'geomorphic', label: 'Geomorphic', weights: [0.15, 0.15, 0, 0.1, 0.15, 0.1, 0.1, 0.15, 0.1, 0] },
  { id: 'physicochemical', label: 'Physicochemical', weights: [0.15, 0.05, 0.25, 0.1, 0.1, 0.05, 0, 0.05, 0.05, 0.2] },
  { id: 'biotic', label: 'Biotic', weights: [0.2, 0, 0.15, 0.1, 0.1, 0.05, 0, 0.1, 0.1, 0.2] },
] as const

export const CHATFIELD_SV_COUNT = 32
export const CHATFIELD_MIN = 50
export const CHATFIELD_MAX = 100

export interface ChatfieldResult {
  variables: number[]
  hydraulic: number
  geomorphic: number
  physicochemical: number
  biotic: number
  overall: number
}

/** sv: the 32 SV scores in order (SV 1.1 to SV 10.5). */
export function chatfield(sv: readonly number[]): ChatfieldResult {
  const variables: number[] = []
  let k = 0
  for (const group of CHATFIELD_VARIABLES) {
    const s = sv.slice(k, k + group.length)
    k += group.length
    let sum = 0
    for (const x of s) sum += x
    variables.push(((sum / s.length) + Math.min(...s)) / 2)
  }
  const score = (w: readonly number[]): number => {
    let acc = 0
    for (let i = 0; i < 10; i++) acc += variables[i] * w[i]
    return acc / 50 - 1
  }
  const [hydraulic, geomorphic, physicochemical, biotic] = CHATFIELD_FUNCTIONS.map((f) => score(f.weights))
  return { variables, hydraulic, geomorphic, physicochemical, biotic, overall: (hydraulic + geomorphic + physicochemical + biotic) / 4 }
}
