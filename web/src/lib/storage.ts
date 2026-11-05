// What WARM keeps in this browser between visits: each calculator's inputs and the model finder's
// filters. Keys start with 'warm-' (the site's origin is shared with the other WRISES apps). Storage
// can be off or full; then nothing is kept and the page still works.

const PREFIX = 'warm-'

export function load<T>(key: string, fallback: T): T {
  try {
    const text = window.localStorage.getItem(PREFIX + key)
    return text === null ? fallback : (JSON.parse(text) as T)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // storage off or full: the page keeps working without it
  }
}

export function remove(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    // as above
  }
}
