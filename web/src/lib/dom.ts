// A small DOM builder: h('div', { class: 'x', onclick }, ...children). Text is always set as text,
// never parsed as HTML.

export type Child = Node | string | number | false | null | undefined | readonly Child[]
export type Attrs = Record<string, unknown>

const SVG_NS = 'http://www.w3.org/2000/svg'

function setAttrs(el: Element, attrs: Attrs): void {
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false || k === 'value') continue
    if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener)
    } else if (k === 'style' && typeof v === 'object') {
      Object.assign((el as HTMLElement).style, v)
    } else {
      el.setAttribute(k, v === true ? '' : String(v))
    }
  }
}

export function append(el: Node, children: readonly Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue
    if (Array.isArray(c)) append(el, c)
    else if (c instanceof Node) el.appendChild(c)
    else el.appendChild(document.createTextNode(String(c)))
  }
}

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs | null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  if (attrs) setAttrs(el, attrs)
  append(el, children)
  // a value is set after the children (a select's options) are in
  if (attrs && attrs.value !== undefined && attrs.value !== null) (el as unknown as { value: string }).value = String(attrs.value)
  return el
}

export function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs?: Attrs | null, ...children: Child[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag)
  if (attrs) setAttrs(el, attrs)
  append(el, children)
  return el
}

/** A unique id for a label's for= or an aria reference. */
let seq = 0
export const uid = (prefix: string): string => `${prefix}-${++seq}`
