# Contributing to WARM

WARM is a static web app (TypeScript and Vite, in `web/`) published on GitHub Pages. `docs/methods.md`
gives every curve and equation with its source; `docs/changes-from-1x.md` every difference from the Shiny app.

## Commands

With Node 22.18 or later:

```bash
npm --prefix web ci              # the tools
npm --prefix web run dev         # the app at http://localhost:5200
npm --prefix web test            # every test (Vitest)
npm --prefix web run typecheck   # the types
npm --prefix web run build       # the site, in web/dist
npm --prefix web run preview     # the built site at http://localhost:5201/warm-app/
npm --prefix web run freeze      # record the fixtures' hashes (after reference/make_fixtures.R)
```

## Rules

1. **A formula changes only with its source.** Any change to a curve or an equation cites the page of
   the model's document that defines it, adds a line to `docs/changes-from-1x.md` (and
   `docs/methods.md`), and adds a test that pins the source's value.
2. **Parity with the Shiny app is checked, not assumed.** Where WARM keeps the Shiny app's arithmetic, the tests
   compare it with the Shiny app's R code (`reference/legacy.R`) value for value, and skip exactly the inputs
   a documented correction changes. A new skip needs a documented correction.
3. **The fixtures are frozen.** `web/tests/fixtures` is written by `reference/make_fixtures.R` only
   (R 4 with jsonlite and ecorest; see `reference/README.md`), and `npm run freeze` records the hashes
   `web/tests/frozen.test.ts` checks. None is edited by hand.
4. **Version lockstep.** The top section of `CHANGELOG.md` = `APP_VERSION` in
   `web/src/engine/version.ts` = `web/package.json` and its lock = `CITATION.cff` (version and
   date-released). A release has at most 10 bullets, each one line of at most 80 characters.
5. **Copy rules.** No em or en dashes in what people read, US spelling, `n/a` for missing values,
   plain words. `web/tests/repo_rules.test.ts` checks the files; `web/tests/ui.test.ts` the pages.
6. **The engine never imports the page.** `web/src/engine` is pure arithmetic and data;
   `web/src/calculators` describes the forms; `web/src/views` and `web/src/lib` draw them.
7. **Nothing from other sites.** The stylesheet is written into the page and the fonts are served
   with it (the USACE network's browser isolation does not apply linked stylesheets); downloads open
   in their own tab through `web/page/download-sw.js`.
8. **The repository reads as its authors' work.** No file or commit message names an AI tool or
   carries a co-author trailer, and no personal data or machine paths are committed.
9. **The data are CSV.** `web/data` holds the model table, SMURF's curves and Resaca's species; edit
   them there (UTF-8), and the tests check their shape.

## Releasing

1. Add a section at the top of `CHANGELOG.md` (rule 4) and move the version with it:
   `web/src/engine/version.ts`, `npm --prefix web version X.Y.Z --no-git-tag-version`, and
   `CITATION.cff` (version and date-released).
2. Run `npm --prefix web run typecheck` and `npm --prefix web test`.
3. Push to `main`. The Pages workflow (`.github/workflows/pages.yml`) tests, builds and deploys.
   GitHub Pages' cache may serve the old files for up to 10 minutes.
4. Tag `vX.Y.Z` and publish a GitHub Release with the CHANGELOG section.
