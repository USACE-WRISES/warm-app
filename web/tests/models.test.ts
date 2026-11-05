// The nine calculators' engines against WARM 1.x (the golden fixtures from reference/legacy.R), value
// for value wherever WARM 2.0 keeps WARM 1.x's arithmetic; each documented fix pinned to its source
// value (docs/changes-from-1x.md); and the worked examples of the ERDC technical note (Table 2) and
// the source reports.
import { describe, expect, it } from 'vitest'
import { bosque, type BosqueCover, bosqueVariables } from '../src/engine/models/bosque'
import { chatfield } from '../src/engine/models/chatfield'
import { cottonwood } from '../src/engine/models/cottonwood'
import { lowerWillamette, lwSpecies } from '../src/engine/models/lowerWillamette'
import { minkAllen, minkModified } from '../src/engine/models/mink'
import { resaca, type ResacaHabitat } from '../src/engine/models/resaca'
import { skokomish, type SkokomishFactor } from '../src/engine/models/skokomish'
import { smurf, smurfModules } from '../src/engine/models/smurf'
import { upperMississippi } from '../src/engine/models/upperMississippi'
import { rround } from '../src/engine/rround'
import { close, fixture } from './helpers'

type Rec = Record<string, number>
const nn = (x: number | null | undefined): number | null => (x === undefined ? null : x)

describe('Bosque Rio Grande', () => {
  const cases = fixture<{ cover: number; inputs: Rec; out: { hydro: number; biota: number; spatial: number; hsi: number } }[]>('bosque.json')
  it('equals WARM 1.x on every case (both cover-type equations)', () => {
    const bad = cases.filter((c) => {
      const r = bosque(c.cover as BosqueCover, c.inputs)
      return !close(r.hydro, c.out.hydro) || !close(r.biota, c.out.biota) || !close(r.spatial, c.out.spatial) || !close(r.hsi, c.out.hsi)
    })
    expect(bad).toEqual([])
    expect(new Set(cases.map((c) => c.cover)).size).toBe(6)
  })
  it('uses the right variables for each cover type (Table 3)', () => {
    expect(bosqueVariables(6)).toContain('CANSHRUB')
    expect(bosqueVariables(6)).toContain('CANSEDGE')
    expect(bosqueVariables(1)).not.toContain('CANSEDGE')
    expect(bosqueVariables(3)).toContain('DEPTHOM')
    expect(bosqueVariables(6).length).toBe(15)
    expect(bosqueVariables(1).length).toBe(17)
  })
})

describe('Cottonwood Missouri', () => {
  const cases = fixture<{ age: number; inputs: Rec; out: { hydro: number | null; biota: number | null; spatial: number | null; eri: number } }[]>('cottonwood.json')
  it('equals WARM 1.x on every case (mature, young and under 2 years)', () => {
    const bad = cases.filter((c) => {
      const r = cottonwood(c.age, c.inputs)
      return !close(r.eri, c.out.eri) || !close(r.hydro, nn(c.out.hydro)) || !close(r.biota, nn(c.out.biota)) || !close(r.spatial, nn(c.out.spatial))
    })
    expect(bad).toEqual([])
  })
  it('TN Table 2: age 30 and 13 indices give ERI 0.59', () => {
    const names = ['LCPI', 'DEPTHGW', 'RICHNATIVE', 'CVALUE', 'WIS', 'CANHERB', 'CANSHRUB', 'ADJLANDUSE', 'PATCHSIZE', 'DISPATCH', 'PROPCTW', 'RECRUIT', 'INTERSPERS']
    const values = [0.6, 0.8, 0.3, 0.6, 0.1, 0.2, 0.7, 0.3, 0.9, 1, 0.6, 0.6, 0.6]
    const r = cottonwood(30, Object.fromEntries(names.map((n, i) => [n, values[i]])))
    expect(r.stage).toBe('mature')
    expect(rround(r.eri, 2)).toBe(0.59)
  })
})

