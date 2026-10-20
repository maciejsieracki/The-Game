# 12 — Root integration record: unit-speed activation

DATE: 2026-10-18  
RUN: R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018, unit-speed Phase B  
DECISION: ACCEPTED_LOCAL_BOUNDED  
ROUND: 3

## Accepted bounded scope

Root accepts the bounded implementation of `prod_szybkosc_jednostki_proc` after reviewing the operator report 08, D10 fixture addendum 09, Evaluator 10, Final Control 11, focused test evidence, current source paths, and diff check.

The current helper applies `max(1, floor(baseCapacity * (1 + raw)))` for positive capacity, preserves zero when base capacity is disabled, treats non-finite input as neutral, and adds no fractional carry or persistence state. With a base of 1: `+0.20 → 1`, `+1 → 2`, `+2 → 3`, and `-0.20 → 1`. The minimum-one behavior follows root's separate engineering review of the prior A contract; it is not part of the owner's literal response, which selected floor/no-carry. No new owner decision is recorded here.

The live city turn resolves the value from `city.ownerId` and passes the resulting capacity into the existing gated recruitment consumer. The city-panel queue cadence uses the same owner-resolved capacity and ETA calculation. The bounded test executes actual source functions/expressions and the gated consumer, covering human and AI owner routing, missing UI owner key, all 15 currently approved neutral source values, positive/negative synthetic values, zero base, and matching queue/cadence behavior. D10's AST guard now finds the actual production call by its first two arguments and verifies the owner guard precedes it in the same city loop.

Evidence references:

- `08-unit-speed-operator.md`
- `09-unit-speed-fixture-addendum.md`
- `10-unit-speed-evaluator.md`
- `11-unit-speed-final-control.md`
- `gra/tools/pr141-f04-unit-speed-activation-test.cjs`
- `gra/tools/ai-jednostki-tylko-zakup-test.cjs` (D10 actual-guard AST assertion)

The bounded validation listed in these reports passed, including the focused unit-speed test, D10 44/44, recruitment/refund/owner-routing regressions, and direct TypeScript check. Final Control did not rerun them.

## Remaining scope and snapshot boundary

This acceptance covers only unit speed. `prod_rush_koszt_proc` remains the single pending production owner decision; no rush pricing behavior was changed. The accepted consumer count is 23/24 F-04 fields; the current semantic classification remains at 67 IDs and 1,004 `REAL_GAMEPLAY` cells until a separate authorized metadata promotion and review.

The v3 manifest and ledger remain frozen as a pre-unit source snapshot. Their source hashes are expected to be stale after this legitimate change; that is expected snapshot aging, not artifact corruption. Do not regenerate or overwrite v3 (or historical v1/v2). A post-unit v4 synchronization requires its own authorization after the separate classifier/metadata work is accepted.

No full-world runtime, browser/visual UI, save/load, or 93×15 product acceptance is claimed. DEPLOY/PUSH: NOT AUTHORIZED.
