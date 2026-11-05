# Changes from the Shiny app

WARM replaces the R Shiny app (WARM 1.2.2, wrises.shinyapps.io/warm) with a static web app. It keeps the same models and the same Model Comparison, and it corrects the calculations the Shiny app got wrong. Each correction below was checked against the model's source document (page numbers as printed), and each has a test in `web/tests` that pins the corrected value. Where WARM keeps the Shiny app's arithmetic, the tests compare it with the Shiny app's own R code (`reference/legacy.R`) value for value.

## Lower Willamette

Source: Tetra Tech, Inc. 2014, Appendix F, Section 4.8.

| What | Shiny app | Now | Source |
|---|---|---|---|
| Salmonids in the tributaries | Two options, "prespawning adults" and "juveniles"; neither ever returned a result (the menu's names did not match the code's, and the HSI waited for variables these models do not have). | One model, as in the report: HSI = (FV1 + FV2 + FV3 + FV4) / 4, where the temperature index FV1 is the mean of the adult and juvenile curves. | pp. 33 to 34 |
| Juvenile temperature curve, 10 to 15 °C | Fell from 0.9 to 0.8, then jumped to 1.0 at 15 °C. | Rises from 0.9 to 1.0. | p. 34 |
| Pools during low water (FV2), 0 to 25% | Rose from 0.2 to 0.8 for prespawning adults. | Rises from 0.2 to 0.6. | p. 34 |
| Western pond turtle, cover along the water's edge (V2), 0 to 25% | ((x - 5) / 5) x 0.2, negative below 5% and 0.8 at 25%. | Rises from 0 to 0.2. | p. 29 |
| Yellow warbler, shrub height (V3) | Scored only 0 m, exactly 1 m and 2 m or more; any other height gave no result. | 0.5 per meter up to 2 m, then 1.0. | p. 32 |
| Yellow warbler, overall canopy cover (V2) | Each range began at its lower bound (20% scored 0.1). | Each range ends at its upper bound, as in the report's Appendix B (20% scores 0). | pp. 31 to 32 |
| Native amphibians, riparian width (V4) | 0.1 at 10 m. | 0.2 at 10 m. | p. 33 |
| Native salmonids in the mainstem | Each input was fed to another variable's curve; the depth plateau scored 0.1; Riprap, Sand and Fines gave no result; typing errors in two ramps. | Depth within 20 m of shore, substrate and bank vegetation cover each use their own table: depth 0.5 (to 0.5 m), 1.0 (to 3 m), 0.6 (to 10 m), 0 beyond; substrate Bedrock 0.25, Riprap 0.35, Sand 1.0, Fines 0.45; bank cover 0, 0.3, 1, 0.6, 0.2 and 0.1 for 0 to 10, to 20, to 30, to 40, to 80 and above 80%. | p. 35 |

Kept as the Shiny app had it: the beaver's tree canopy closure scores 0.6 at 100%, as the report has it (p. 30); a stray data file in the Shiny app's repository had 0.8.

Not in either version: the report's combined index over all species, its average annual habitat units, and its note that areas dominated by reed canary grass or purple loosestrife score 0.2 for amphibians (p. 32).

An assumption, as in the Shiny app: the report gives no value between 40 and 50% permanent water for native amphibians; the index falls in a straight line from 1.0 to 0.2 there.

## Upper Mississippi

Source: USACE 2021, Upper Mississippi River System Floodplain Forest Habitat Model.

| What | Shiny app | Now | Source |
|---|---|---|---|
| Canopy cover, 90% and above | 0.8 + 0.8 x cover (72.8 at 90%). | 0.8. | Figure 3, p. 7 |
| Desired forest type, 40 to 60% | Slope 0.15 (5.7 at 40%). | Slope 0.015: 0.3 at 40%, 0.6 at 60%. | Figure 4, p. 8 |
| Desired forest type, 60 to 75% | Slope 0.0133 (rounded). | The exact slope through (60, 0.6) and (75, 0.8); at most 0.0025 different. | Figure 4, p. 8 |
| A blank measurement | Scored 0, and the HSI was shown. | The HSI waits for every input. | |
| Structural diversity indicators | Any number. | 0 to 1 in steps of 0.2, as the model scores them. | p. 16 |
| Regeneration above 100% of the desired stocking | Scored 0. | Scores 1.0. | Figure 6, p. 10 |

## Mink

