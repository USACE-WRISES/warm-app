// Model Comparison against the Shiny app: the criteria scores and order on 401 queries (the first is the
// ERDC technical note's Figure 1), and keyword hits.
import { describe, expect, it } from 'vitest'
import { type Criteria, findModels, keywordHits, MODELS, rankByCriteria, score } from '../src/engine/finder'
import { fixture } from './helpers'

interface Query { region: string; type: string; instream: string[]; riparian: string[]; order: string[]; value: number[] }
const data = fixture<{ ids: string[]; criteria: Query[]; keywords: { keyword: string; hits: number[] }[] }>('finder.json')

/** The Shiny app's criteria as WARM's: "None" chose nothing (and a group with None in it counted for nothing). */
function criteria(q: Query): Criteria {
  const group = (g: string[]) => (g.includes('None') ? [] : g)
  return { region: q.region === 'None' ? '' : q.region, type: q.type === 'None' ? '' : q.type, instream: group(q.instream), riparian: group(q.riparian) }
}

describe('criteria ranking', () => {
  it('reads the 14 models in the table order', () => {
    expect(MODELS.map((m) => m.id)).toEqual(data.ids)
  })
  it("equals the Shiny app's scores and order on every query", () => {
    const bad: string[] = []
    for (const q of data.criteria) {
      const c = criteria(q)
      const values = MODELS.map((m) => score(m, c).value)
      if (values.some((v, i) => v !== q.value[i])) bad.push(`scores ${JSON.stringify(q)}`)
      const anyCriteria = c.region || c.type || c.instream.length || c.riparian.length
      if (anyCriteria && rankByCriteria(MODELS, c).map((m) => m.id).join() !== q.order.join()) bad.push(`order ${JSON.stringify(q)}`)
    }
    expect(bad).toEqual([])
    expect(data.criteria.length).toBe(401)
  })
  it('TN Figure 1: Midwest, analytical, adjacent land use, stream habitat, native and invasive species', () => {
    const c: Criteria = { region: 'Midwest', type: 'Analytical', instream: ['Adjacent Land Use'], riparian: ['Stream Habitat', 'Native/Invasive Species'] }
    expect(findModels(c, '').map((r) => r.model.id)).toEqual(['cottonwood', 'bosque', 'remm', 'appalachia', 'northern-rockies', 'resaca',
      'skokomish', 'mink', 'ouachita', 'rais', 'upper-mississippi', 'chatfield', 'lower-willamette', 'smurf'])
    const top = findModels(c, '')[0]
    expect(top.score.matched).toEqual(['region', 'type', 'Adjacent Land Use', 'Native/Invasive Species'])
  })
})

describe('keyword search', () => {
  it('counts the fields that contain the keyword, as plain text', () => {
    for (const k of data.keywords) {
      expect(MODELS.map((m) => keywordHits(m, k.keyword)), k.keyword).toEqual(k.hits)
    }
  })
  it('TN Figure 2: "Missouri" finds the Cottonwood model first; best matches first', () => {
    expect(findModels({ region: '', type: '', instream: [], riparian: [] }, 'Missouri')[0].model.id).toBe('cottonwood')
    const hits = findModels({ region: '', type: '', instream: [], riparian: [] }, 'riparian').map((r) => r.hits)
    expect(hits).toEqual([...hits].sort((a, b) => b - a))
  })
  it('special characters are plain text', () => {
    expect(() => findModels({ region: '', type: '', instream: [], riparian: [] }, '(sub')).not.toThrow()
    expect(findModels({ region: '', type: '', instream: [], riparian: [] }, '(sub)surface').map((r) => r.model.id)).toEqual(['remm'])
  })
})
