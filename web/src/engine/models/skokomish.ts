// Skokomish River Ecosystem Restoration Project Environmental Benefits Analysis: Klimas, C., B. Yuill,
// N. Gleason, C. Barrow, and F. Goetz. 2013. ERDC and USACE Seattle District. Inputs are suitability
// indices (0 to 1), numbered as the report numbers them (Figure 27, Tables 15 to 17); the habitat
// quality index (HQI) averages the variables of the assessment area's limiting factor, and habitat
// units are HQI times the affected acres (page 53).
import { si, type Variable } from '../variables'

export type SkokomishFactor = 'inChannel' | 'floodplain' | 'capacityInChannel'

export const SKOKOMISH_FACTORS: readonly { value: SkokomishFactor; label: string; variables: readonly string[]; note: string }[] = [
  { value: 'inChannel', label: 'In-channel habitat', variables: ['V1', 'V2'], note: 'HQI = (V1 + V2) / 2' },
  { value: 'floodplain', label: 'Floodplain habitat', variables: ['V3', 'V4'], note: 'HQI = (V3 + V4) / 2' },
  { value: 'capacityInChannel', label: 'Channel capacity and in-channel habitat', variables: ['V1', 'V2', 'V5'], note: 'HQI = (V1 + V2 + V5) / 3' },
]

export const SKOKOMISH_VARIABLES: readonly Variable[] = [
  si('V1', 'Large woody debris', { help: 'Pieces of large wood per meter of channel (the report scores 0.5 per meter or more as 1.0).' }),
  si('V2', 'Pool habitat', { help: 'Share of the surface area in pools (40 to 60 percent scores 1.0).' }),
  si('V3', 'Floodplain connectivity', { help: 'Share of the floodplain aquatic habitat still connected to the mainstem.' }),
  si('V4', 'Riparian cover', { help: 'Share of the 150 ft buffer in contiguous vegetation.' }),
  si('V5', 'Channel capacity', { help: 'Flood return interval the channel holds (2 years or more scores 1.0).' }),
]

export function skokomishFactor(f: SkokomishFactor) {
  return SKOKOMISH_FACTORS.find((x) => x.value === f)!
}

export function skokomish(factor: SkokomishFactor, v: Readonly<Record<string, number>>, acres: number | null): { hqi: number; hu: number | null } {
  const hqi = factor === 'inChannel' ? (v.V1 + v.V2) / 2
    : factor === 'floodplain' ? (v.V3 + v.V4) / 2
    : (v.V1 + v.V2 + v.V5) / 3
  return { hqi, hu: acres === null ? null : acres * hqi }
}
