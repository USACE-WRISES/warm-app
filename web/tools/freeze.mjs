// Records the golden fixtures' sha256 in web/tests/fixtures/FROZEN.sha256, after
// reference/make_fixtures.R has written them (web/tests/frozen.test.ts checks the record).
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DIR = fileURLToPath(new URL('../tests/fixtures/', import.meta.url))
const lines = readdirSync(DIR).filter((n) => n.endsWith('.json')).sort()
  .map((n) => `${createHash('sha256').update(readFileSync(DIR + n)).digest('hex')}  ${n}`)
writeFileSync(DIR + 'FROZEN.sha256', lines.join('\n') + '\n')
console.log(`recorded ${lines.length} fixtures`)
