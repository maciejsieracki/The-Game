# R-WEB-BRONZE-OUTPUT-50-75-Q1
STATUS: REGISTERED
OWNER DECISION: bronze production target is 50/t in owner era 2 and 75/t from owner era 3 onward. Iron and steel throughput remain unchanged.
GOAL: update the three canonical bronze converter recipes through explicit difficulty-specific era rows. Preserve inputs (1 ruda + 1 drewno + 0.1 ruda_cyny per bronze), owner-era lookup, and later-era carry-forward behavior. Verify runtime production and every displayed rate use the same data values for players and AI.
SCOPE: `gra/data/econ-params.json`, bronze recipe/domain descriptions in `gra/src/game/converters.ts`, only stale current bronze-rate descriptions/cards, tests covering converter data, runtime player/AI production, HUD and city display, plus this run's evidence. No global era multiplier or iron/steel change.
TESTS: exact 50/75 rows across all difficulties; era3+ carries 75; actual `runConverter` with abundant and constrained inputs; player/AI parity; panel/HUD/city display show 50/75; iron remains 50/75/100 by owner era (base 50 × 1/1.5/2); inputs and costs unchanged; typecheck and relevant regressions.
GATES: Operator → independent Evaluator → conditional Defense → independent Final Control → root integration/deploy. No browser until slot available.
