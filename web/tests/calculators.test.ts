// The calculators as the pages use them: every worked example through the same checking and
// computing the form does (the ERDC technical note's Table 2 values), the setup choices, validation,
// and the Resaca species table's totals.
import { describe, expect, it } from 'vitest'
import { CALCULATORS, calculator } from '../src/calculators'
import { RESACA, speciesKey, speciesTotals, withSpeciesTotals } from '../src/calculators/resaca'
import { evaluateSite, matchCategory, parseNumber, parseValue, type Raw } from '../src/calculators/types'
import { rround } from '../src/engine/rround'

const run = (id: string, raw: Raw) => evaluateSite(calculator(id)!, id === 'resaca' ? withSpeciesTotals(raw) : raw)

describe('every calculator', () => {
  it('has the parts a page needs', () => {
    expect(CALCULATORS.length).toBe(9)
    for (const c of CALCULATORS) {
      expect(c.outputs.filter((o) => o.primary).length, c.id).toBe(1)
      expect(c.citations.length, c.id).toBeGreaterThan(0)
      expect(new Set(c.variables.map((v) => v.id)).size, `${c.id}: unique ids`).toBe(c.variables.length)
      for (const v of c.variables) {
        expect(v.label, `${c.id}.${v.id}`).toBeTruthy()
        if (!v.categories) expect(v.min !== undefined && v.max !== undefined, `${c.id}.${v.id} range`).toBe(true)
      }
    }
  })
  it('computes nothing until every shown input is valid', () => {
    for (const c of CALCULATORS) {
      const e = evaluateSite(c, {})
      expect(e.result, c.id).toBeNull()
      expect(e.missing.length, c.id).toBeGreaterThan(0)
    }
  })
})

describe('the worked examples (ERDC technical note, Table 2)', () => {
  const value = (id: string, out: string) => {
    const c = calculator(id)!
    const e = run(id, c.example!.raw)
    expect(e.errors, id).toEqual({})
    expect(e.missing, id).toEqual([])
    return e.result!.values[out]!
  }
  it('Chatfield 0.34', () => expect(rround(value('chatfield', 'overall'), 2)).toBe(0.34))
  it('Cottonwood 0.59', () => expect(rround(value('cottonwood', 'eri'), 2)).toBe(0.59))
  it('Lower Willamette 0.61 and 31.65', () => {
    expect(rround(value('lower-willamette', 'hsi'), 2)).toBe(0.61)
    expect(rround(value('lower-willamette', 'hu'), 2)).toBe(31.65)
  })
  it('Modified Mink 0.70', () => {
    expect(rround(value('mink', 'hsi'), 2)).toBe(0.7)
    expect(value('mink', 'water')).toBe(1)
  })
  it('Resaca 0.39', () => expect(rround(value('resaca', 'rrci'), 2)).toBe(0.39))
  it('Skokomish 0.84 and 183.96', () => {
    expect(rround(value('skokomish', 'hqi'), 2)).toBe(0.84)
    expect(rround(value('skokomish', 'hu'), 2)).toBe(183.96)
  })
  it('Upper Mississippi 0.33 and 33', () => {
    expect(rround(value('upper-mississippi', 'hsi'), 2)).toBe(0.33)
    expect(rround(value('upper-mississippi', 'hu'), 2)).toBe(33)
  })
  it('SMURF, from the report\'s module tests: 0.74, 0.48 and 0.36', () => {
    expect(rround(value('smurf', 'instream'), 2)).toBe(0.74)
    expect(rround(value('smurf', 'fauna'), 2)).toBe(0.48)
    expect(rround(value('smurf', 'corridor'), 2)).toBe(0.36)
  })
})