describe('Chatfield', () => {
  const cases = fixture<{ sv: number[]; out: { v: number[]; fcs: number[]; overall: number } }[]>('chatfield.json')
  it('equals WARM 1.x on every case', () => {
    const bad = cases.filter((c) => {
      const r = chatfield(c.sv)
      const fcs = [r.hydraulic, r.geomorphic, r.physicochemical, r.biotic]
      return !close(r.overall, c.out.overall) || fcs.some((f, i) => !close(f, c.out.fcs[i])) || r.variables.some((v, i) => !close(v, c.out.v[i]))
    })
    expect(bad).toEqual([])
  })
  it('TN Table 2: the 32 scores give an overall score of 0.34', () => {
    const sv = [85, 75, 55, 85, 65, 50, 95, 55, 60, 70, 90, 80, 70, 65, 65, 70, 95, 90, 90, 80, 55, 85, 70, 65, 80, 55, 90, 95, 50, 60, 75, 90]
    const r = chatfield(sv)
    expect(r.overall).toBeCloseTo(0.33733, 4)
    expect(rround(r.overall, 2)).toBe(0.34)
  })
})

describe('Modified Mink (riverine)', () => {
  const cases = fixture<{ siv1: number; siv5: number; siv6: number; vstream: number; out: { si1: number; si5: number; si6: number; cover: number; water: number; hsi: number } }[]>('mink_modified.json')
  it('equals WARM 1.x on every case but SIV6 between 5 and 5.1 percent', () => {
    const bad = cases.filter((c) => !(c.siv6 >= 5 && c.siv6 < 5.1)).filter((c) => {
      const r = minkModified({ SIV1: c.siv1, SIV5: c.siv5, SIV6: c.siv6, Vstream: c.vstream })
      return !close(r.si.SIV1, c.out.si1) || !close(r.si.SIV5, c.out.si5) || !close(r.si.SIV6, c.out.si6)
        || !close(r.cover, c.out.cover) || !close(r.water, c.out.water) || !close(r.hsi, c.out.hsi)
    })
    expect(bad).toEqual([])
  })
  it('TN Table 2: 80, 65, 56 and 0.7 give cover 0.70, water 1, HSI 0.70', () => {
    const r = minkModified({ SIV1: 80, SIV5: 65, SIV6: 56, Vstream: 0.7 })
    expect([rround(r.cover, 2), r.water, rround(r.hsi, 2)]).toEqual([0.7, 1, 0.7])
  })
  it('SIV6 is 0.05 up to 5 percent, then rises to 1 (Figure 3)', () => {
    const r = (x: number) => minkModified({ SIV1: 80, SIV5: 80, SIV6: x, Vstream: 1 }).si.SIV6
    expect(r(0)).toBe(0.05)
    expect(r(5)).toBe(0.05)
    expect(r(50)).toBeCloseTo(0.5, 12)
    expect(r(100)).toBe(1)
  })
})

describe('Mink, Allen (1986)', () => {
  const cases = fixture<{ area: number; v: number[]; out: Record<string, number> }[]>('mink_allen.json')
  const vars = (v: number[]) => ({ V1: v[0], V2: v[1], V3: v[2], V4: v[3], V5: v[4], V6: v[5] })
  it('variable indices and the unchanged cover equations equal WARM 1.x', () => {
    const bad = cases.filter((c) => {
      const riv = minkAllen('riverine', c.area, vars(c.v))
      const emerg = minkAllen('emergent', c.area, vars(c.v))
      const forest = minkAllen('forested', 100, vars(c.v))
      const si = { ...riv.si, ...emerg.si, ...forest.si }
      const sis = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'].every((k, i) => close(si[k], c.out[`si${i + 1}`]))
      const sifs2 = c.area < 405 ? close(minkAllen('forested', c.area, vars(c.v)).cover, c.out.sifs2) : true
      return !sis || !close(riv.cover, c.out.sirl) || !close(emerg.cover, c.out.sipe) || !sifs2
    })
    expect(bad).toEqual([])
  })
  it('fix: the HSI is the lower of water and cover (WARM 1.x always gave 0)', () => {
    expect(cases.every((c) => c.out.hsi === 0)).toBe(true)
    const r = minkAllen('riverine', null, { V1: 100, V5: 100, V6: 64 })
    expect(r.hsi).toBeCloseTo(0.8, 12)
  })
  it('fix: large forested wetlands use min(1, SIV2 + SIV3 + SIV4)', () => {
    const r = minkAllen('forested', 500, { V1: 100, V2: 0, V3: 0, V4: 25 })
    // SIV2 = SIV3 = 0.1 and SIV4 = 0.5: WARM 1.x took the smallest (0.1)
    expect(r.cover).toBeCloseTo(0.7, 12)
    expect(minkAllen('forested', 500, { V1: 100, V2: 80, V3: 80, V4: 60 }).cover).toBe(1)
  })
})