Sources: Devendorf and Yager 2013 (the modified riverine model); Allen 1986, as ecorest's library of the U.S. Fish and Wildlife Service models encodes it (HSImodels and HSImetadata).

| What | Shiny app | Now |
|---|---|---|
| Allen (1986) HSI | The lowest of six indices, one of which was always 0, so the HSI was always 0. | The lower of water (SIV1) and the cover index for the site's cover type, which the page now asks for. |
| Cover, palustrine forested or scrub-shrub wetlands of 405 ha or more | The smallest of SIV2, SIV3 and SIV4. | min(1, SIV2 + SIV3 + SIV4). |
| Modified model, shoreline cover (SIV6) | 0.05 up to 5.1%, then cover / 100. | 0.05 up to 5%, then rising to 1.0 at 100% (Figure 3): the same but between 5 and 5.1%. |
| The "Year" row | Required, though unused. | Not asked; the site name can carry it. |

## Resaca

Source: USACE Galveston District 2017, as the Shiny app computes it.

| What | Shiny app | Now |
|---|---|---|
| A blank metric | Scored 0 (a blank water regime gave no result). | The RRCI waits for every metric. |
| Species off the habitat's reference list | Their suitability index could be typed in and counted. | They count toward richness, as every species present does, with a suitability index of 0. |
| The suitability index of a present reference species | Defaulted to 0. | Asked for (the reference range is shown beside it). |

Kept as the Shiny app has it, because the ERDC technical note's test of the Shiny app against the model's published spreadsheet passed (Table 2): riparian canopy divided by 85, the composition rule, and the four-category RRCI. The model approval plan of 2016 differs on two points: riparian canopy divided by 80 (p. 7), and composition as the sum of SSI over the species present (p. 6). The species curves in the Shiny app's data files have 18 inconsistent rows, so WARM does not derive the SSI from them; it is entered, as in the Shiny app.

## Skokomish

Source: Klimas et al. 2013.

| What | Shiny app | Now |
|---|---|---|
| Inputs required | All five variables, whatever the limiting factor. | Only the limiting factor's variables (the acres only for habitat units). |
| Numbering | V1 pools, V2 wood, V3 riparian cover, V4 connectivity. | As the report numbers them (Figure 27): V1 large woody debris, V2 pools, V3 floodplain connectivity, V4 riparian cover. The results are the same. |

The ERDC technical note's test lists 184.23 habitat units as expected for 219 acres at HQI 0.84; 219 x 0.84 is 183.96, which both versions give.

## SMURF

Source: McKay et al., SMURF Version 1.0, and its R function (section 4.4 of the report). WARM equals the Shiny app and ecorest on 300 test sites, to the last of the 3 decimals WARM rounds to.

- The page now shows the instream, fauna and corridor indices and the HSI, not only the habitat units.
- Canopy structure is entered once and feeds both modules (the Shiny app asked for it twice).
- The variable descriptions come from the SMURF report; several of the Shiny app's were copied from the wrong variable.

## Bosque Rio Grande, Chatfield and Cottonwood Missouri

Unchanged. Chatfield and Cottonwood reproduce the ERDC technical note's tests (0.34 and 0.59); Bosque's equations were checked against Table 3 of its documentation, including the marsh equation's shrub term. Chatfield's "Physiochemical" score is now spelled "Physicochemical", and Bosque's codes COVGRIND and FLOODEDFREQ are now COVGRND and FLOODFREQ. Bosque's distance to the nearest patch carries the documentation's code, DISTPATCH.

## Model Comparison

- The Criteria and Keyword tabs are one page: the criteria rank the models, and a keyword narrows them.
- The criteria score and the order of models with equal scores are the Shiny app's, which reproduce the technical note's Figure 1.
- Keyword results now list the best matches first (the Shiny app listed the fewest matches first), and the keyword is read as plain text (the Shiny app read it as a pattern, so some characters broke the search).
- The model table's text was cleaned: the quotation marks that showed as replacement characters, "Burkes-Copes" (Burks-Copes), "Lowrence" (Lowrance), "Tyron Creek" (Tryon Creek), "FACwet" (FACWet), and "Canopy/Groud Cover" (Canopy/Ground Cover). The regions, model types and metric counts are unchanged.

## Not carried over

- The ERDC technical note's Bosque test lists 23 values without naming them, so they could not be matched to the model's variables; its SMURF test lists 14 inputs where SMURF has 19. WARM's tests for these two models are the Shiny app's own code and, for SMURF, the report's module tests.
