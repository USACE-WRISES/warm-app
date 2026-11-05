# WARM 1.x calculations (the R Shiny app, github.com/USACE-WRISES/WARM, app.R at commit 441acb4),
# copied into plain functions so they run outside Shiny. Each function keeps app.R's arithmetic and
# branching as written, including its known errors: these functions describe what WARM 1.x computed,
# not what is correct. docs/changes-from-1x.md lists every difference in WARM 2.0, and the tests skip
# the parity check exactly where a documented fix applies. Line numbers refer to app.R.

# --- Bosque Rio Grande (app.R 555-605) ------------------------------------------------------------
# b: the 25 input rows of the app's table (1 cover type, 2 DEPTHGW, 3 WETTEDAREA, 4 FLOODFREQ,
# 5 DURATION, 6 CANTREE, 7 CANSHRUB, 8 CANHERB, 9 DISTBIGTR, 10 NATIVETREE, 11 INDICATHB, 12 SPPCOUNT,
# 13 COVGRND, 14 CTGRNDCOV, 15 DEPTHOM, 16 CANGRASS, 17 CANFORB, 18 CANSEDGE, 19 INDICATGR,
# 20 INDICATFB, 21 NATIVESDG, 22 SPPCOUNT (marsh), 23 PATCHSIZE, 24 TYPDISTURB, 25 DISPATCH)
legacy_bosque <- function(b) {
  hydro <- NA; biota <- NA; spatial <- NA; hsi <- NA
  if (!is.na(b[1])) {
    if (b[1] == 6) {
      if (all(!is.na(b[c(2, 3, 4, 5, 7, 16:25)]))) {
        hydro <- (((b[4]) * (b[5]))**0.5 + b[2] + b[3]) / 3
        biota <- (((b[7]) * (b[22])) + ((b[16]) * (b[19])) + ((b[17]) * (b[20])) + ((b[18]) * (b[21]))) / 4
        spatial <- (2 * (((b[23]) * (b[25]))**0.5) + (b[24])) / 3
        hsi <- (hydro + biota + spatial) / 3
      }
    } else if (b[1] == 1 || b[1] == 2 || b[1] == 3 || b[1] == 4 || b[1] == 5) {
      if (all(!is.na(b[c(2:15, 23:25)]))) {
        hydro <- (((b[4]) * (b[5]))**0.5 + b[2] + b[3]) / 3
        biota <- (3 * ((((((b[6]) * (b[10]) * b[9])**0.5 + b[7]) / 2) * b[12])**0.5) + ((b[8]) * (b[11])) + b[15] + ((b[13]) * b[14])**0.5) / 6
        spatial <- (2 * (((b[23]) * (b[25]))**0.5) + (b[24])) / 3
        hsi <- (hydro + biota + spatial) / 3
      }
    } else {
      hsi <- 0
    }
  }
  list(hydro = hydro, biota = biota, spatial = spatial, hsi = hsi)
}

# --- Cottonwood Missouri (app.R 608-645) -----------------------------------------------------------
# c: 1 age, 2 LCPI, 3 DEPTHGW, 4 RICHNATIVE, 5 CVALUE, 6 WIS, 7 CANHERB, 8 CANSHRUB, 9 ADJLANDUSE,
# 10 PATCHSIZE, 11 DISPATCH, 12 PROPCTW, 13 RECRUIT, 14 INTERSPERS
legacy_cottonwood <- function(c) {
  hydro <- NA; biota <- NA; spatial <- NA; eri <- NA
  if (!is.na(c[1])) {
    if (c[1] > 25) {
      if (all(!is.na(c[c(2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14)]))) {
        hydro <- (c[2] + c[3]) / 2
        biota <- (c[4] + c[5] + c[6]) / 3
        spatial <- ((((c[10] + c[11]) / 2) * c[12]) + c[9] + c[13] + c[14]) / 4
        eri <- ((3 * hydro) + biota + spatial) / 5
      }
    } else if (c[1] >= 2 && c[1] <= 25) {
      if (all(!is.na(c[c(2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14)]))) {
        hydro <- c[2]
        biota <- ((c[4] + c[5] + c[6]) / 3 + (c[7] + c[8]) / 2) / 2
        spatial <- ((((c[10] + c[11]) / 2) * c[12]) + c[9] + c[13] + c[14]) / 4
        eri <- ((3 * hydro) + biota + spatial) / 5
      }
    } else {
      eri <- 0
    }
  }
  list(hydro = hydro, biota = biota, spatial = spatial, eri = eri)
}

