# Strategic decision: matrix replaces legacy civilization bonuses

DATE: 2026-10-18  
TOPIC: `R-PR141-CODEX-MATRIX-ONLY-BONUSES-20261018`  
STATUS: Owner strategic decision recorded; source audit and implementation not yet accepted.

## Literal owner statement

> „Tak naprawdę regułą, którą przyjmujemy strategicznie, jest to, że nowe mechanizmy macierzy zastępujemy całkowicie starymi zasadami bonusów cywilizacji. Nie sumujemy starego z nowym, tylko zastępujemy go nowymi elementami macierzy. Usuwamy z gry wszystkie stare ustalenia dotyczące bonusów cywilizacji.”

## Bounded interpretation

The matrix mechanisms are the sole source for civilization-specific bonus effects. Old `civs.json`/hardcoded civilization-bonus inputs and fallback routes are removed/suppressed rather than added to or multiplied with matrix replacements. The scope is provenance-based: it does not remove an independently approved matrix field or forbid an approved composition of two matrix fields. In particular, `walka_koszt_rekrutacji_proc` is itself a matrix parameter; an approved Impi-scoped value from that field may continue to compose with the general matrix unit-cost field under the existing 3B/5A contract, provided both inputs are confirmed matrix-sourced. Earlier contracts are superseded only insofar as they retain a legacy civilization bonus alongside matrix effects.

This decision removes old civilization-specific bonus rules; it does not remove ordinary game mechanics. Generic unit, building, order, production, cost, movement, and other system rules remain unless they are specifically an old civilization bonus effect being replaced by a matrix field. The audit must distinguish those categories by actual call path before recommending code changes.

No matrix values are created or inferred by this decision. Existing raw-value source approvals remain limited to their recorded scope (including exactly the existing 360 F-04 cells). This decision does not approve other parameters, activate unreviewed consumers, establish all-cell behavior, or grant product/runtime acceptance.

## Prospective supersession and preserved history

Prospectively superseded where they preserve old civilization-specific bonuses alongside matrix effects:

- the F-04 overlap precedence decision `R-PR141-CODEX-F04-PRECEDENCE-DECISION-20261018`, including its general “preserve other effects” clause when an effect is an old civilization bonus;
- prior G11 3B/5A contracts only insofar as they permit a legacy `civs.json`/hardcoded bonus input to remain additive to matrix values; the approved matrix-to-matrix composition is not superseded;
- any other earlier per-field decision or implementation note whose effect is to retain an old civilization-specific bonus in parallel with its matrix replacement.

Earlier decisions, ECHOs, reports, code, and accepted v1/v2/v3/v4 ledgers remain immutable historical records of what was authorized and implemented at their time. This document does not rewrite them, invalidate past test receipts, or retroactively claim the new rule was in force earlier. Prior old-bonus-specific acceptance is historical only and cannot be carried forward as current acceptance of the new matrix-only strategy; each affected effect must be reconciled in the migration audit. Future implementation must follow the matrix-only rule and preserve ordinary non-civilization mechanics.

## Current workflow boundary

The six-domain audit and proposed exact file/test allowlist are tracked under `dyspozycje/autobot/runs/R-PR141-CODEX-MATRIX-ONLY-BONUSES-20261018/`. No application code has been changed or authorized by this decision record. Root must separately approve the concrete allowlist before implementation. Any future semantic/classifier or evidence-ledger updates require their own bounded review and new versioned artifacts; historical ledgers are not rewritten.
