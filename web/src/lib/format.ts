// Numbers as the pages show them, and as the files carry them.

/** A value with a fixed number of decimals; n/a when there is none. */
export function fmt(x: number | null | undefined, digits = 3): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return 'n/a'
  const t = x.toFixed(digits)
  return /^-0\.?0*$/.test(t) ? t.slice(1) : t
}

/** A value for a file: up to 15 significant digits, trailing zeros dropped; empty when there is none. */
export function full(x: number | null | undefined): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return ''
  return String(Number(x.toPrecision(15)))
}

/** 1 site, 2 sites. */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

/** A file name from a site or calculator name: letters, digits and dashes. */
export function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'warm'
}

/** Today as YYYY-MM-DD, for file names. */
export function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
