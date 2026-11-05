# Methods

How WARM computes each result, with its source. Suitability index curves are given as breakpoints (x, SI): the index is linear between breakpoints and holds the end value beyond them, as ecorest's SIcalc and R's approx (rule 2) compute it. A step table gives the index for each range, each range including its upper bound. Pages are as printed in each source.

## Model Comparison

The 14 models and their attributes are from Wiest et al. (2023), ERDC/TN EMRRP-ER-26 (`web/data/models.csv`). A model's score for a project's criteria, as in the Shiny app:

- **Region.** A model whose region is the project's earns 1; one of several listed regions (West/Midwest/Southeast) earns 1; a model of varying region earns 0.25. Choosing "Varying" gives 1.5 to the varying models and 0.5 to the multi-region ones.
- **Model type.** 1 if the model's type, or one of its listed types, is the one chosen.
- **Processes.** For each process checked, 1 if the model measures it, 1.5 if it measures it with more than one metric. Climate and weather counts once in each list it is checked in.

Models are listed by score, highest first; models with equal scores in the reverse of the table's order (the Shiny app's order, which the ERDC technical note's Figure 1 shows). A keyword keeps the models with a field that contains it (not case-sensitive), ranked by score when criteria are set and otherwise by the number of fields that contain it.

## Bosque Rio Grande

Burks-Copes and Webb 2012, Table 3. Inputs are suitability indices (0 to 1).

- Hydrology = ((FLOODFREQ x DURATION)^1/2 + DEPTHGW + WETTEDAREA) / 3
- Biotic integrity, cover types 1 to 5 = {3 x [((CANTREE x NATIVETREE x DISTBIGTR)^1/2 + CANSHRUB) / 2 x SPPCOUNT]^1/2 + CANHERB x INDICATHB + DEPTHOM + (COVGRND x CTGRNDCOV)^1/2} / 6
- Biotic integrity, cover type 6 = (CANSHRUB x SPPCOUNT + CANGRASS x INDICATGR + CANFORB x INDICATFB + CANSEDGE x NATIVESDG) / 4
- Spatial integrity = (2 x (PATCHSIZE x DISTPATCH)^1/2 + TYPDISTURB) / 3
- HSI = (Hydrology + Biotic integrity + Spatial integrity) / 3

## Chatfield

ERO Resources Corporation 2009, as the Shiny app and the model's spreadsheet compute it. The 32 state variables are scored 50 to 100. Each of the 10 variables is (mean + minimum) / 2 of its state variables. Each functional condition score is the weighted sum of the variables divided by 50, minus 1, which maps 50 to 100 onto 0 to 1:

| Score | V1 | V2 | V3 | V4 | V5 | V6 | V7 | V8 | V9 | V10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Hydraulic | 0.3 | | | 0.3 | 0.05 | | 0.1 | 0.1 | 0.15 | |
| Geomorphic | 0.15 | 0.15 | | 0.1 | 0.15 | 0.1 | 0.1 | 0.15 | 0.1 | |
| Physicochemical | 0.15 | 0.05 | 0.25 | 0.1 | 0.1 | 0.05 | | 0.05 | 0.05 | 0.2 |
| Biotic | 0.2 | | 0.15 | 0.1 | 0.1 | 0.05 | | 0.1 | 0.1 | 0.2 |

The overall score is the mean of the four.

## Cottonwood Missouri

Burks-Copes 2016, as the Shiny app computes it. Inputs other than stand age are suitability indices.

- Mature stands (over 25 years): Hydrology = (LCPI + DEPTHGW) / 2; Biota = (RICHNATIVE + CVALUE + WIS) / 3
- Young stands (2 to 25 years): Hydrology = LCPI; Biota = [(RICHNATIVE + CVALUE + WIS) / 3 + (CANHERB + CANSHRUB) / 2] / 2
- Spatial = [(PATCHSIZE + DISPATCH) / 2 x PROPCTW + ADJLANDUSE + RECRUIT + INTERSPERS] / 4
- ERI = (3 x Hydrology + Biota + Spatial) / 5; stands under 2 years score 0

## Lower Willamette

Tetra Tech, Inc. 2014, Section 4.8. Each species' HSI is the mean of its suitability indices; habitat units are HSI x acres.