const REGIME: Record<string, number> = { 'Permanent/Connected': 1, 'Semipermanent/Disconnected': 0.5, Dry: 0 }

describe('Resaca', () => {
  const cases = fixture<{ habitat: ResacaHabitat; slope: number; bank: number; ssi: number; rich: number; ripcan: number; aqcan: number; invasives: number; regime: string; depth: number; out: Record<string, number> }[]>('resaca.json')
  it('equals WARM 1.x on every case', () => {
    const bad = cases.filter((c) => {
      const r = resaca({ habitat: c.habitat, slope: c.slope, bank: c.bank, ssiSum: c.ssi, present: c.rich, ripcan: c.ripcan,
        aqcan: c.aqcan, invasives: c.invasives, regime: REGIME[c.regime], depth: c.depth })
      return !close(r.slope, c.out.slope) || !close(r.bank, c.out.bank) || !close(r.composition, c.out.composition)
        || !close(r.richness, c.out.richness) || !close(r.ripcan, c.out.ripcan) || !close(r.aqcan, c.out.aqcan)
        || !close(r.invasives, c.out.invasives) || !close(r.depth, c.out.depth) || !close(r.rrci, c.out.rrci)
    })
    expect(bad).toEqual([])
  })
  it('TN Figure 4: slope 2, bank canopy 2 and riparian canopy 30 score 0.13, 0.03 and 0.35', () => {
    const r = resaca({ habitat: 'STPW', slope: 2, bank: 2, ssiSum: 0, present: 2, ripcan: 30, aqcan: 12, invasives: 38, regime: 1, depth: 2 })
    expect([rround(r.slope, 2), rround(r.bank, 2), rround(r.ripcan, 2)]).toEqual([0.13, 0.03, 0.35])
    // TN Table 2: the same site with two species present scores 0.39
    expect(rround(r.rrci, 2)).toBe(0.39)
  })
})

const FACTOR: Record<string, SkokomishFactor> = {
  'In-Channel Habitat': 'inChannel', 'Floodplain Habitat': 'floodplain', 'Channel Capacity and In-Channel Habitat': 'capacityInChannel',
}

describe('Skokomish', () => {
  const cases = fixture<{ factor: string; acres: number; pools: number; wood: number; riparian: number; connectivity: number; capacity: number; out: { hqi: number; hu: number } }[]>('skokomish.json')
  it("equals WARM 1.x on every case (the report's numbering: V1 wood, V2 pools, V3 connectivity, V4 riparian cover)", () => {
    const bad = cases.filter((c) => {
      const r = skokomish(FACTOR[c.factor], { V1: c.wood, V2: c.pools, V3: c.connectivity, V4: c.riparian, V5: c.capacity }, c.acres)
      return !close(r.hqi, c.out.hqi) || !close(r.hu, c.out.hu)
    })
    expect(bad).toEqual([])
  })
  it('TN Table 2: 219 acres give HQI 0.84 and 183.96 habitat units', () => {
    const r = skokomish('capacityInChannel', { V1: 0.72, V2: 0.83, V5: 0.97 }, 219)
    expect(r.hqi).toBeCloseTo(0.84, 12)
    expect(r.hu).toBeCloseTo(183.96, 9)
  })
  it('the report: K1 0.95 (Table 15), B0 0.34 and B1 0.91 (Table 16)', () => {
    expect(rround(skokomish('capacityInChannel', { V1: 0.93, V2: 0.93, V5: 1 }, null).hqi, 2)).toBe(0.95)
    expect(rround(skokomish('floodplain', { V3: 0, V4: 0.68 }, null).hqi, 2)).toBe(0.34)
    expect(rround(skokomish('floodplain', { V3: 0.94, V4: 0.88 }, null).hqi, 2)).toBe(0.91)
  })
})

