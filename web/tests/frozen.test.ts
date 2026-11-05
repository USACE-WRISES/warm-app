// The golden fixtures are frozen: reference/make_fixtures.R writes them and npm run freeze records
// their hashes; nothing edits them by hand (CONTRIBUTING.md rule 5).
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const DIR = fileURLToPath(new URL('./fixtures/', import.meta.url))

describe('the golden fixtures', () => {
  it('match FROZEN.sha256, file for file', () => {
    const recorded = readFileSync(DIR + 'FROZEN.sha256', 'utf-8').trim().split('\n').map((l) => l.split(/\s+/))
    const files = readdirSync(DIR).filter((n) => n.endsWith('.json')).sort()
    expect(recorded.map((r) => r[1])).toEqual(files)
    for (const [hash, name] of recorded) {
      expect(createHash('sha256').update(readFileSync(DIR + name)).digest('hex'), name).toBe(hash)
    }
  })
})
