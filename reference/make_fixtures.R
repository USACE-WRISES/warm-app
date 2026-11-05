# Writes the golden fixtures in web/tests/fixtures from the Shiny app's calculations (reference/legacy.R)
# and the ecorest package (SMURF, and R's own round()). The TypeScript engine is compared with them in
# web/tests: value for value wherever WARM keeps the Shiny app's arithmetic, and skipping exactly the
# inputs a documented fix changes (docs/changes-from-1x.md).
#
# Run from the repository root with R 4.x and the jsonlite and ecorest packages:
#   Rscript reference/make_fixtures.R
# then record the new fixtures' hashes:
#   npm --prefix web run freeze
suppressPackageStartupMessages({
  library(jsonlite)
  library(ecorest)
})
source('reference/legacy.R')

OUT <- 'web/tests/fixtures'
dir.create(OUT, showWarnings = FALSE, recursive = TRUE)
# 17 significant digits, so every double reads back in JavaScript as the same double; written in binary
# mode with LF line ends, so the files (and their hashes in FROZEN.sha256) are the same on every system
put <- function(x, name) {
  json <- toJSON(x, auto_unbox = TRUE, digits = I(17), na = 'null', null = 'null')
  con <- file(file.path(OUT, name), open = 'wb')
  writeLines(json, con, sep = '\n')
  close(con)
}

set.seed(20261105)
r01 <- function(n = 1) round(runif(n), 2)
pick <- function(x, n = 1) x[sample.int(length(x), n, replace = TRUE)]
num <- function(lo, hi, d = 1) round(runif(1, lo, hi), d)
# a value in [lo, hi], sometimes exactly one of the breakpoints
val <- function(lo, hi, breaks = c(), d = 1) if (length(breaks) && runif(1) < 0.25) pick(breaks) else num(lo, hi, d)

# --- R's round() -----------------------------------------------------------------------------------
xs <- c((2 * (0:15) + 1) / 16, (2 * (0:31) + 1) / 64, runif(300), runif(100, 0, 1000),
        0.5, 1.5, 2.5, 0.0005, 0.0015, 0.0025, 0.1235, 0.1245, 0.525, 1.0005, 2.675, 0.285, 1.005, 0)
put(lapply(xs, function(x) list(x = x, d0 = round(x), d2 = round(x, 2), d3 = round(x, 3))), 'round.json')

# --- SMURF (the Shiny app's single-site calculation, app.R 1813-1900, with ecorest) ---------------------
curve <- function(file) {
  df <- read.csv(file.path('web/data', file), header = TRUE)
  data.frame(lapply(df, as.numeric))
}
SMURF_instream <- curve('smurf_instream.csv')
SMURF_fauna <- curve('smurf_fauna.csv')
SMURF_corridor <- curve('smurf_corridor.csv')
smurf <- lapply(1:300, function(k) {
  canstr <- pick(0:6)
  instream <- c(val(0, 6, c(0, 1.5, 3, 5), 2), val(0, 1200, c(0, 30, 100, 300, 1000), 0), pick(0:20),
                val(0, 12, c(0, 1, 10), 2), pick(0:20), canstr, pick(0:20))
  fauna <- c(canstr, pick(0:20), pick(0:20), val(0, 4, c(0, 4), 1), pick(0:20), pick(0:20), pick(0:20), pick(0:20))
  corridor <- c(pick(0:20), val(0, 0.25, c(0, 0.026, 0.046, 0.2), 3), val(0, 1200, c(0, 100, 300, 1000), 0),
                val(0, 1200, c(0, 100, 1000), 0))
  area <- num(0, 50, 2)
  si_i <- SIcalc(SMURF_instream, instream)
  si_f <- SIcalc(SMURF_fauna, fauna)
  si_c <- SIcalc(SMURF_corridor, corridor)
  I <- round(HSIarimean(si_i), digits = 3)
  F <- round(HSIarimean(si_f), digits = 3)
  C <- round(HSIarimean(si_c), digits = 3)
  hsi <- round((I * F * C)^(1 / 3), digits = 3)
  a <- round(area, digits = 3)
  list(area = area, instream = instream, fauna = fauna, corridor = corridor,
       si = list(instream = si_i, fauna = si_f, corridor = si_c),
       out = list(instream = I, fauna = F, corridor = C, hsi = hsi, area = a, hu = round(hsi * a, digits = 3)))
})
put(smurf, 'smurf.json')

# --- Bosque Rio Grande ------------------------------------------------------------------------------
BOSQUE <- c('DEPTHGW', 'WETTEDAREA', 'FLOODFREQ', 'DURATION', 'CANTREE', 'CANSHRUB', 'CANHERB',
            'DISTBIGTR', 'NATIVETREE', 'INDICATHB', 'SPPCOUNT', 'COVGRND', 'CTGRNDCOV', 'DEPTHOM',
            'CANGRASS', 'CANFORB', 'CANSEDGE', 'INDICATGR', 'INDICATFB', 'NATIVESDG', 'SPPCOUNT_MARSH',
            'PATCHSIZE', 'TYPDISTURB', 'DISTPATCH')
