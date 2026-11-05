# WARM

The Web App for Riparian Models: compare 14 riparian models against a project, then run nine of
them in calculators that check every input and show how each result is built.

**Open it:** https://usace-wrises.github.io/warm-app/

WARM is documented by Wiest, S. R., C. Shaw, and S. K. McKay. 2026. _A Web Application for Riparian
Models (WARM)_. ERDC/TN EMRRP-RQ-7. US Army Engineer Research and Development Center.
https://dx.doi.org/10.21079/11681/50449. Version 2.0 rebuilds the R Shiny app of version 1.x as a
static web app and corrects several of its calculations against the models' source documents
(`docs/changes-from-1x.md`).

## What it does

* **Find a model.** Rank the 14 models of Wiest et al. (2023) by region, model type and the instream
  and riparian processes a project affects, or search them by keyword. Each model shows which
  criteria it meets, its attributes, and its calculator when WARM has one.
* **Calculators.** Nine habitat suitability index models certified or reviewed for US Army Corps of
  Engineers use. Each calculator asks for its setup choice first (cover type, stand age, species,
  habitat, limiting factor), shows only the inputs that choice uses, checks every input as it is
  typed, draws each measurement's suitability curve, and builds the result from its parts.
* **One site or many.** A guided form for one site, or a grid for many that takes blocks pasted from
  a spreadsheet and CSV files.
* **Keep the work.** Inputs stay in the browser between visits; Save and Open move them as a file;
  results copy into a spreadsheet, download as CSV or print.

WARM runs entirely in the browser: nothing anyone enters is sent anywhere.

| Calculator | Returns | Source |
|---|---|---|
| Bosque Rio Grande | Community index (HSI) | Burks-Copes and Webb 2012, ERDC/EL TR-12-26 |
| Chatfield | Functional condition scores | ERO Resources Corporation 2009 |
| Cottonwood Missouri | Ecosystem response index | Burks-Copes 2016 |
| Lower Willamette | HSI and habitat units, by species | Tetra Tech, Inc. 2014 |
| Modified Mink | HSI | Devendorf and Yager 2013; Allen 1986 |
| Resaca | Resaca reference condition index | USACE Galveston District 2017 |
| SMURF | HSI and habitat units | McKay et al., SMURF Version 1.0 |
| Skokomish | HQI and habitat units | Klimas et al. 2013 |
| Upper Mississippi | HSI and habitat units | USACE 2021 |

## How results are checked

* **WARM 1.x.** `reference/legacy.R` is WARM 1.x's own R code as plain functions;
  `reference/make_fixtures.R` runs it on thousands of random and edge-case sites and writes the
  fixtures in `web/tests/fixtures`. Every calculator equals it value for value, except exactly where
  a documented correction applies.
* **The corrections.** Each one in `docs/changes-from-1x.md` has a test that pins the value its
  source document gives.
* **The ERDC technical note's tests** (its Table 2) and the source reports' worked examples (the
  SMURF report's module tests, the Skokomish report's tables), as acceptance tests.
* **R's arithmetic.** Interpolation, means and rounding follow R step for step (SMURF equals ecorest to
  the last digit), compared with R on hundreds of values.
* **Model Comparison** equals WARM 1.x's scores and order on 401 queries, including the note's
  Figure 1.

`docs/methods.md` gives every curve and equation with its source.

## Run it locally

With Node 22.18 or later:

```bash
npm --prefix web ci
npm --prefix web run dev        # the app at http://localhost:5200
npm --prefix web test           # every test
npm --prefix web run build      # the site, in web/dist
npm --prefix web run preview    # the built site at http://localhost:5201/warm-app/
```

## Limits

* WARM is a calculator, not an endorsement of any model in it; each model's scientific quality rests
  on its own review and certification.
* Inputs that are suitability indices (Bosque, Cottonwood, Skokomish) are read from each model's own
  curves outside WARM, as in WARM 1.x.
* Not included: the source models' average annual habitat units over time, combined indices across
  species, and the Resaca species curves (`docs/changes-from-1x.md`).

## Layout

```
web/            the app (TypeScript, Vite): src/engine the models, src/calculators their forms,
                src/views the pages; tests/ and their fixtures; page/ the files the site serves as they are
data            web/data: the model table, SMURF's curves and Resaca's species, as CSV
reference/      WARM 1.x's calculations in R, which write the test fixtures
docs/           methods.md, every curve and equation; changes-from-1x.md, every correction
brand/          the WARM mark
```

## License

GNU General Public License, version 3 (`LICENSE`), as WARM 1.x. The fonts WARM serves keep their own
licenses: see `THIRD_PARTY_NOTICES.md`.

## Citing

See `CITATION.cff`.
