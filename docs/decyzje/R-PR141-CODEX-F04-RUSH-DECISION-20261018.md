# F-04: owner decision for rush-cost percentage

DATE: 2026-10-18  
TOPIC: `R-PR141-CODEX-F04-RUSH-DECISION-20261018`  
STATUS: Owner decision recorded; implementation separately authorized only within the matrix-only production phase. This does not change source values or classify consumers by itself.

## Question and literal answer

Owner question: `F-04 — prod_rush_koszt_proc ...` (the pending decision concerned the sign/direction of the percentage applied to the existing rush-price calculation).

Owner answer, verbatim:

> „A — zmiana ceny: +20% drożej (72), −20% taniej (48).”

## Bounded interpretation

Apply the approved signed matrix value to the already-rounded base rush price:

`max(0, ceil(base * (1 + raw)))`

Thus a base of 60 with `raw = +0.20` costs 72; with `raw = -0.20` it costs 48. Keep existing eligibility, affordability, payment, and owner-routing rules. The field does not add or remove any source values: all 15 currently approved `prod_rush_koszt_proc` values are zero. Zero therefore leaves the current price unchanged.

## Scope and limits

This resolves only the sign convention for `prod_rush_koszt_proc`. It does not authorize inventing nonzero values, alter any frozen source approval or v4 evidence snapshot, or establish runtime/product acceptance. The existing production decision record and all historical ledgers remain unchanged. Implementation evidence must be a new bounded phase and include the production quote/payment owner path plus positive, negative, zero, clamp, and no-double-count controls. Matrix-only strategy still suppresses old civilization-specific bonuses; this decision does not affect approved compositions between matrix fields.
