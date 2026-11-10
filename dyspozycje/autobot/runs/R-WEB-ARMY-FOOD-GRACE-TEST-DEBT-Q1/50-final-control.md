# Final control — R-WEB-ARMY-FOOD-GRACE-TEST-DEBT-Q1

**STAGE 8: PASS** — test-only repair independently verified.

## Scope and reruns

- Current `HEAD` is the operator's recorded base `4bd9b522aae2a2ed0c770965f5eeaacc7d6eeb8d`.
- Replayed that base test source against the current production helpers: **29 pass / 10 fail**, 39 assertions total. This reproduces the reported baseline.
- Re-ran from `gra/`: `node tools/glod-wojska-karencja-test.cjs` — **40 pass / 0 fail**.
- `git diff --check -- gra/tools/glod-wojska-karencja-test.cjs` passes. The scoped tracked diff is only `gra/tools/glod-wojska-karencja-test.cjs`; food helpers and economy data are unchanged.

## Independent findings

- **No old assertion was dropped.** The baseline has 39 `ok(...)` checks; current has 40. The former first-turn `zapasyPo === -20` expectation is corrected to the persisted zero clamp and paired with a new explicit `glodWojska === true` check. The deficit counter, grace countdown, HP behavior, reset/re-entry, territory/default-territory, mixed stack, camping/garrison, AI parity, and real-config assertions remain represented.
- **The deficit and recovery cases exercise the intended states.** `freshEmpireFoodState()` starts at zero. In the first turn, 20 units at the current ×4 rate cost 80 with no available reserve; the revised assertions distinguish a clamped deficit from a non-deficit. The recovery fixture creates positive reserve from one unit of local surplus, resets the deficit counter, then the next 20-unit upkeep (80) drives a fresh deficit; the test requires the counter to restart at 1 and attrition to remain off.
- **The eight upkeep expectations preserve the former factors while applying the deployed scale.** `unitFoodPerTurn()` applies the ×4 FALA1/FALA2 multiplier after camp and territory factors. The resulting expectations (marching own/outside 4/8, camping own/outside 2/4, plus mixed totals) match `r-stawki-strojenie.ts` and `economy-upkeep.ts`; deployed decision evidence is `WERSJE.md` FALA 215 and `REJESTR-PROSB-I-ZADAN.md` R-NADMIAR-POOLS.
- I found no skip, removed boundary, relaxed assertion, production edit, or economy-data change in this scope.

## Non-blocking clarity note

The existing comment above the first-turn fixture still describes 20 units at 1 food each and a cost of 20. The current ×4 contract makes that cost 80. The assertion and exercised deficit are correct, but updating this comment would keep the fixture explanation aligned with the implementation.
