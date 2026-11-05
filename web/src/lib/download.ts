// Files WARM makes in the page (CSV, the saved inputs), each saved from a tab of its own. Adapted from
// CEICA's src/shiny/download.ts.
//
// Under the USACE network's browser isolation (Menlo Security) a file the browser shows in place
// replaces the tab it came to, so a download opens its own tab at download/<token>/<name>, which the
// download worker (page/download-sw.js, scoped to download/) answers with the file this page made.
// Where there is no worker, the file is saved from this page.

/** the files waiting for their tab, by token */
const jobs = new Map<string, { name: string; mime: string; bytes: Uint8Array }>()
let worker: ServiceWorkerRegistration | null = null

/** Starts the download worker (once, after the page has loaded). */
export function startDownloads(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const container = navigator.serviceWorker
  container.addEventListener('message', (e: MessageEvent) => {
    const port = e.ports[0]
    if (!port || !e.data || e.data.type !== 'warm-download') return
    const job = jobs.get(e.data.token)
    if (!job) {
      port.postMessage({ has: false })
      return
    }
    jobs.delete(e.data.token)
    port.postMessage(job)
  })
  container.startMessages()
  const register = () => {
    container.register('download-sw.js', { scope: './download/' }).then((r) => { worker = r }, () => {
      // no worker here: downloads are saved from the page
    })
  }
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}

function token(): string {
  const b = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

function saveHere(name: string, mime: string, bytes: Uint8Array): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Saves a text file; call it from a click. */
export function downloadText(name: string, mime: string, text: string): void {
  // a byte order mark, so spreadsheet programs read a CSV's accented letters right
  const bom = mime.startsWith('text/csv') ? '﻿' : ''
  const bytes = new TextEncoder().encode(bom + text)
  if (worker?.active) {
    const key = token()
    jobs.set(key, { name, mime, bytes })
    setTimeout(() => jobs.delete(key), 600_000)
    const a = document.createElement('a')
    a.href = `download/${key}/${encodeURIComponent(name)}`
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    return
  }
  saveHere(name, mime, bytes)
}

/** Reads a file a person picks (CSV or JSON), as text. */
export function pickFile(accept: string): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.addEventListener('change', () => {
      const f = input.files?.[0]
      if (!f) return resolve(null)
      f.text().then((text) => resolve({ name: f.name, text }), () => resolve(null))
    })
    input.click()
  })
}

/** Copies text to the clipboard (tab-separated tables paste into spreadsheets as cells). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}