describe('SMURF', () => {
  const cases = fixture<{ area: number; instream: number[]; fauna: number[]; corridor: number[]; out: Record<string, number> }[]>('smurf.json')
  it('equals WARM 1.x (ecorest, rounded to 3 decimals) on every case', () => {
    const bad = cases.filter((c) => {
      const r = smurfModules(c.instream, c.fauna, c.corridor, c.area)
      return r.instream !== c.out.instream || r.fauna !== c.out.fauna || r.corridor !== c.out.corridor || r.hsi !== c.out.hsi
        || r.area !== c.out.area || r.hu !== c.out.hu
    }).map((c) => JSON.stringify(c))
    expect(bad).toEqual([])
  })
  it('canopy structure entered once feeds both modules', () => {
    const v: Rec = { hydatt: 1.5, stripwidth: 120, flowpath: 12, shading: 5, cancov: 20, canstr: 1, carbret: 10, deadfall: 20, snag: 2,
      batcan: 0, embed: 2, detritus: 15, herb: 17, invveg: 8, bufdev: 0, edge: 0.005, corridorwidth: 25, corridormin: 20 }
    const r = smurf(v, 10)
    expect(r.si.instream[5]).toBe(r.si.fauna[0])
  })
  // the SMURF report's tests (Tables 5 to 7), its values printed to 2 decimals
  const within = (got: number, want: number) => Math.abs(got - want) <= 0.0051
  it('the report, Table 5 (instream module)', () => {
    const rows: [number[], number][] = [[[1.5, 120, 12, 5, 20, 1, 10], 0.74], [[0.5, 25, 6, 2, 5, 6, 4], 0.6], [[2.0, 250, 18, 4, 15, 3, 20], 0.83],
      [[6.0, 250, 14, 3, 10, 2, 16], 0.62], [[3.0, 75, 2, 1, 10, 4, 12], 0.52]]
    for (const [x, want] of rows) expect(within(smurfModules(x, [6, 20, 20, 4, 20, 20, 20, 20], [20, 0, 300, 100], 1).instream, want), String(x)).toBe(true)
  })
  it('the report, Table 6 (fauna module)', () => {
    const rows: [number[], number][] = [[[6, 20, 2, 0, 2, 15, 17, 8], 0.52], [[0, 11, 5, 1, 12, 18, 1, 9], 0.38], [[1, 3, 10, 2, 20, 10, 15, 5], 0.48],
      [[4, 6, 15, 3, 5, 8, 11, 14], 0.55], [[2, 17, 20, 4, 15, 17, 18, 19], 0.83]]
    for (const [x, want] of rows) expect(within(smurfModules([1, 300, 20, 1, 20, 6, 20], x, [20, 0, 300, 100], 1).fauna, want), String(x)).toBe(true)
  })
  it('the report, Table 7 (corridor module)', () => {
    const rows: [number[], number][] = [[[0, 0.005, 25, 20], 0.36], [[20, 0.04, 750, 100], 0.82], [[5, 0.01, 85, 60], 0.65],
      [[10, 0.02, 125, 100], 0.85], [[15, 0.03, 245, 200], 0.88]]
    for (const [x, want] of rows) expect(within(smurfModules([1, 300, 20, 1, 20, 6, 20], [6, 20, 20, 4, 20, 20, 20, 20], x, 1).corridor, want), String(x)).toBe(true)
  })
  it('the report, Table 4: worst and best inputs give 0 and 1; HU follows the area', () => {
    const worst = { i: [3, 0, 0, 0, 0, 0, 0], f: [0, 0, 0, 0, 0, 0, 0, 0], c: [0, 0.2, 0, 0] }
    const best = { i: [1, 300, 20, 1, 20, 6, 20], f: [6, 20, 20, 4, 20, 20, 20, 20], c: [20, 0, 300, 100] }
    for (const [i, f, c] of [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1]]) {
      const r = smurfModules(i ? best.i : worst.i, f ? best.f : worst.f, c ? best.c : worst.c, 100)
      expect([r.instream, r.fauna, r.corridor, r.hsi, r.hu]).toEqual([i, f, c, 0, 0])
    }
    for (const area of [100, 0, 50]) {
      const r = smurfModules(best.i, best.f, best.c, area)
      expect([r.instream, r.fauna, r.corridor, r.hsi, r.hu]).toEqual([1, 1, 1, 1, area])
    }
  })
})

