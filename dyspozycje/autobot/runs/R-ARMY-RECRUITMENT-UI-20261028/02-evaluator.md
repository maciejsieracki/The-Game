# Independent evaluation — R-ARMY-RECRUITMENT-UI-20261028

Verdict: **not ready to pass**. The capital card and single-purchase path are credibly exercised, but the Army panel's test substitutes ordinary city-card rendering, hiding a duplicate commander card in the actual production wiring. This leaves a concrete production UI defect against the requested Army layout.

## Verified

- `node tools/general-capital-recruitment-order-test.cjs` — **19 passed, 0 failed**.
- `node tools/empire-mass-recruitment-test.cjs` — **25 passed, 0 failed**.
- `node ./node_modules/typescript/bin/tsc --noEmit` — passed with no diagnostics.
- The purchase test mounts `mountGeneralRecruitmentCardForArmy` in Chromium and clicks its production button. That callback reaches the extracted production `purchaseRecruitmentUnit` body and production `attemptGeneralPurchase` helper. It verifies one queue entry, one gold/manpower/wood deduction, one dirty mark, rejection for a non-capital and at the era cap, and an increased limit in the next era.
- Source inspection confirms the offer is capital-only, derives candidates through `purchasableUnits` and city availability/technology inputs, and uses the existing current-era, technology, and Barracks/Academy availability rules. These offer/candidate checks are source assertions, not an execution of production offer construction.

## Blocking finding

The production Army wiring supplies `mountCityRecruitmentCardsForArmy` for each city's card list (`gra/src/main.ts`, around line 24015). That function calls `mountGeneralRecruitmentCardForArmy(cityId, host)` before rendering ordinary units (`gra/src/ui/cityPanel.ts`, around line 8330). Separately, the Army header creates a dedicated commander target and mounts the capital commander there (`gra/src/ui/empireDetailPanel.ts`, around line 2788; `gra/src/main.ts`, around line 24016). Since the capital is also one of the listed cities, its commander card is mounted twice in the real Army panel: once above the city list and again inside the capital's city recruitment cards.

The Army browser test does not catch this. It directly wires the standalone commander target to the production card, but its per-city callback appends hand-built placeholder rows instead of invoking the configured production `mountCityRecruitmentCardsForArmy`. The operator report notes that ordinary city rows are fixtures, but this fixture choice masks the duplicate in the actual composition. The criterion requires the commander above the cities and production card rendering in the Army panel; the real composition must be tested and should present the commander once.

## Limits

The transaction harness explicitly doubles economy/persistence and UI refresh dependencies, so it proves the production transaction logic against those interfaces, not a full live save/startup. The offer candidate availability path is checked in source only. In the Army test, the dedicated commander is real, while the per-city card rows are fixtures. That last limit is material because the fixture hides the duplicate described above.

No product files were changed during this evaluation.
