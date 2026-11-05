// What WARM writes and reads back: the CSV of sites, the CSV import, and the saved inputs file.
import { describe, expect, it } from 'vitest'
import { calculator } from '../src/calculators'
import type { Raw } from '../src/calculators/types'
import { parseCsv } from '../src/engine/csv'
import { gridColumns } from '../src/views/grid'
import { importSites, readSaved, savedFile, sitesCsv } from '../src/views/exportSites'

describe('sites to CSV and back', () => {
  const spec = calculator('lower-willamette')!
  const cols = gridColumns(spec, 'turtle')
  const sites: Raw[] = [
    { name: 'Reach 1, east', species: 'turtle', 'turtle.V1': '25', 'turtle.V2': '90', 'turtle.V3': '20', 'turtle.V4': '10', 'turtle.V5': 'none', acres: '52' },
    { name: 'Reach 2', species: 'turtle', 'turtle.V1': '60' },
  ]
  const csv = sitesCsv(spec, sites, cols)
  const rows = parseCsv(csv)

  it('writes a header, a row per site, the suitability indices and the results', () => {
    expect(rows[0][0]).toBe('Site')
    expect(rows[0]).toContain('Habitat suitability index (HSI)')
    expect(rows[0]).toContain('SI [V1]')
    expect(rows[1][0]).toBe('Reach 1, east')
    expect(Number(rows[1][rows[0].indexOf('Habitat units (HU)')])).toBeCloseTo(31.65, 2)
    // an incomplete site: no results
    expect(rows[2][rows[0].indexOf('Habitat suitability index (HSI)')]).toBe('')
  })
  it('a class is written as its label', () => {
    expect(rows[1][rows[0].findIndex((h) => h.includes('[V5]'))]).toBe('None')
  })
  it('reads its own CSV back', () => {
    const got = importSites(csv, cols)
    expect(got.sites.length).toBe(2)
    expect(got.sites[0]['turtle.V3']).toBe('20')
    expect(got.sites[0].name).toBe('Reach 1, east')
    expect(got.ignored).toEqual(['Habitat suitability index (HSI)', 'Habitat units (HU)'])
  })
  it('reads a spreadsheet whose columns are the codes', () => {
    const got = importSites('Site,V1,V2,V3,V4,V5,Acres\nA,25,90,20,10,None,52\n', cols)
    expect(got.sites[0]).toEqual({ name: 'A', 'turtle.V1': '25', 'turtle.V2': '90', 'turtle.V3': '20', 'turtle.V4': '10', 'turtle.V5': 'None', acres: '52' })
  })
})

describe('the saved inputs file', () => {
  it('saves and opens', () => {
    const spec = calculator('smurf')!
    const text = savedFile(spec, [{ name: 'Left bank', area: '10' }])
    const got = readSaved(text)
    expect(typeof got).toBe('object')
    if (typeof got === 'object') expect(got.sites[0]).toEqual({ name: 'Left bank', area: '10' })
  })
  it('refuses what is not a WARM file', () => {
    expect(readSaved('not json')).toMatch(/not a WARM inputs file/)
    expect(readSaved('{"app":"WARM","calculator":"nope","sites":[]}')).toMatch(/does not have/)
  })
})
