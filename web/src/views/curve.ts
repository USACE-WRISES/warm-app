// A suitability curve drawn small, with the entered value marked: how a measurement becomes an index.
import { type Curve, curveDomain, evaluate } from '../engine/interp'
import type { Variable } from '../engine/variables'
import { s } from '../lib/dom'

const W = 440
const H = 150
const M = { l: 38, r: 14, t: 12, b: 30 }

/** The curve's line as x, y pairs over [x0, x1]. */
function trace(curve: Curve, x0: number, x1: number): [number, number][] {
  switch (curve.kind) {
    case 'linear': {
      const pts = curve.points.filter(([x]) => x > x0 && x < x1)
      return [[x0, evaluate(curve, x0)], ...pts.map(([x, y]) => [x, y] as [number, number]), [x1, evaluate(curve, x1)]]
    }
    case 'steps': {
      const out: [number, number][] = []
      let x = x0
      for (let k = 0; k <= curve.upTo.length; k++) {
        const end = k < curve.upTo.length ? Math.min(curve.upTo[k], x1) : x1
        if (end < x) continue
        out.push([x, curve.si[k]], [end, curve.si[k]])
        x = end
        if (x >= x1) break
      }
      return out
    }
    case 'mean': {
      const xs = new Set<number>([x0, x1])
      for (const c of curve.curves) if (c.kind === 'linear') for (const [x] of c.points) if (x > x0 && x < x1) xs.add(x)
      return [...xs].sort((a, b) => a - b).map((x) => [x, evaluate(curve, x)])
    }
    case 'fn': {
      const n = 80
      return Array.from({ length: n + 1 }, (_, i) => {
        const x = x0 + ((x1 - x0) * i) / n
        return [x, curve.f(x)] as [number, number]
      })
    }
  }
}

const nice = (x: number) => (Math.abs(x) >= 100 ? x.toFixed(0) : Number(x.toPrecision(3)).toString())

export function curveFigure(v: Variable, value: number | null): SVGSVGElement {
  const curve = v.curve!
  let [x0, x1] = curveDomain(curve)
  if (value !== null && Number.isFinite(value)) {
    if (value > x1) x1 = value + (value - x0) * 0.05
    if (value < x0) x0 = value
  }
  if (x1 <= x0) x1 = x0 + 1
  const px = (x: number) => M.l + ((x - x0) / (x1 - x0)) * (W - M.l - M.r)
  const py = (y: number) => H - M.b - y * (H - M.t - M.b)
  const line = (pts: [number, number][]) => pts.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ')
  const text = (x: number, y: number, t: string, anchor = 'middle') =>
    s('text', { x, y, 'text-anchor': anchor, 'font-size': 11, fill: '#646f80', 'font-family': 'Instrument Sans, Segoe UI, sans-serif' }, t)

  const children: SVGElement[] = []
  for (const y of [0, 0.5, 1]) {
    children.push(s('line', { x1: M.l, x2: W - M.r, y1: py(y), y2: py(y), stroke: y === 0 ? '#c8d8f0' : '#e5e8ee' }))
    children.push(text(M.l - 6, py(y) + 4, String(y), 'end'))
  }
  for (const x of [x0, (x0 + x1) / 2, x1]) children.push(text(px(x), H - 10, nice(x)))
  if (curve.kind === 'mean') {
    curve.curves.forEach((c, i) => children.push(s('polyline', { points: line(trace(c, x0, x1)), fill: 'none', stroke: i ? '#9ab0d1' : '#b9c7da',
      'stroke-width': 1.5, 'stroke-dasharray': '4 3' })))
  }
  children.push(s('polyline', { points: line(trace(curve, x0, x1)), fill: 'none', stroke: '#2f4b7c', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }))
  if (value !== null && Number.isFinite(value)) {
    const y = evaluate(curve, value)
    children.push(s('line', { x1: px(value), x2: px(value), y1: py(0), y2: py(y), stroke: '#2e7d4f', 'stroke-dasharray': '3 3' }))
    children.push(s('circle', { cx: px(value), cy: py(y), r: 5, fill: '#2e7d4f', stroke: '#fff', 'stroke-width': 2 }))
  }
  const label = `Suitability index curve for ${v.label}${v.unit ? ` (${v.unit})` : ''}`
  return s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': label }, ...children)
}