| Species | Variable | Curve or classes | Page |
|---|---|---|---|
| Western pond turtle | V1 area with the depth adults prefer (%) | (0, 0) (20, 0.5) (50, 1) (75, 1) (100, 0.2) | 28 |
| | V2 cover along the water's edge (%) | (0, 0) (25, 0.2) (50, 0.5) (75, 1) (100, 1) | 29 |
| | V3 water temperature at low flow (°C) | (5, 0) (10, 0.2) (15, 0.6) (20, 1) (25, 1) (30, 0.6) | 29 |
| | V4 area shallower than 0.3 m (%) | (0, 0.1) (25, 1) (50, 1) (75, 0.3) (100, 0) | 29 |
| | V5 nesting sites | none 0; very few 0.2; sparse 0.5; moderate 0.8; abundant 1 | 29 |
| Beaver | V1 tree canopy closure (%) | (0, 0) (25, 0.5) (50, 1) (75, 0.8) (100, 0.6) | 30 |
| | V2 trees 2.5 to 15.2 cm diameter (%) | (0, 0.2) (25, 0.4) (50, 0.6) (75, 0.8) (100, 1) | 30 |
| | V3 shrub crown cover (%) | (0, 0) (25, 0.6) (50, 1) (75, 0.9) (100, 0.8) | 30 |
| | V4 shrub canopy height (m) | (0, 0) (1, 0.3) (2, 1) | 30 |
| | V5 woody species | class A 1; B 0.6; C 0.2 | 30 to 31 |
| Wood duck | V1 water surface with brood cover (%) | (0, 0) (25, 0.4) (40, 0.8) (50, 1) (75, 1) (85, 0.6) (100, 0) | 31 |
| Yellow warbler | V1 deciduous shrub crown cover (%) | (0, 0) (25, 0.4) (50, 0.75) (60, 1) (80, 1) (90, 0.8) (100, 0.6) | 31 |
| | V2 overall canopy cover (%) | to 20: 0; to 40: 0.1; to 60: 0.2; to 70: 0.8; to 80: 1; above: 0.1 | 31 to 32 |
| | V3 deciduous shrub height (m) | (0, 0) (2, 1) | 32 |
| | V4 hydrophytic share of the shrub canopy (%) | (0, 0.1) (25, 0.3) (50, 0.55) (75, 0.8) (100, 1) | 32 |
| Native amphibians | V1 area with permanent water (%) | (0, 0) (10, 0.6) (25, 1) (40, 1) (50, 0.2) | 32 |
| | V2 area with emergent or submerged plants (%) | (0, 0) (25, 0.5) (50, 1) | 32 |
| | V3 ground cover at the water's edge (%) | (0, 0) (25, 0.3) (50, 0.6) (75, 0.9) (100, 1) | 33 |
| | V4 riparian zone width (m) | (0, 0) (10, 0.2) (30, 0.6) (60, 1) | 33 |
| | V5 maximum temperature at low flow (°C) | (0, 0.1) (5, 0.5) (10, 1) (15, 0.3) (20, 0) | 33 |
| | V6 land use within 200 m | developed 0; row crops 0.1; managed pasture 0.5; fallow grass or herbs 0.7; shrubs or trees 1 | 33 |
| Salmonids (tributaries) | FV1 maximum temperature at low flow (°C) | the mean of adults (0, 0) (5, 0.5) (10, 1) (15, 0.9) (20, 0.5) (25, 0) and juveniles (0, 0) (5, 0.3) (10, 0.9) (15, 1) (20, 0.9) (25, 0) | 34 |
| | FV2 pools at low water (%) | (0, 0.2) (25, 0.6) (50, 1) (75, 0.9) (100, 0.2) | 34 |
| | FV3 instream cover, large wood (%) | (0, 0.1) (10, 0.2) (20, 0.4) (30, 0.8) (40, 1) | 34 |
| | FV4 substrate in riffles and runs | class A 1; B 0.6; C 0.3 | 34 |
| Native salmonids (mainstem) | V1 depth within 20 m of shore (m) | to 0.5: 0.5; to 3: 1; to 10: 0.6; above: 0 | 35 |
| | V2 substrate | bedrock 0.25; riprap 0.35; sand 1; fines 0.45 | 35 |
| | V3 bank vegetation cover (%) | to 10: 0; to 20: 0.3; to 30: 1; to 40: 0.6; to 80: 0.2; above: 0.1 | 35 |