describe('Upper Mississippi', () => {
  type Um = { canopy: number; forest: number; invasive: number; regen: number; structure: number[]; area: number; out: Record<string, number> }
  const cases = fixture<Um[]>('uppermiss.json')
  const run = (c: Um) => upperMississippi({ canopy: c.canopy, forest: c.forest, invasive: c.invasive, regen: c.regen,
    horizontal: c.structure[0], vertical: c.structure[1], sizeClass: c.structure[2], deadWood: c.structure[3], species: c.structure[4] }, c.area)
  it('equals WARM 1.x wherever no fix applies', () => {
    const bad = cases.filter((c) => c.canopy < 90 && !(c.forest >= 40 && c.forest < 75)).filter((c) => {
      const r = run(c)
      return !close(r.si.canopy, c.out.canopy) || !close(r.si.forest, c.out.forest) || !close(r.si.invasive, c.out.invasive)
        || !close(r.si.regen, c.out.regen) || !close(r.structure, c.out.structure) || !close(r.hsi, c.out.hsi) || !close(r.hu, c.out.hu)
    })
    expect(bad).toEqual([])
  })
  it('desired forest type between 60 and 75 percent: the exact slope (WARM 1.x rounded it to 0.0133)', () => {
    const bad = cases.filter((c) => c.canopy < 90 && c.forest >= 60 && c.forest < 75).filter((c) => !close(run(c).si.forest, c.out.forest, 0.0026))
    expect(bad).toEqual([])
  })
  it('fix: canopy cover of 90 percent or more scores 0.8', () => {
    const r = (x: number) => upperMississippi({ canopy: x, forest: 0, invasive: 0, regen: 0, horizontal: 0, vertical: 0, sizeClass: 0, deadWood: 0, species: 0 }, null).si.canopy
    expect([r(85), r(90), r(95), r(100)].map((x) => rround(x, 9))).toEqual([0.9, 0.8, 0.8, 0.8])
  })
  it('fix: desired forest type of 50 percent scores 0.45', () => {
    const r = upperMississippi({ canopy: 0, forest: 50, invasive: 0, regen: 0, horizontal: 0, vertical: 0, sizeClass: 0, deadWood: 0, species: 0 }, null)
    expect(r.si.forest).toBeCloseTo(0.45, 12)
  })
  it('TN Table 2: 5, 5, 0, 0 and structure 0.4, 0.6, 0.8, 0.2, 1 on 100 acres give HSI 0.33 and 33 HU', () => {
    const r = upperMississippi({ canopy: 5, forest: 5, invasive: 0, regen: 0, horizontal: 0.4, vertical: 0.6, sizeClass: 0.8, deadWood: 0.2, species: 1 }, 100)
    expect(r.hsi).toBeCloseTo(0.33, 12)
    expect(r.hu).toBeCloseTo(33, 9)
  })
})