# --- Chatfield (app.R 648-678) ---------------------------------------------------------------------
legacy_chatfield <- function(s) {
  out <- list(v = rep(NA, 10), fcs = rep(NA, 4), overall = NA)
  if (length(s) == 32 && all(!is.na(s)) && all(s >= 50 & s <= 100)) {
    vv <- function(r) ((sum(s[r]) / length(r)) + min(s[r])) / 2
    V <- c(vv(1:4), vv(5:7), vv(8:10), vv(11:13), vv(14:16), vv(17:18), vv(19:22), vv(23:24), vv(25:27), vv(28:32))
    f1 <- ((V[1] * 0.3) + (V[2] * 0) + (V[3] * 0) + (V[4] * 0.3) + (V[5] * 0.05) + (V[6] * 0) + (V[7] * 0.1) + (V[8] * 0.1) + (V[9] * 0.15) + (V[10] * 0)) / 50 - 1
    f2 <- ((V[1] * 0.15) + (V[2] * 0.15) + (V[3] * 0) + (V[4] * 0.1) + (V[5] * 0.15) + (V[6] * 0.1) + (V[7] * 0.1) + (V[8] * 0.15) + (V[9] * 0.1) + (V[10] * 0)) / 50 - 1
    f3 <- ((V[1] * 0.15) + (V[2] * 0.05) + (V[3] * 0.25) + (V[4] * 0.1) + (V[5] * 0.1) + (V[6] * 0.05) + (V[7] * 0) + (V[8] * 0.05) + (V[9] * 0.05) + (V[10] * 0.2)) / 50 - 1
    f4 <- ((V[1] * 0.2) + (V[2] * 0) + (V[3] * 0.15) + (V[4] * 0.1) + (V[5] * 0.1) + (V[6] * 0.05) + (V[7] * 0) + (V[8] * 0.1) + (V[9] * 0.1) + (V[10] * 0.2)) / 50 - 1
    out <- list(v = V, fcs = c(f1, f2, f3, f4), overall = sum(c(f1, f2, f3, f4)) / 4)
  }
  out
}

# --- Modified Mink, riverine model (app.R 680-723) --------------------------------------------------
legacy_mink_modified <- function(siv1, siv5, siv6, vstream) {
  si1 <- NA; si5 <- NA; si6 <- NA; sv <- NA
  if (!is.na(siv1)) { if (siv1 < 25) si1 <- 0 else if (siv1 < 75) si1 <- 2 * siv1 / 100 - 0.5 else si1 <- 1 }
  if (!is.na(siv5)) { if (siv5 < 75) si5 <- 1.2 * siv5 / 100 + 0.1 else si5 <- 1 }
  if (!is.na(siv6)) { if (siv6 < 5.1) si6 <- 0.05 else if (siv6 <= 100) si6 <- siv6 / 100 }
  if (!is.na(vstream)) { if (vstream >= 0.4 && vstream <= 1) sv <- vstream }
  cover <- NA; water <- NA; hsi <- NA
  if (!is.na(si1) && !is.na(si5) && !is.na(si6) && !is.na(sv)) {
    cover <- (si5 * si6 * sv)**(1 / 3)
    water <- si1
    hsi <- min(cover, water)
  }
  list(si1 = si1, si5 = si5, si6 = si6, vstream = sv, cover = cover, water = water, hsi = hsi)
}

