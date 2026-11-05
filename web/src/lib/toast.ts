// Short messages at the bottom of the page (read out by screen readers).
import { h } from './dom'

let host: HTMLElement | null = null

export function toast(text: string, opts: { error?: boolean; seconds?: number } = {}): void {
  if (!host) {
    host = h('div', { class: 'wa-toast-host', role: 'status', 'aria-live': 'polite' })
    document.body.appendChild(host)
  }
  const el = h('div', { class: `wa-toast${opts.error ? ' is-error' : ''}` }, text)
  host.appendChild(el)
  setTimeout(() => el.remove(), (opts.seconds ?? 3.5) * 1000)
}