bosque <- lapply(1:360, function(k) {
  cover <- ((k - 1) %% 6) + 1
  b <- c(cover, sapply(1:24, function(i) if (runif(1) < 0.1) pick(c(0, 1)) else r01()))
  b[22] <- b[12]  # WARM asks for SPPCOUNT once
  inputs <- as.list(setNames(b[2:25], BOSQUE))
  inputs$SPPCOUNT_MARSH <- NULL
  list(cover = cover, inputs = inputs, out = legacy_bosque(b))
})
put(bosque, 'bosque.json')

# --- Cottonwood Missouri ----------------------------------------------------------------------------
COTTONWOOD <- c('LCPI', 'DEPTHGW', 'RICHNATIVE', 'CVALUE', 'WIS', 'CANHERB', 'CANSHRUB', 'ADJLANDUSE',
                'PATCHSIZE', 'DISPATCH', 'PROPCTW', 'RECRUIT', 'INTERSPERS')
cottonwood <- lapply(1:300, function(k) {
  age <- if (runif(1) < 0.4) pick(c(0, 1, 1.9, 2, 2.5, 10, 25, 25.5, 26, 30, 80)) else num(0, 100, 1)
  s <- sapply(1:13, function(i) if (runif(1) < 0.1) pick(c(0, 1)) else r01())
  list(age = age, inputs = as.list(setNames(s, COTTONWOOD)), out = legacy_cottonwood(c(age, s)))
})
put(cottonwood, 'cottonwood.json')

# --- Chatfield --------------------------------------------------------------------------------------
chatfield <- lapply(1:300, function(k) {
  s <- if (k %% 3 == 0) round(runif(32, 50, 100), 1) else pick(seq(50, 100, 5), 32)
  list(sv = s, out = legacy_chatfield(s))
})
put(chatfield, 'chatfield.json')

# --- Modified Mink ----------------------------------------------------------------------------------
mink_modified <- lapply(1:300, function(k) {
  siv1 <- val(0, 100, c(0, 25, 75, 100))
  siv5 <- val(0, 100, c(0, 75, 100))
  siv6 <- val(0, 100, c(0, 5, 5.1, 100))
  vstream <- if (runif(1) < 0.3) pick(c(0.4, 0.7, 1)) else num(0.4, 1, 2)
  list(siv1 = siv1, siv5 = siv5, siv6 = siv6, vstream = vstream, out = legacy_mink_modified(siv1, siv5, siv6, vstream))
})
put(mink_modified, 'mink_modified.json')

mink_allen <- lapply(1:300, function(k) {
  area <- if (runif(1) < 0.3) pick(c(0, 404.9, 405, 1000)) else num(0, 1000, 1)
  v <- c(val(0, 100, c(0, 25, 75, 100)), val(0, 100, c(0, 75, 100)), val(0, 100, c(0, 75, 100)),
         val(0, 100, c(0, 50, 75, 100)), val(0, 100, c(0, 75, 100)), val(0, 100, c(0, 100)))
  list(area = area, v = v, out = legacy_mink_allen(c(2026, area, v)))
})
put(mink_allen, 'mink_allen.json')

# --- Resaca -----------------------------------------------------------------------------------------
REGIMES <- c('Permanent/Connected', 'Semipermanent/Disconnected', 'Dry')
resaca <- lapply(1:300, function(k) {
  habitat <- pick(c('TERF', 'STPW', 'TESES'))
  x <- list(habitat = habitat, slope = val(0, 30, c(0, 15)), bank = val(0, 100, c(0, 75, 100)),
            ssi = num(0, 20, 2), rich = pick(1:40), ripcan = val(0, 100, c(0, 85, 100)),
            aqcan = val(0, 100, c(0, 60, 100)), invasives = val(0, 100, c(0, 100)),
            regime = pick(REGIMES), depth = val(0, 10, c(0, 5)))
  x$out <- legacy_resaca(x$habitat, x$slope, x$bank, x$ssi, x$rich, x$ripcan, x$aqcan, x$invasives, x$regime, x$depth)
  x
})
put(resaca, 'resaca.json')

# --- Skokomish --------------------------------------------------------------------------------------
FACTORS <- c('In-Channel Habitat', 'Floodplain Habitat', 'Channel Capacity and In-Channel Habitat')
skokomish <- lapply(1:300, function(k) {
  x <- list(factor = pick(FACTORS), acres = num(0, 500, 1), pools = r01(), wood = r01(), riparian = r01(),
            connectivity = r01(), capacity = r01())
  x$out <- legacy_skokomish(x$factor, x$acres, x$pools, x$wood, x$riparian, x$connectivity, x$capacity)
  x
})
put(skokomish, 'skokomish.json')

