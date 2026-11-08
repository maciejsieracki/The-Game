# Final Control — F-04 Society remaining fields, round 4

DATE: 2026-10-18  
RUN: R-PR141-CODEX-F04-SOCIETY-REMAINING-20261018  
STATUS: PASS-WITH-NOTES — bounded source/component consumer goal only.

## Independent review

I reviewed the current Phase B report, the round-4 operator defense and independent Evaluator recheck, the focused AST test, and the live consumer/helper source. Evaluator reports 192/0 for the current focused test and no remaining findings. Final Control accepts that result as recorded and did not rerun tests, typecheck, build, browser, or runtime.

For Order money, the live city-turn source selects ordinary or post-capture-overridden effects first, reads the current city's `ownerCivMap` entry, then applies `porzadek_pieniadz_proc` to both `pieniadzMult` and `tradeMult`. The existing tier mapper selects one scalar, and the existing turn-economy consumer applies that one selected money multiplier before Wealth. The focused test covers all three tiers and synthetic nonzero/neutral effects, including post-capture ordering and one application. The live callsite's owner lookup and statement order are verified by source inspection; the fixture does not execute that `main.ts` owner-map block for representative numeric owner IDs.

For Wealth, the shared helper preserves `wealth_cap_proc` composition and applies `wealth_mnoznik_proc` to the per-level slope. Both actual callers use `ownerCivByOwnerId.get(city.ownerId)` and pass the resulting parameters to `advanceWealth`. The revised focused test extracts and executes the actual Wealth statements from each city loop, including the actual owner lookup and `advanceWealth`, for owners 0, 7, 42, and 99 plus unmapped owner 123. The two caller stages agree for each case. This closes the prior caller-execution gap without running a generated map or turn loop.

For Religion, the live spread loop resolves the source city's owner through `ownerCivMap`, modifies only base spread slots, and passes those params to the sole `spreadReligion` call. The current call keeps pressure at 1 and preserves range, eligibility, seed, and the existing conversion path. Source and helper inspection confirms temple/stone-circle slot additions remain separate and conversion behavior is unchanged. The focused fixture exercises base-only scaling, existing slot rounding, additive temple slots, per-target pressure, human/AI isolation, and unchanged in-city conversion. The numeric owner-to-`main.ts` Religion callsite is verified statically; the test exercises the helper/spread path with synthetic owner-derived values rather than executing the whole main loop.

The focused target and evaluator evidence confirm all 45 approved source cells (15 owners × 3 fields) remain zero and the approved workbook hash is unchanged. Synthetic overrides are confined to test fixtures. The intermediate generated-map attempt at 207 passed / 14 failed was discarded and is not accepted as current evidence; the accepted current result is the revised AST target at 192/0. Historical failed rounds remain preserved.

## Limits

This closes the three bounded Society consumer goals against source review and focused component execution. It does not establish browser rendering, full-world or end-turn outcomes, full runtime behavior, or PR-wide acceptance. In particular, Order and Religion's live owner-map wiring is supported by inspected actual callsites plus helper/component fixtures, while representative numeric owner routing through those two `main.ts` blocks was not separately AST-executed. No whole-runtime or product acceptance is implied.

DEPLOY/PUSH: NOT AUTHORIZED
