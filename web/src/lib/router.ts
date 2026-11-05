// Hash routes: GitHub Pages serves one page and has no fallback for other paths, so the route lives in
// the hash (as in resst's src/state/viewRoute.ts), and every page can be bookmarked or linked.

export type Route =
  | { name: 'home' }
  | { name: 'find' }
  | { name: 'calc'; id: string }
  | { name: 'guide'; section?: string }
  | { name: 'missing'; path: string }

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0].replace(/\/+$/, '')
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent)
  if (!parts.length) return { name: 'home' }
  if (parts[0] === 'find' && parts.length === 1) return { name: 'find' }
  if (parts[0] === 'calc' && parts.length === 2) return { name: 'calc', id: parts[1] }
  if (parts[0] === 'guide' && parts.length <= 2) return { name: 'guide', section: parts[1] }
  return { name: 'missing', path }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home': return '#/'
    case 'find': return '#/find'
    case 'calc': return `#/calc/${encodeURIComponent(route.id)}`
    case 'guide': return route.section ? `#/guide/${encodeURIComponent(route.section)}` : '#/guide'
    case 'missing': return `#/${route.path}`
  }
}

export function onRoute(cb: (r: Route) => void): void {
  window.addEventListener('hashchange', () => cb(parseRoute(location.hash)))
  cb(parseRoute(location.hash))
}