# --- Mink, Allen (1986) model (app.R 725-793) -------------------------------------------------------
# x: 1 year, 2 area (ha), 3..8 V1..V6 (percent)
legacy_mink_allen <- function(x) {
  si <- rep(NA, 13)
  if (all(!is.na(x[1:8]))) {
    if (x[3] >= 0 && x[3] < 25) si[3] <- 0 else if (x[3] >= 25 && x[3] < 75) si[3] <- -0.5 + (0.02 * x[3]) else if (x[3] >= 75 && x[3] <= 100) si[3] <- 1
    if (x[4] >= 0 && x[4] < 75) si[4] <- 0.1 + (0.012 * x[4]) else if (x[4] >= 75 && x[4] <= 100) si[4] <- 1
    if (x[5] >= 0 && x[5] < 75) si[5] <- 0.1 + (0.012 * x[5]) else if (x[5] >= 75 && x[5] <= 100) si[5] <- 1
    if (x[6] >= 0 && x[6] < 50) si[6] <- 0 + (0.02 * x[6]) else if (x[6] >= 50 && x[6] < 75) si[6] <- 1 else if (x[6] >= 75 && x[6] <= 100) si[6] <- 1.6 + (-0.008 * x[6])
    if (x[7] >= 0 && x[7] < 75) si[7] <- 0.1 + (0.012 * x[7]) else if (x[7] >= 75 && x[7] <= 100) si[7] <- 1
    if (x[8] >= 0 && x[8] <= 100) si[8] <- 0 + (0.01 * x[8])
    if (x[2] >= 405) si[9] <- min(si[4:6]) else si[9] <- FALSE
    if (x[2] >= 0 && x[2] < 405) si[10] <- (min(1, sum(si[4:6])) + si[7]) / 2 else si[10] <- FALSE
    si[11] <- (si[7] * si[8])**0.5
    si[12] <- (4 * si[6] + si[7]) / 5
    si[13] <- min(si[6:11])
  }
  list(si1 = si[3], si2 = si[4], si3 = si[5], si4 = si[6], si5 = si[7], si6 = si[8],
       sifs1 = si[9], sifs2 = si[10], sirl = si[11], sipe = si[12], hsi = si[13])
}

# --- Resaca (app.R 805-961) -------------------------------------------------------------------------
# The species table enters through two sums: ssi (the selected habitat's SSI column summed) and
# rich (the number of species with a composition above 0).
legacy_resaca <- function(habitat, slope, bank, ssi, rich, ripcan, aqcan, invasives, regime, depth) {
  s <- rep(NA, 11)
  if (!is.na(slope)) { if (slope < 15) s[1] <- 0.0667 * slope else s[1] <- 1 } else s[1] <- 0
  if (!is.na(bank)) { if (bank > 75) s[2] <- 1 else s[2] <- bank / 75 } else s[2] <- 0
  N <- c(TESES = 20, STPW = 18, TERF = 24)[[habitat]]
  if (rich <= N && rich > 0) { s[4] <- ssi / N; s[5] <- rich / N } else if (rich > N) { s[4] <- ssi / rich; s[5] <- 1 }
  if (!is.na(ripcan)) { if (ripcan > 85) s[6] <- 1 else s[6] <- ripcan / 85 } else s[6] <- 0
  if (!is.na(aqcan)) { if (aqcan > 60) s[7] <- 1 else s[7] <- aqcan / 60 } else s[7] <- 0
  if (!is.na(invasives)) s[8] <- 1 - (invasives / 100) else s[8] <- 0
  if (!is.na(regime)) { if (regime == 'Permanent/Connected') s[9] <- 1 else if (regime == 'Semipermanent/Disconnected') s[9] <- 0.5 else s[9] <- 0 }
  if (!is.na(depth)) { if (depth < 5) s[10] <- depth / 5 else s[10] <- 1 }
  s[11] <- ((s[1] + s[2]) / 2 + (s[4] + s[5] + s[6] + s[7]) / 4 + s[8] + (as.numeric(s[9]) + s[10]) / 2) / 4
  list(slope = s[1], bank = s[2], composition = s[4], richness = s[5], ripcan = s[6], aqcan = s[7],
       invasives = s[8], regime = s[9], depth = s[10], rrci = s[11])
}

# --- Skokomish (app.R 964-994) ----------------------------------------------------------------------
# rows as WARM 1.x labeled them: acres, V1 pools, V2 wood, V3 riparian cover, V4 connectivity, V5 capacity
legacy_skokomish <- function(factor, acres, pools, wood, riparian, connectivity, capacity) {
  hqi <- NA; hu <- NA
  if (!is.na(factor) && all(!is.na(c(acres, pools, wood, riparian, connectivity, capacity)))) {
    if (factor == 'Channel Capacity and In-Channel Habitat') hqi <- (pools + wood + capacity) / 3
    else if (factor == 'In-Channel Habitat') hqi <- (pools + wood) / 2
    else if (factor == 'Floodplain Habitat') hqi <- (riparian + connectivity) / 2
    hu <- acres * hqi
  }
  list(hqi = hqi, hu = hu)
}

