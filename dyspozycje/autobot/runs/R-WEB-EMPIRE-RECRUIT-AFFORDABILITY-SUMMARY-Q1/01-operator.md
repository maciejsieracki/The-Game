# Operator report — empire recruitment affordability and summary

Status: **WIP, not evaluator-validated**  
Base: `1e48b8282` (merged walls/alliance), branch `codex/recruit-affordability`  
WIP commit: `c94668bc2`

## Change

The empire recruitment panel now distinguishes each unit type's already-paid queue count from its selected basket count and shows both empire totals. It previews the complete selected basket against shared current gold, manpower, and resource pools. A row's Recruit button turns red with the exact shortfall when that one order is unaffordable; the top Recruit All button and basket summary turn red when combined selected orders exceed a shared balance. Manual typing and plus/minus update the warnings without rebuilding the input DOM.

The panel's budget and per-unit costs come from the existing owner treasury, empire manpower, `unitStockCost`, and current row gold cost. A new pure helper sums all selected costs once per shared pool; it does not reserve resources or change recruitment policy. Existing per-city purchase callbacks remain authoritative and recheck resources before mutations. Recruit All still calls each type in order, reports accepted counts, and keeps the remaining count after partial acceptance. Existing paid queue entries stay visible in the global queue summary even when a type is no longer currently purchasable; city eligibility and ordering still use the existing catalogue and planner.

Queued unit orders remain in the normal `cityProd` save data. Draft quantities remain session UI state and are cleared by the existing restore hook. No save format or cost policy changed.

## Validation

- `npm run typecheck`: pass.
- `node tools/empire-recruit-plan-test.cjs`: 17/17 pass.
- `node tools/empire-recruit-affordability-test.cjs`: 11/11 pass in Chromium `/usr/bin/chromium`. Exercises per-type/global queued-vs-selected totals, manual typing, plus, individual and shared-stock shortfalls, stale-preview resource reduction before click, partial acceptance, retained remainder, and 999 input clamp.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node tools/empire-recruit-all-test.cjs`: 31/31 pass; existing bulk-button, keyboard, full/partial acceptance, and remaining draft behavior.
- `node tools/empire-recruit-live-test.cjs`, run through a temporary Chromium/HTTP adapter because the checked-in harness hardcodes `/opt/pw-browsers/chromium` and `file://`: 20 pass / 3 fail at L16–L18. The same 20/23 result reproduces on untouched base `1e48b8282`; those three assertions follow several earlier purchases in the fixture and fail on both checkouts. The actual main callback checks in L6–L14 (city distribution, gold deduction, siege eligibility, and zero-gold rejection) pass in both runs. No test file was changed for the adapter.
- `node tools/unit-epoch-cost-test.cjs`: 57/57 pass.
- `node tools/pr141-saveload-mp-f05-g11-behavior-test.cjs`: bounded source execution passes, including the actual restore statements preserving paid `cityProd.rekrutacja` entries; it explicitly does not claim a full-game save/load run.
- `git diff --check`: pass. Branch worktree was clean after the WIP commit.

## Remaining review

The new real-DOM test uses the existing pure planner and affordability helpers with a stateful callback fixture. The existing full-game live test reaches real callbacks and queue state, but its three late-panel assertions are baseline-red because earlier fixture purchases exhaust a constrained queue/resource condition. Evaluator/FC should review the new basket arithmetic and decide whether to repair that old fixture separately before final validation. No changes were made to the city panel, Army UI, recruitment costs, stock rules, or queue assignment policy.
