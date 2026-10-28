# Operator report — R-ARMY-RECRUITMENT-UI-20261028 — runda 2

Status: **evaluator objection resolved; ready for independent evaluation**. The production Army panel had two commander cards for the capital: the standalone Army header card and a second card inside the capital's city recruitment list. `mountCityRecruitmentCardsForArmy` now renders only the city's ordinary recruitment cards. The separately mounted Army-level card remains at the top. The regular CityPanel rendering path was not changed. No commit, push, merge, or deploy was made.

## Regression coverage

`gra/tools/empire-mass-recruitment-test.cjs` now mounts the actual production `mountGeneralRecruitmentCardForArmy` and calls the actual `mountCityRecruitmentCardsForArmy` for all 24 configured city objects in Chromium. Its production data fixture includes unit data plus the required empty buildings/civs/tech collections. It asserts exactly one Army-level commander card, no commander inside the capital's city list, the commander before the city list, and ordinary cards rendered through CityPanel.

`gra/tools/general-capital-recruitment-order-test.cjs` checks the production contract that the Army city renderer omits the dedicated commander card. It continues to exercise the production commander card click and transaction path.

## Verification

From `gra/`:

- `node tools/general-capital-recruitment-order-test.cjs` — **19 passed, 0 failed**.
- `node tools/empire-mass-recruitment-test.cjs` — **27 passed, 0 failed**.
- `node ./node_modules/typescript/bin/tsc --noEmit` — passed with no diagnostics.
- `git diff --check -- gra/src/ui/cityPanel.ts gra/tools/general-capital-recruitment-order-test.cjs gra/tools/empire-mass-recruitment-test.cjs dyspozycje/autobot/runs/R-ARMY-RECRUITMENT-UI-20261028` — passed.

Only allowlisted files were edited. Other pre-existing working tree changes were preserved.