# --- Upper Mississippi (app.R 1902-1973) ------------------------------------------------------------
legacy_uppermiss <- function(canopy, forest, invasive, regen, structure, area) {
  ci <- 0
  if (!is.na(canopy)) {
    if (canopy >= 0 && canopy < 20) ci <- 0 + (0.005 * canopy)
    else if (canopy >= 20 && canopy < 40) ci <- -0.2 + (0.015 * canopy)
    else if (canopy >= 40 && canopy < 70) ci <- -0.4 + (0.02 * canopy)
    else if (canopy >= 70 && canopy < 80) ci <- 1 + (0 * canopy)
    else if (canopy >= 80 && canopy < 90) ci <- 2.6 + (-0.02 * canopy)
    else if (canopy >= 90) ci <- 0.8 + (0.8 * canopy)
  }
  fi <- 0
  if (!is.na(forest)) {
    if (forest >= 0 && forest < 20) fi <- 0 + (0.005 * forest)
    else if (forest >= 20 && forest < 40) fi <- -0.1 + (0.01 * forest)
    else if (forest >= 40 && forest < 60) fi <- -0.3 + (0.15 * forest)
    else if (forest >= 60 && forest < 75) fi <- -0.2 + (0.0133 * forest)
    else if (forest >= 75 && forest < 100) fi <- 0.2 + (0.008 * forest)
    else if (forest == 100) fi <- 0 + (0.01 * forest)
  }
  ii <- 0
  if (!is.na(invasive)) {
    if (invasive >= 0 && invasive < 10) ii <- 1 + (-0.01 * invasive)
    else if (invasive >= 10 && invasive < 20) ii <- 1.5 + (-0.06 * invasive)
    else if (invasive >= 20 && invasive < 40) ii <- 0.5 + (-0.01 * invasive)
    else if (invasive >= 40 && invasive < 50) ii <- 0.3 + (-0.005 * invasive)
    else if (invasive >= 50 && invasive < 75) ii <- 0.13 + (-0.0016 * invasive)
    else if (invasive >= 75 && invasive < 100) ii <- 0.04 + (-0.0004 * invasive)
    else if (invasive == 100) ii <- 0
  }
  ri <- 0
  if (!is.na(regen)) {
    if (regen >= 0 && regen < 20) ri <- 0 + (0.005 * regen)
    else if (regen >= 20 && regen < 40) ri <- -0.3 + (0.02 * regen)
    else if (regen >= 40 && regen < 80) ri <- 0.1 + (0.01 * regen)
    else if (regen >= 80 && regen < 100) ri <- 0.5 + (0.005 * regen)
    else if (regen == 100) ri <- 0 + (0.01 * regen)
  }
  hsi <- (ci + fi + ii + ri + sum(structure) / 5) / 5
  hu <- if (!is.na(area)) hsi * area else NA
  list(canopy = ci, forest = fi, invasive = ii, regen = ri, structure = sum(structure) / 5, hsi = hsi, hu = hu)
}

# --- Lower Willamette (app.R 1004-1410): the five species WARM 1.x computed ---------------------------
lw_num <- function(x) suppressWarnings(as.numeric(x))

