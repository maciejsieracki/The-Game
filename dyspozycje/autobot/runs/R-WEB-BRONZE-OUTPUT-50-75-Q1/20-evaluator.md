# Independent Evaluator — R-WEB-BRONZE-OUTPUT-50-75-Q1

STATUS: PASS
DOMAIN: GAME
REVISION: f3e3e5fc4474fe12fc3971fab866ed70b94d62c9
BASE: 0329072b1346116011dc56edce249739e93e2426

## Finding

The candidate sets the explicit bronze throughput rows to 50/t in owner era 2 and 75/t in owner era 3 and later for easy, normal, and hard. All three canonical bronze recipes (`odlewnia_brazu`, `odlewnia_zelaza__braz`, and `wielka_odlewnia__braz`) select these same rows. The shared selector carries the era-3 row forward for later eras and uses the first configured row if the owner is earlier than era 2.

The recipe inputs remain 1 ore + 1 wood + 0.1 tin per cycle, with output amount unchanged. Neither the shared foundry base nor the iron/steel throughput rows or era-multiplier implementation changed. Independent tests confirm iron and steel remain 50/75/100 by owner era. Current HUD and city-panel display tests resolve the same 50/75 bronze rows as runtime. The current building card says 50 cycles/t with higher later-era output, which remains accurate.

The source diff contains only the approved parameter values/descriptions, converter comments, and four focused tests. The other changed paths are this run's scope and evidence. No unrelated source files, generated artifacts, or historical run reports were modified. No browser check was run because the browser slot was reserved; deterministic tests exercise the actual economy tick, converter, HUD calculation, and city-panel display paths.

## Verification

- PASS — `node tools/foundry-throughput-x2-era-mult-test.cjs`: 159 passed, 0 failed. Covers the three bronze recipes, all difficulties, era 2/3/later carry-forward, unchanged recipe ratios, actual `runConverter` throughput, input shortage, missing tin, full output stock, concurrent bronze and iron, and unchanged iron/steel era rates.
- PASS — `node tools/converter-era-scaling-test.cjs`: 117 passed, 0 failed. A real `advanceCityEconomy` tick produces 50 bronze/t for the era-2 player and 75 bronze/t for the era-3 AI through the same owner-era pipeline.
- PASS — `node tools/hud-konwerter-dopasowanie-test.cjs`: 20 passed, 0 failed. HUD calculation reports bronze 50/75 and unchanged iron/steel 75/100 in owner eras 2/3.
- PASS — `node tools/citypanel-konwerter-produkcja-test.cjs`: 100 passed, 0 failed. City-panel display reports bronze 50/75 and unchanged iron 75/100, including unchanged input ratios.
- PASS — `node tools/converters-test.cjs`: 49 passed, 0 failed.
- PASS — `npm run typecheck`: exit 0.
- PASS — `git diff --check 0329072b1..f3e3e5fc4`: clean.
- PASS — Scope review: all ten changed paths are within the pre-edit allowlist and run evidence; no historical unrelated source or artifact changes found.

No in-scope defect blocks integration. Ready for independent final control.
