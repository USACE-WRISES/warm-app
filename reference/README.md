# Reference: WARM 1.x in R

WARM 2.0's tests compare its TypeScript engine with WARM 1.x, the R Shiny app it replaces
(github.com/USACE-WRISES/WARM, `app.R` at commit 441acb4).

* `legacy.R` copies each of WARM 1.x's calculations out of its Shiny server into a plain function,
  keeping its arithmetic and branching as written, errors included. It describes what WARM 1.x
  computed, not what is correct.
* `make_fixtures.R` runs those functions, the ecorest package (SMURF) and R's own `round()` on
  random and edge-case sites, with a fixed seed, and writes the JSON fixtures in `web/tests/fixtures`.

To write the fixtures again, with R 4 and the jsonlite and ecorest packages, from the repository root:

```bash
Rscript reference/make_fixtures.R
npm --prefix web run freeze
```

The fixtures are frozen (`web/tests/frozen.test.ts`): a change to them is a change to what WARM is
checked against, and goes with a line in `docs/changes-from-1x.md`.