legacy_lowerwill <- function(species, v, acres) {
  si <- rep(NA, 6); hsi <- NA; hu <- NA
  if (is.na(v[1])) return(list(si = si, hsi = hsi, hu = hu))
  if (species == 'Western Pond Turtle') {
    x <- lw_num(v[1])
    if (x == 0) si[1] <- 0 else if (x > 0 && x < 20) si[1] <- 0 + ((x - 0) / 20) * (0.5 - 0) else if (x >= 20 && x < 50) si[1] <- 0.5 + ((x - 20) / 30) * (1 - 0.5) else if (x >= 50 && x <= 75) si[1] <- 1 else if (x > 75 && x < 100) si[1] <- 1 - ((x - 75) / 25) * (1 - 0.2) else if (x >= 100) si[1] <- 0.2
    if (!is.na(v[2])) { x <- lw_num(v[2]); if (x <= 0) si[2] <- 0 else if (x > 0 && x < 25) si[2] <- 0 + ((x - 5) / 5) * (0.2 - 0) else if (x >= 25 && x < 50) si[2] <- 0.2 + ((x - 25) / 25) * (0.5 - 0.2) else if (x >= 50 && x < 75) si[2] <- 0.5 + ((x - 50) / 25) * (1 - 0.5) else if (x >= 75) si[2] <- 1 }
    if (!is.na(v[3])) { x <- lw_num(v[3]); if (x <= 5) si[3] <- 0 else if (x >= 5 && x < 10) si[3] <- 0 + ((x - 5) / 5) * (0.2 - 0) else if (x >= 10 && x < 15) si[3] <- 0.2 + ((x - 10) / 5) * (0.6 - 0.2) else if (x >= 15 && x < 20) si[3] <- 0.6 + ((x - 15) / 5) * (1 - 0.6) else if (x >= 20 && x < 25) si[3] <- 1 else if (x >= 25 && x < 30) si[3] <- 1 - ((x - 25) / 5) * (1 - 0.6) else if (x >= 30) si[3] <- 0.6 }
    if (!is.na(v[4])) { x <- lw_num(v[4]); if (x >= 0 && x < 25) si[4] <- 0.1 + ((x - 0) / 25) * (1 - 0.1) else if (x >= 25 && x < 50) si[4] <- 1 else if (x >= 50 && x < 75) si[4] <- 1 - ((x - 50) / 25) * (1 - 0.3) else if (x >= 75 && x < 100) si[4] <- 0.3 - ((x - 75) / 25) * (0.3 - 0) else if (x >= 100) si[4] <- 0 }
    if (!is.na(v[5])) { si[5] <- c('None' = 0, 'Very few' = 0.2, 'Sparse' = 0.5, 'Moderate' = 0.8, 'Abundant' = 1)[v[5]] }
    if (all(!is.na(si[1:5]))) { hsi <- sum(si[1:5]) / 5; hu <- hsi * acres }
  } else if (species == 'Beaver') {
    x <- lw_num(v[1])
    if (x == 0) si[1] <- 0 else if (x > 0 && x < 25) si[1] <- 0 + ((x - 0) / 25) * (0.5 - 0) else if (x >= 25 && x < 50) si[1] <- 0.5 + ((x - 25) / 25) * (1 - 0.5) else if (x >= 50 && x < 75) si[1] <- 1 - ((x - 50) / 25) * (1 - 0.8) else if (x >= 75 && x < 100) si[1] <- 0.8 - ((x - 75) / 25) * (0.8 - 0.6) else if (x >= 100) si[1] <- 0.6
    if (!is.na(v[2])) { x <- lw_num(v[2]); if (x <= 0) si[2] <- 0.2 else if (x > 0 && x < 25) si[2] <- 0.2 + ((x - 0) / 25) * (0.4 - 0.2) else if (x >= 25 && x < 50) si[2] <- 0.4 + ((x - 25) / 25) * (0.6 - 0.4) else if (x >= 50 && x < 75) si[2] <- 0.6 + ((x - 50) / 25) * (0.8 - 0.6) else if (x >= 75 && x < 100) si[2] <- 0.8 + ((x - 75) / 25) * (1 - 0.8) else if (x >= 100) si[2] <- 1 }
    if (!is.na(v[3])) { x <- lw_num(v[3]); if (x <= 0) si[3] <- 0 else if (x > 0 && x < 25) si[3] <- 0 + ((x - 0) / 25) * (0.6 - 0) else if (x >= 25 && x < 50) si[3] <- 0.6 + ((x - 25) / 25) * (1 - 0.6) else if (x >= 50 && x < 75) si[3] <- 1 - ((x - 50) / 25) * (1 - 0.9) else if (x >= 75 && x < 100) si[3] <- 0.9 - ((x - 75) / 25) * (0.9 - 0.8) else if (x >= 100) si[3] <- 0.8 }
    if (!is.na(v[4])) { x <- lw_num(v[4]); if (x >= 0 && x < 1) si[4] <- 0 + ((x - 0) / 1) * (0.3 - 0) else if (x >= 1 && x < 2) si[4] <- 0.3 + ((x - 1) / 1) * (1 - 0.3) else if (x >= 2) si[4] <- 1 }
    if (!is.na(v[5])) { if (v[5] == 'A') si[5] <- 1; if (v[5] == 'B') si[5] <- 0.6; if (v[5] == 'C') si[5] <- 0.2 }
    if (all(!is.na(si[1:5]))) { hsi <- sum(si[1:5]) / 5; hu <- hsi * acres }
  } else if (species == 'Wood Duck') {
    x <- lw_num(v[1])
    if (x >= 0 && x < 25) si[1] <- 0 + ((x - 0) / 25) * (0.4 - 0)
    if (x >= 25 && x < 40) si[1] <- 0.4 + ((x - 25) / 15) * (0.8 - 0.4)
    if (x >= 40 && x < 50) si[1] <- 0.8 + ((x - 40) / 10) * (1 - 0.8)
    if (x >= 50 && x < 75) si[1] <- 1
    if (x >= 75 && x < 85) si[1] <- 1 - ((x - 75) / 10) * (1 - 0.6)
    if (x >= 85 && x < 100) si[1] <- 0.6 - (((x - 85) / 15)) * (0.6 - 0)
    if (x >= 100) si[1] <- 0
    hsi <- si[1]; hu <- hsi * acres
  } else if (species == 'Yellow Warbler') {
    x <- lw_num(v[1])
    if (x >= 0 && x < 25) si[1] <- 0 + ((x - 0) / 25) * (0.4 - 0)
    if (x >= 25 && x < 50) si[1] <- 0.4 + ((x - 25) / 25) * (0.75 - 0.4)
    if (x >= 50 && x < 60) si[1] <- 0.75 + ((x - 50) / 10) * (1 - 0.75)
    if (x >= 60 && x < 80) si[1] <- 1
    if (x >= 80 && x < 90) si[1] <- 1 - ((x - 80) / 10) * (1 - 0.8)
    if (x >= 90 && x < 100) si[1] <- 0.8 - (((x - 90) / 10)) * (0.8 - 0.6)
    if (x >= 100) si[1] <- 0.6
    if (!is.na(v[2])) { x <- lw_num(v[2]); if (x <= 0) si[2] <- 0 else if (x > 0 && x < 20) si[2] <- 0 else if (x >= 20 && x < 40) si[2] <- 0.1 else if (x >= 40 && x < 60) si[2] <- 0.2 else if (x >= 60 && x < 70) si[2] <- 0.8 else if (x >= 70 && x < 80) si[2] <- 1 else if (x >= 80 && x <= 100) si[2] <- 0.1 }
    if (!is.na(v[3])) { x <- lw_num(v[3]); if (x <= 0) si[3] <- 0 else if (x == 1) si[3] <- 0.5 else if (x >= 2) si[3] <- 1 }
    if (!is.na(v[4])) { x <- lw_num(v[4]); if (x >= 0 && x < 25) si[4] <- 0.1 + ((x - 0) / 25) * (0.3 - 0.1) else if (x >= 25 && x < 50) si[4] <- 0.3 + ((x - 25) / 25) * (0.55 - 0.3) else if (x >= 50 && x < 75) si[4] <- 0.55 + ((x - 50) / 25) * (0.8 - 0.55) else if (x >= 75 && x < 100) si[4] <- 0.8 + ((x - 75) / 25) * (1 - 0.8) else if (x >= 100) si[4] <- 1 }
    if (all(!is.na(si[1:4]))) { hsi <- sum(si[1:4]) / 4; hu <- hsi * acres }
  } else if (species == 'Native Amphibians') {
    x <- lw_num(v[1])
    if (x == 0) si[1] <- 0 else if (x > 0 && x < 10) si[1] <- 0 + ((x - 0) / 10) * (0.6 - 0) else if (x >= 10 && x < 25) si[1] <- 0.6 + ((x - 10) / 15) * (1 - 0.6) else if (x >= 25 && x <= 40) si[1] <- 1 else if (x > 40 && x < 50) si[1] <- 1 - ((x - 40) / 10) * (1 - 0.2) else if (x >= 50) si[1] <- 0.2
    if (!is.na(v[2])) { x <- lw_num(v[2]); if (x <= 0) si[2] <- 0 else if (x > 0 && x < 25) si[2] <- 0 + ((x - 0) / 25) * (0.5 - 0) else if (x >= 25 && x < 50) si[2] <- 0.5 + ((x - 25) / 25) * (1 - 0.5) else if (x >= 50) si[2] <- 1 }
    if (!is.na(v[3])) { x <- lw_num(v[3]); if (x <= 0) si[3] <- 0 else if (x >= 0 && x < 25) si[3] <- 0 + ((x - 0) / 25) * (0.3 - 0) else if (x >= 25 && x < 50) si[3] <- 0.3 + ((x - 25) / 25) * (0.6 - 0.3) else if (x >= 50 && x < 75) si[3] <- 0.6 + ((x - 50) / 25) * (0.9 - 0.6) else if (x >= 75 && x < 100) si[3] <- 0.9 + ((x - 75) / 25) * (1 - 0.9) else if (x >= 100) si[3] <- 1 }
    if (!is.na(v[4])) { x <- lw_num(v[4]); if (x >= 0 && x < 10) si[4] <- 0 + ((x - 0) / 10) * (0.1 - 0) else if (x >= 10 && x < 30) si[4] <- 0.1 + ((x - 10) / 20) * (0.6 - 0.1) else if (x >= 30 && x < 60) si[4] <- 0.6 + ((x - 30) / 30) * (1 - 0.6) else if (x >= 60) si[4] <- 1 }
    if (!is.na(v[5])) { x <- lw_num(v[5]); if (x >= 0 && x < 5) si[5] <- 0.1 + ((x - 0) / 5) * (0.5 - 0.1) else if (x >= 5 && x < 10) si[5] <- 0.5 + ((x - 5) / 5) * (1 - 0.5) else if (x >= 10 && x < 15) si[5] <- 1 - ((x - 10) / 5) * (1 - 0.3) else if (x >= 15 && x < 20) si[5] <- 0.3 - ((x - 15) / 5) * (0.3 - 0) else if (x >= 20) si[5] <- 0 }
    if (!is.na(v[6])) { si[6] <- c('Developed' = 0, 'Row Crops' = 0.1, 'Managed Pasture' = 0.5, 'Fallow Grass/herbs' = 0.7, 'Shrubs/trees' = 1)[v[6]] }
    if (all(!is.na(si[1:6]))) { hsi <- sum(si[1:6]) / 6; hu <- hsi * acres }
  }
  list(si = unname(si), hsi = hsi, hu = hu)
}

