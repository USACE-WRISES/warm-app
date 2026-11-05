// The numeric building blocks against R: round(), approx() (through SMURF's curves) and mean().
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { SMURF_CURVES } from '../src/engine/data'
import { approx, evaluate } from '../src/engine/interp'
import { rround } from '../src/engine/rround'
import { rmean, rsum } from '../src/engine/stats'
import { fixture } from './helpers'

interface RoundCase { x: number; d0: number; d2: number; d3: number }
interface SmurfCase { instream: number[]; fauna: number[]; corridor: number[]; si: Record<'instream' | 'fauna' | 'corridor', number[]> }

describe("R's round()", () => {
  const cases = fixture<RoundCase[]>('round.json')
  it('equals R on every fixture value, ties included', () => {
    const bad = cases.filter((c) => rround(c.x) !== c.d0 || rround(c.x, 2) !== c.d2 || rround(c.x, 3) !== c.d3)
      .map((c) => `${c.x}: ${rround(c.x)} ${rround(c.x, 2)} ${rround(c.x, 3)} vs ${c.d0} ${c.d2} ${c.d3}`)
    expect(bad).toEqual([])
    expect(cases.length).toBeGreaterThan(400)
  })
  it('rounds exact ties to even, as R does', () => {
    expect(rround(0.5)).toBe(0)
    expect(rround(2.5)).toBe(2)
    expect(rround(0.125, 2)).toBe(0.12)
    expect(rround(0.375, 2)).toBe(0.38)
    expect(rround(-2.5)).toBe(-2)
  })
})

describe("R's approx(rule = 2) through SMURF's curves", () => {
  const cases = fixture<SmurfCase[]>('smurf.json')
  it('every suitability index equals ecorest SIcalc', () => {
    const bad: string[] = []
    for (const c of cases) {
      for (const m of ['instream', 'fauna', 'corridor'] as const) {
        c[m].forEach((x, k) => {
          const got = approx(SMURF_CURVES[m][k].points, x)
          if (got !== c.si[m][k]) bad.push(`${m}[${k}](${x}) = ${got}, R ${c.si[m][k]}`)
        })
      }
    }
    expect(bad).toEqual([])
  })
  it('holds the end values beyond the breakpoints and returns breakpoints exactly', () => {
    const pts = [[0, 0], [30, 0.5], [100, 0.9], [300, 1]] as const
    expect(approx(pts, -5)).toBe(0)
    expect(approx(pts, 5000)).toBe(1)
    expect(approx(pts, 30)).toBe(0.5)
    expect(approx(pts, 100)).toBe(0.9)
    expect(approx(pts, 65)).toBeCloseTo(0.7, 15)
  })
  it('stays between the bounding breakpoints (property)', () => {
    fc.assert(fc.property(fc.double({ min: -100, max: 2000, noNaN: true }), (x) => {
      const y = evaluate({ kind: 'linear', points: SMURF_CURVES.instream[1].points }, x)
      return y >= 0 && y <= 1
    }))
  })
})

describe('sums and means', () => {
  it('a compensated sum is exact where the plain one is not', () => {
    expect(rsum([1e16, 1, -1e16])).toBe(1)
    expect(rmean([0.1, 0.2, 0.3])).toBe(0.2)
  })
})
