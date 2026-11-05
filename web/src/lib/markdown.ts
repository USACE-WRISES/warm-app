// The Guide shows the repository's own documents (docs/methods.md, docs/changes-from-1x.md), so they
// are written once. This reads the plain Markdown they use: headings, paragraphs, lists, tables,
// links, **bold**, _italics_ and `code`. Everything is built as elements and text, never as HTML.
import { type Child, h } from './dom'

function inline(text: string): Child[] {
  const out: Child[] = []
  const re = /(\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|_([^_]+)_)/g
  let last = 0
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[2] !== undefined) {
      const url = m[3]
      const external = /^https?:/.test(url)
      out.push(h('a', { href: url, target: external ? '_blank' : undefined, rel: external ? 'noopener' : undefined }, ...inline(m[2])))
    } else if (m[4] !== undefined) out.push(h('strong', null, m[4]))
    else if (m[5] !== undefined) out.push(h('code', null, m[5]))
    else if (m[6] !== undefined) out.push(h('em', null, m[6]))
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())

/** The document as elements; the first heading is left out when skipTitle is set. */
export function renderMarkdown(md: string, opts: { skipTitle?: boolean } = {}): HTMLElement {
  const root = h('div', { class: 'wa-md' })
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  let i = 0
  let skipped = !opts.skipTitle
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      if (!skipped && heading[1].length === 1) {
        skipped = true
        i++
        continue
      }
      const level = Math.min(4, heading[1].length + (opts.skipTitle ? 0 : 0)) as 1 | 2 | 3 | 4
      const tag = (['h1', 'h2', 'h3', 'h4'] as const)[level - 1]
      const id = heading[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      root.appendChild(h(tag, { id }, ...inline(heading[2])))
      i++
      continue
    }
    if (/^\s*\|/.test(line)) {
      const rows: string[][] = []
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) rows.push(cells(lines[i]))
        i++
      }
      const [head, ...body] = rows
      root.appendChild(h('div', { class: 'wa-table-wrap' }, h('table', { class: 'wa-table' },
        h('thead', null, h('tr', null, head.map((c) => h('th', null, ...inline(c))))),
        h('tbody', null, body.map((r) => h('tr', null, r.map((c) => h('td', null, ...inline(c)))))))))
      continue
    }
    const bullet = /^(\s*)([-*]|\d+\.)\s+(.*)$/
    if (bullet.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const list = h(ordered ? 'ol' : 'ul')
      while (i < lines.length && bullet.test(lines[i])) {
        let text = bullet.exec(lines[i])![3]
        i++
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !bullet.test(lines[i])) text += ` ${lines[i++].trim()}`
        list.appendChild(h('li', null, ...inline(text)))
      }
      root.appendChild(list)
      continue
    }
    let text = line.trim()
    i++
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*\||\s*([-*]|\d+\.)\s)/.test(lines[i])) text += ` ${lines[i++].trim()}`
    root.appendChild(h('p', null, ...inline(text)))
  }
  return root
}