# --- Model Comparison (app.R 1661-1809) -------------------------------------------------------------
# models: the model table (web/data/models.csv); the Criteria tab's score and order, and the Keyword
# tab's count of matching fields (plain text here, as in WARM 2.0, over the 20 columns WARM 1.x had).
legacy_rank <- function(models, region, model_type, instream, riparian) {
  rows <- nrow(models)
  value <- rep(0, rows)
  for (i in 1:rows) {
    reg <- models[i, 'Region of Application']
    typ <- models[i, 'Model Type']
    if (region != 'None') {
      if (region == 'Varying') {
        if (region %in% reg || grepl('/', reg)) value[i] <- value[i] + 0.5
        if (reg %in% region) value[i] <- value[i] + 1
        else if (reg == 'Varying') value[i] <- value[i] + 1
      } else {
        if (reg == 'Varying') value[i] <- value[i] + 0.25
        else if (grepl('/', reg)) {
          for (t in strsplit(reg, '/')[[1]]) if (t %in% region) value[i] <- value[i] + 1
        } else {
          if (reg %in% region) value[i] <- value[i] + 1
          else if (reg == 'Varying') value[i] <- value[i] + 0.25
        }
      }
    }
    if (model_type != 'None') {
      if (grepl('/', typ)) {
        for (t in strsplit(typ, '/')[[1]]) if (t %in% model_type) value[i] <- value[i] + 1
      } else {
        if (model_type %in% typ) value[i] <- value[i] + 1
      }
    }
    for (grp in list(instream, riparian)) {
      if (length(grp) > 0 && !grepl('None', paste0(grp, sep = '', collapse = '|'))) {
        for (p in grp) {
          x <- models[i, p]
          if (!is.na(x)) value[i] <- value[i] + (if (x > 1) 1.5 else 1)
        }
      }
    }
  }
  # order() is stable; WARM 1.x then listed the models from the last of that order to the first
  ord <- order(value)
  list(order = models[rev(ord), 'ID'], value = value)
}

legacy_keyword_hits <- function(models, keyword) {
  cols <- setdiff(colnames(models), 'ID')
  sapply(seq_len(nrow(models)), function(i) {
    sum(sapply(cols, function(j) {
      cell <- models[i, j]
      !is.na(cell) && grepl(tolower(keyword), tolower(as.character(cell)), fixed = TRUE)
    }))
  })
}