describe('Lower Willamette', () => {
  type Lw = { species: string; v: (string | number)[]; acres: number; out: { si: (number | null)[]; hsi: number | null; hu: number | null } }
  const cases = fixture<Lw[]>('lowerwill.json')
  const ID: Record<string, string> = { 'Western Pond Turtle': 'turtle', Beaver: 'beaver', 'Wood Duck': 'woodDuck', 'Yellow Warbler': 'yellowWarbler', 'Native Amphibians': 'amphibians' }
  const CAT: Record<string, string> = { None: 'none', 'Very few': 'very-few', Sparse: 'sparse', Moderate: 'moderate', Abundant: 'abundant',
    Developed: 'developed', 'Row Crops': 'row-crops', 'Managed Pasture': 'pasture', 'Fallow Grass/herbs': 'fallow', 'Shrubs/trees': 'shrubs-trees', A: 'A', B: 'B', C: 'C' }
  const value = (x: string | number): string | number => (typeof x === 'string' && CAT[x] ? CAT[x] : Number(x))
  /** Where WARM 2.0 follows the report and WARM 1.x did not. */
  const changed = (species: string, k: number, x: number): boolean =>
    (species === 'turtle' && k === 1 && x > 0 && x < 25)
    || (species === 'yellowWarbler' && k === 1 && [20, 40, 60, 70, 80].includes(x))
    || (species === 'yellowWarbler' && k === 2 && !(x <= 0 || x === 1 || x >= 2))
    || (species === 'amphibians' && k === 3 && x > 0 && x < 30)

  it('every variable index equals WARM 1.x except where the report differs, and so does the HSI', () => {
    const bad: string[] = []
    for (const c of cases) {
      const sp = lwSpecies(ID[c.species])!
      const values = Object.fromEntries(sp.variables.map((v, k) => [v.id, value(c.v[k])]))
      const r = lowerWillamette(sp, values, c.acres)
      let unchanged = true
      sp.variables.forEach((v, k) => {
        const x = values[v.id]
        if (typeof x === 'number' && changed(sp.id, k, x)) {
          unchanged = false
          return
        }
        if (!close(r.si[v.id], c.out.si[k])) bad.push(`${sp.id} ${v.id}=${x}: ${r.si[v.id]} vs ${c.out.si[k]}`)
      })
      if (unchanged && (!close(r.hsi, c.out.hsi) || !close(r.hu, c.out.hu))) bad.push(`${sp.id} HSI ${r.hsi} vs ${c.out.hsi}`)
    }
    expect(bad).toEqual([])
  })
  it('TN Table 2: western pond turtle on 52 acres (25, 90, 20, 10, none) gives HSI 0.61 and 31.65 HU', () => {
    const r = lowerWillamette(lwSpecies('turtle')!, { V1: 25, V2: 90, V3: 20, V4: 10, V5: 'none' }, 52)
    expect(r.hsi).toBeCloseTo(0.60867, 5)
    expect(rround(r.hu!, 2)).toBe(31.65)
  })
  it('fixes pinned to the report', () => {
    const si = (sp: string, id: string, x: number | string) => lowerWillamette(lwSpecies(sp)!, {
      ...Object.fromEntries(lwSpecies(sp)!.variables.map((v) => [v.id, v.categories ? v.categories[0].value : 0])), [id]: x }, null).si[id]
    expect(si('turtle', 'V2', 12.5)).toBeCloseTo(0.1, 12) // p. 29: 0 to 0.2 over 0 to 25 percent
    expect(si('yellowWarbler', 'V3', 1.5)).toBeCloseTo(0.75, 12) // p. 32
    expect(si('yellowWarbler', 'V2', 20)).toBe(0) // the 0-20 range includes 20
    expect(si('amphibians', 'V4', 10)).toBeCloseTo(0.2, 12) // p. 33
    expect(si('beaver', 'V1', 100)).toBe(0.6) // p. 30
    expect(si('salmonidTributary', 'FV1', 15)).toBeCloseTo(0.95, 12) // p. 34: adults 0.9, juveniles 1.0
    expect(si('salmonidTributary', 'FV1', 12.5)).toBeCloseTo(0.95, 12)
    expect(si('salmonidTributary', 'FV2', 12.5)).toBeCloseTo(0.4, 12)
    expect(si('salmonidMainstem', 'V1', 2)).toBe(1)
    expect(si('salmonidMainstem', 'V1', 0.5)).toBe(0.5)
    expect(si('salmonidMainstem', 'V2', 'sand')).toBe(1)
    expect(si('salmonidMainstem', 'V2', 'riprap')).toBe(0.35)
    expect(si('salmonidMainstem', 'V3', 25)).toBe(1)
    expect(si('salmonidMainstem', 'V3', 81)).toBe(0.1)
  })
})
