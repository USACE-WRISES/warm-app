// Suitability curves: piecewise linear breakpoints, step tables, and their evaluation.
//
// approx() is R's approx(x, y, xout, method = "linear", rule = 2), the interpolation ecorest's
// SIcalc() uses (and through it SMURF): linear between breakpoints, held flat beyond the first and
// last. It follows R's C code (approx1 in R's src/library/stats/src/approx.c) step for step: the
// same bisection, the same exact matches at breakpoints, and the same order of arithmetic, so it
// returns the same doubles (web/tests/interp.test.ts compares it with R).

export type Point = readonly [number, number]

/** A suitability curve. */
export type Curve =
  /** piecewise linear through the points (x ascending), held flat beyond the ends */
  | { readonly kind: 'linear'; readonly points: readonly Point[] }
  /** a step table: si[k] for x <= upTo[k] (the first k that fits), and si[upTo.length] above the last */
  | { readonly kind: 'steps'; readonly upTo: readonly number[]; readonly si: readonly number[] }
  /** the mean of several curves at the same x (Lower Willamette's tributary salmonid temperature) */
  | { readonly kind: 'mean'; readonly curves: readonly Curve[]; readonly labels: readonly string[] }
  /** a formula, drawn over the domain (Resaca's bank slope) */
  | { readonly kind: 'fn'; readonly f: (x: number) => number; readonly domain: readonly [number, number] }

export const linear = (...points: Point[]): Curve => ({ kind: 'linear', points })

/** R's approx(..., rule = 2) at v. */
export function approx(points: readonly Point[], v: number): number {
  const n = points.length
  if (!n || Number.isNaN(v)) return NaN
  let i = 0
  let j = n - 1
  if (v < points[i][0]) return points[i][1]
  if (v > points[j][0]) return points[j][1]
  while (i < j - 1) {
    const ij = Math.floor((i + j) / 2)
    if (v < points[ij][0]) j = ij
    else i = ij
  }
  if (v === points[j][0]) return points[j][1]
  if (v === points[i][0]) return points[i][1]
  const [xi, yi] = points[i]
  const [xj, yj] = points[j]
  return yi + (yj - yi) * ((v - xi) / (xj - xi))
}

/** A curve's suitability index at x. */
export function evaluate(curve: Curve, x: number): number {
  switch (curve.kind) {
    case 'linear':
      return approx(curve.points, x)
    case 'steps': {
      for (let k = 0; k < curve.upTo.length; k++) if (x <= curve.upTo[k]) return curve.si[k]
      return curve.si[curve.upTo.length]
    }
    case 'mean': {
      let sum = 0
      for (const c of curve.curves) sum += evaluate(c, x)
      return sum / curve.curves.length
    }
    case 'fn':
      return curve.f(x)
  }
}

/** The x range a curve is drawn over (its breakpoints' span). */
export function curveDomain(curve: Curve): [number, number] {
  switch (curve.kind) {
    case 'linear':
      return [curve.points[0][0], curve.points[curve.points.length - 1][0]]
    case 'steps': {
      const last = curve.upTo[curve.upTo.length - 1]
      const first = curve.upTo[0]
      return [Math.min(0, first), last + (last - first) / Math.max(1, curve.upTo.length - 1)]
    }
    case 'mean': {
      const ds = curve.curves.map(curveDomain)
      return [Math.min(...ds.map((d) => d[0])), Math.max(...ds.map((d) => d[1]))]
    }
    case 'fn':
      return [curve.domain[0], curve.domain[1]]
  }
}