# --- Upper Mississippi ------------------------------------------------------------------------------
uppermiss <- lapply(1:300, function(k) {
  x <- list(canopy = val(0, 100, c(0, 20, 40, 70, 80, 90, 100)), forest = val(0, 100, c(0, 20, 40, 60, 75, 100)),
            invasive = val(0, 100, c(0, 10, 20, 40, 50, 75, 100)), regen = val(0, 100, c(0, 20, 40, 80, 100)),
            structure = pick(seq(0, 1, 0.2), 5), area = num(0, 200, 1))
  x$out <- legacy_uppermiss(x$canopy, x$forest, x$invasive, x$regen, x$structure, x$area)
  x
})
put(uppermiss, 'uppermiss.json')

# --- Lower Willamette (the five species the Shiny app computed) ------------------------------------------
lowerwill_case <- function(species) {
  v <- switch(species,
    'Western Pond Turtle' = c(val(0, 100, c(0, 20, 50, 75, 100)), val(0, 100, c(0, 25, 50, 75, 100)),
                              val(0, 35, c(5, 10, 15, 20, 25, 30)), val(0, 100, c(0, 25, 50, 75, 100)),
                              pick(c('None', 'Very few', 'Sparse', 'Moderate', 'Abundant'))),
    'Beaver' = c(val(0, 100, c(0, 25, 50, 75, 100)), val(0, 100, c(0, 25, 50, 75, 100)),
                 val(0, 100, c(0, 25, 50, 75, 100)), val(0, 4, c(0, 1, 2), 2), pick(c('A', 'B', 'C'))),
    'Wood Duck' = c(val(0, 100, c(0, 25, 40, 50, 75, 85, 100))),
    'Yellow Warbler' = c(val(0, 100, c(0, 25, 50, 60, 80, 90, 100)), val(0, 100, c(0, 25, 50, 65, 75, 90)),
                         val(0, 3, c(0, 1, 2, 3), 2), val(0, 100, c(0, 25, 50, 75, 100))),
    'Native Amphibians' = c(val(0, 100, c(0, 10, 25, 40, 50)), val(0, 100, c(0, 25, 50)),
                            val(0, 100, c(0, 25, 50, 75, 100)), val(0, 80, c(0, 10, 30, 60)),
                            val(0, 25, c(0, 5, 10, 15, 20)),
                            pick(c('Developed', 'Row Crops', 'Managed Pasture', 'Fallow Grass/herbs', 'Shrubs/trees'))))
  acres <- num(0, 100, 1)
  list(species = species, v = as.list(v), acres = acres, out = legacy_lowerwill(species, v, acres))
}
SPECIES <- c('Western Pond Turtle', 'Beaver', 'Wood Duck', 'Yellow Warbler', 'Native Amphibians')
put(lapply(1:400, function(k) lowerwill_case(SPECIES[((k - 1) %% 5) + 1])), 'lowerwill.json')

# --- Model Comparison -------------------------------------------------------------------------------
models <- read.csv('web/data/models.csv', header = TRUE, check.names = FALSE, stringsAsFactors = FALSE, encoding = 'UTF-8')
REGIONS <- c('None', 'Varying', 'Southwest', 'Southeast', 'Northwest', 'Northeast', 'Midwest', 'Mid-Atlantic', 'South Central')
TYPES <- c('None', 'Analytical', 'Conceptual', 'Index', 'Spatial')
INSTREAM <- c('Adjacent Land Use', 'Climate and Weather')
RIPARIAN <- c('Bank Characteristics', 'Habitat Connectivity', 'Stream Habitat', 'Canopy/Ground Cover',
              'Native/Invasive Species', 'Vegetation Composition', 'Species Richness', 'Riparian Functions',
              'Floodplain Functions', 'Climate and Weather')
subset_of <- function(x) {
  s <- x[runif(length(x)) < 0.3]
  if (runif(1) < 0.05) s <- c(s, 'None')
  s
}
queries <- c(list(list(region = 'Midwest', type = 'Analytical', instream = list('Adjacent Land Use'),
                       riparian = list('Stream Habitat', 'Native/Invasive Species'))),
             lapply(1:400, function(k) list(region = pick(REGIONS), type = pick(TYPES),
                                             instream = as.list(subset_of(INSTREAM)), riparian = as.list(subset_of(RIPARIAN)))))
finder <- lapply(queries, function(q) {
  r <- legacy_rank(models, q$region, q$type, unlist(q$instream), unlist(q$riparian))
  c(q, list(order = r$order, value = r$value))
})
KEYWORDS <- c('Missouri', 'riparian', 'forest', 'HSI', 'Northwest', 'spreadsheet', 'index', 'Texas', 'mink',
              'urban', 'R statistical', 'certification', '1', 'wetland', 'zzz', 'FACWet', 'Crowley')
keywords <- lapply(KEYWORDS, function(w) list(keyword = w, hits = legacy_keyword_hits(models, w)))
put(list(ids = models$ID, criteria = finder, keywords = keywords), 'finder.json')

cat('fixtures written to', OUT, '\n')
