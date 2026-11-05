/// <reference types="vitest/config" />
// WARM's build, dev server and tests.
//
// GitHub Pages serves the built app at https://usace-wrises.github.io/warm-app/. The page
// (index.html) gets its head from site.ts, which writes the stylesheet into the page; page/ is the
// public folder, the files the page serves as is (fonts, icons, the download worker).
//
// The Guide renders docs/changes-from-1x.md and docs/methods.md from the repository root, so the
// dev server may read it.
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { PAGE, warmSite } from './site.ts'

/** The path the built app is served under. */
export const SITE_PATH = '/warm-app/'

const REPO = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? SITE_PATH : '/',
  publicDir: PAGE,
  plugins: [warmSite()],
  server: { port: 5200, strictPort: true, fs: { allow: [REPO] } },
  preview: { port: 5201, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
  },
}))
