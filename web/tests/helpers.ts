// Shared test helpers: the golden fixtures (written by reference/make_fixtures.R from WARM 1.x's
// R code and the ecorest package) and a tolerance check.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url))

export function fixture<T>(name: string): T {
  return JSON.parse(readFileSync(FIXTURES + name, 'utf-8')) as T
}

/** |a - b| within an absolute tolerance (1e-9 by default: the R and the TypeScript differ only in the
 * last bits of their sums). */
export function close(a: number | null | undefined, b: number | null | undefined, tol = 1e-9): boolean {
  if (a === null || a === undefined || b === null || b === undefined) return a === b || (a == null && b == null)
  return Math.abs(a - b) <= tol
}
