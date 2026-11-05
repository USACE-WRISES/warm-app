// The app's icons: 16 x 16 strokes, drawn in the current text color.
import { s } from './dom'

const PATHS: Record<string, string> = {
  arrow: 'M3 8h10M9 4l4 4-4 4',
  chevron: 'M6 3.5 10.5 8 6 12.5',
  down: 'M4 6l4 4 4-4',
  check: 'M3 8.5 6.5 12 13 4.5',
  alert: 'M8 3.2v5.6M8 12.3v.1',
  info: 'M8 7.2v5M8 4.2v.1',
  copy: 'M5.5 5.5h7v7h-7zM3.5 10.5v-7h7',
  download: 'M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10',
  upload: 'M8 10.5v-8M4.5 6 8 2.5 11.5 6M3 13.5h10',
  print: 'M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2M4.5 9.5h7v4h-7z',
  reset: 'M3 8a5 5 0 1 0 1.5-3.5M3 2.5v3h3',
  plus: 'M8 3v10M3 8h10',
  trash: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 9h5.6l.7-9',
  search: 'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM10.6 10.6 14 14',
  external: 'M9.5 2.5h4v4M13.5 2.5 7.5 8.5M11.5 9.5v4h-9v-9h4',
  curve: 'M2.5 13.5h11M2.5 13.5V2.5M4 12c2-6 4-8 9-8',
  site: 'M2.5 3.5h11v9h-11zM2.5 6.5h11',
  sites: 'M2.5 2.5h11v11h-11zM2.5 6h11M2.5 9.5h11M6.5 2.5v11',
  menu: 'M2.5 4.5h11M2.5 8h11M2.5 11.5h11',
  close: 'M4 4l8 8M12 4l-8 8',
  book: 'M2.5 3h4a2 2 0 0 1 1.5.7A2 2 0 0 1 9.5 3h4v9.5h-4a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0-1.5-1.5h-4z',
  calc: 'M3.5 2.5h9v11h-9zM5.5 5h5M5.5 8h1M8 8h1M10.5 8h0M5.5 10.5h1M8 10.5h1',
  filter: 'M2.5 3.5h11L9.5 8.5v4l-3 1.5v-5.5z',
  file: 'M4 2.5h5l3 3v8H4zM9 2.5v3h3',
}

export function icon(name: keyof typeof PATHS | string, label?: string): SVGSVGElement {
  return s('svg', { viewBox: '0 0 16 16', width: 16, height: 16, class: 'wa-icon', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round',
    'stroke-linejoin': 'round', 'aria-hidden': label ? undefined : 'true', role: label ? 'img' : undefined, 'aria-label': label },
  s('path', { d: PATHS[name] ?? '' }))
}

/** WARM's mark: a stream meander and a riparian leaf on the house's blue tile. */
export function brandMark(cls = 'wa-brand-mark'): SVGSVGElement {
  return s('svg', { class: cls, viewBox: '0 0 64 64', 'aria-hidden': 'true' },
    s('rect', { width: 64, height: 64, rx: 14, fill: '#41669f' }),
    s('path', { d: 'M8 46c7 0 9-9 16-9s9 9 16 9 9-6 16-6', fill: 'none', stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    s('path', { d: 'M33 31c-9 0-13-7-12-17 9 0 13 7 12 17z', fill: '#8fd19e' }),
    s('path', { d: 'M33 31c-2-6-5-10-10-14', fill: 'none', stroke: '#41669f', 'stroke-width': 1.6, 'stroke-linecap': 'round' }))
}