describe('setup choices', () => {
  it('Bosque shows the cover type\'s own variables', () => {
    const forest = run('bosque', { cover: '2' }).fields.map((f) => f.id)
    const marsh = run('bosque', { cover: 'Type 6: meadow, grassland and marsh' }).fields.map((f) => f.id)
    expect(forest).toContain('DEPTHOM')
    expect(marsh).toContain('CANSEDGE')
    expect(marsh).not.toContain('DEPTHOM')
    expect(run('bosque', {}).fields.map((f) => f.id)).toEqual(['cover'])
  })
  it('Cottonwood: under 2 years scores 0 with no other input', () => {
    const e = run('cottonwood', { age: '1' })
    expect(e.result?.values.eri).toBe(0)
  })
  it('Skokomish asks only for the limiting factor\'s variables', () => {
    expect(run('skokomish', { factor: 'floodplain' }).fields.map((f) => f.id)).toEqual(['factor', 'V3', 'V4', 'acres'])
    expect(run('skokomish', { factor: 'Channel Capacity and In-Channel Habitat' }).fields.map((f) => f.id)).toEqual(['factor', 'V1', 'V2', 'V5', 'acres'])
  })
  it('Mink: large forested wetlands do not ask for V5', () => {
    expect(run('mink', { model: 'forested', 'allen.area': '500' }).fields.map((f) => f.id)).not.toContain('allen.V5')
    expect(run('mink', { model: 'forested', 'allen.area': '50' }).fields.map((f) => f.id)).toContain('allen.V5')
  })
  it('Lower Willamette accepts WARM 1.x\'s class names', () => {
    const e = run('lower-willamette', { species: 'amphibians', 'amphibians.V6': 'Fallow Grass/herbs' })
    expect(e.parsed['amphibians.V6']).toBe('fallow')
  })
})

describe('checking inputs', () => {
  it('reads numbers as people type them', () => {
    expect(parseNumber('0.5')).toBe(0.5)
    expect(parseNumber(' 75% ')).toBe(75)
    expect(parseNumber('1,250')).toBe(1250)
    expect(parseNumber('.25')).toBe(0.25)
    expect(parseNumber('eighty')).toBeNull()
    expect(parseNumber('1,2')).toBeNull()
  })
  it('says what is wrong, in plain words', () => {
    const v = calculator('bosque')!.variables.find((x) => x.id === 'DEPTHGW')!
    expect(parseValue(v, '1.2')).toEqual({ error: 'Enter a number from 0 to 1.' })
    expect(parseValue(v, 'abc')).toEqual({ error: 'Enter a number from 0 to 1.' })
    expect(parseValue(v, '0.75')).toEqual({ value: 0.75 })
  })
  it('TN Table 2, invalid cases: text and unknown classes give no result', () => {
    expect(run('mink', { model: 'modified', 'mod.SIV1': 'eighty', 'mod.SIV5': '65', 'mod.SIV6': 'fifty six', 'mod.Vstream': '0.7' }).result).toBeNull()
    const lw = run('lower-willamette', { species: 'turtle', 'turtle.V1': '25', 'turtle.V2': '90', 'turtle.V3': '20', 'turtle.V4': '10', 'turtle.V5': '0', acres: '52' })
    expect(lw.result).toBeNull()
    expect(lw.errors['turtle.V5']).toMatch(/Choose one of/)
  })
  it('matches a category by its value, label, alias or a unique start of its label', () => {
    const cats = calculator('resaca')!.variables.find((v) => v.id === 'habitat')!.categories!
    expect(matchCategory(cats, 'stpw')?.value).toBe('STPW')
    expect(matchCategory(cats, 'Subtropical')?.value).toBe('STPW')
    expect(matchCategory(cats, 'Texas')).toBeUndefined()
  })
})

describe('the Resaca species table', () => {
  it('counts every species present and sums the reference species\' SSI', () => {
    const raw: Raw = { habitat: 'TERF', [speciesKey(1, 'comp')]: '20', [speciesKey(1, 'ssi')]: '1', [speciesKey(2, 'comp')]: '5', [speciesKey(2, 'ssi')]: '0.5', [speciesKey(0, 'comp')]: '3' }
    // Huisache and Vasey's Adelia are on the forest's list; Anglestem Indianmallow is not
    expect(speciesTotals(raw, 'TERF')).toEqual({ present: 3, ssiSum: 1.5, needSsi: [], invalid: [] })
  })
  it('waits for the SSI of every present reference species', () => {
    const t = speciesTotals({ habitat: 'TERF', [speciesKey(1, 'comp')]: '20' }, 'TERF')
    expect(t.needSsi).toEqual([1])
    expect(t.ssiSum).toBeNull()
    expect(evaluateSite(RESACA, withSpeciesTotals({ habitat: 'TERF', [speciesKey(1, 'comp')]: '20' })).missing).toContain('ssiSum')
  })
})
