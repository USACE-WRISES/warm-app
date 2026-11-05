// A small CSV reader (RFC 4180): quoted fields may hold commas, line breaks and doubled quotes.
// The app's data tables (web/data) are read with it, and so are sites a person imports.

/** The rows of a CSV text, each a list of fields (a trailing empty line is dropped). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += c
      }
    } else if (c === '"' && field === '') {
      quoted = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** The rows of a CSV text with a header, as records keyed by the header's names. */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(text)
  if (!header) return []
  return rows.filter((r) => r.some((f) => f.trim() !== '')).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

/** One CSV field: quoted when it holds a comma, a quote or a line break. */
export function csvField(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** A table as CSV text (CRLF line ends, as spreadsheets write them). */
export function toCsv(rows: readonly (readonly (string | number | null | undefined)[])[]): string {
  return rows.map((r) => r.map(csvField).join(',')).join('\r\n') + '\r\n'
}