## Modified Mink

Modified riverine model (Devendorf and Yager 2013): SIV1 share of the year with surface water (0, 0) (25, 0) (75, 1) (100, 1); SIV5 canopy cover of trees and shrubs within 100 m (0, 0.1) (75, 1) (100, 1); SIV6 shoreline cover (0, 0.05) (5, 0.05) (100, 1); Vstream 0.4 to 1 as entered. Cover = (SIV5 x SIV6 x Vstream)^1/3; water = SIV1; HSI = the lower of the two.

Allen (1986), as encoded in ecorest: SIV1 as above; SIV2 tree canopy and SIV3 shrub canopy (0, 0.1) (75, 1) (100, 1); SIV4 emergent herbaceous canopy (0, 0) (50, 1) (75, 1) (100, 0.8); SIV5 as above; SIV6 shoreline cover (0, 0) (100, 1). Cover: riverine or lacustrine (SIV5 x SIV6)^1/2; palustrine emergent (4 x SIV4 + SIV5) / 5; palustrine forested or scrub-shrub (min(1, SIV2 + SIV3 + SIV4) + SIV5) / 2 under 405 ha and min(1, SIV2 + SIV3 + SIV4) at 405 ha or more. HSI = the lower of water (SIV1) and cover.

## Resaca

USACE Galveston District 2017, as the Shiny app computes it.

- Bank condition = (slope index + bank canopy index) / 2, where the slope index is 0.0667 x X for a slope of 1:X below 1:15 and 1 otherwise, and the bank canopy index is cover / 75, at most 1.
- Vegetation = (composition + richness + riparian canopy + aquatic canopy) / 4, with riparian canopy = cover / 85 and aquatic canopy = cover / 60, each at most 1. With the reference richness N (24, 18 and 20 for the forest, woodland and shrubland) and S species present: composition = sum of SSI / N and richness = S / N when S is at most N; composition = sum of SSI / S and richness = 1 otherwise.
- Invasives = 1 - invasive share / 100.
- Water = (water regime + depth index) / 2, with permanent and connected 1, semipermanent 0.5, dry 0, and the depth index = depth in feet / 5, at most 1.
- RRCI = (Bank condition + Vegetation + Invasives + Water) / 4.

## SMURF

McKay et al., SMURF Version 1.0, section 4.4. Each input's suitability index comes from its curve (`web/data/smurf_*.csv`, the model's parameter files of 2020-09-10). The instream, fauna and corridor indices are the means of their modules' indices; HSI = (Instream x Fauna x Corridor)^1/3; habitat units = HSI x area. As in the Shiny app, the three indices, the HSI, the area and the habitat units are rounded to 3 decimals with R's rules.

## Skokomish

Klimas et al. 2013, page 53. Inputs are suitability indices. In-channel habitat: HQI = (V1 + V2) / 2. Floodplain habitat: HQI = (V3 + V4) / 2. Channel capacity and in-channel habitat: HQI = (V1 + V2 + V5) / 3. Habitat units = HQI x affected acres.

## Upper Mississippi

USACE 2021. V1 canopy cover (0, 0) (20, 0.1) (40, 0.4) (70, 1) (80, 1) (90, 0.8) (100, 0.8), Figure 3; V2 desired forest type (0, 0) (20, 0.1) (40, 0.3) (60, 0.6) (75, 0.8) (100, 1), Figure 4; V3 invasive species (0, 1) (10, 0.9) (20, 0.3) (40, 0.1) (50, 0.05) (75, 0.01) (100, 0), Figure 5; V4 regeneration (0, 0) (20, 0.1) (40, 0.5) (80, 0.9) (100, 1), Figure 6; V5 the mean of five structural indicators, each 0 to 1 in steps of 0.2 (page 16). HSI = (V1 + V2 + V3 + V4 + V5) / 5; habitat units = HSI x acres.

## Numerical agreement with R

WARM follows R where its results depend on it: interpolation step for step as R's approx (`web/src/engine/interp.ts`), sums and means rounded once as R's extended precision gives them (`stats.ts`), and R's round() (`rround.ts`). The tests compare these with R itself, and every calculator with the Shiny app's R code, using the fixtures `reference/make_fixtures.R` writes.
