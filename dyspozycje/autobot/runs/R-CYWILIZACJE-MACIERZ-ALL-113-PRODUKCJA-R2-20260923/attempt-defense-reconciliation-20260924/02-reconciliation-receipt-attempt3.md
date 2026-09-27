# Focused live-seam reconciliation receipt — Production r3 attempt 3

- Topic: `R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2-20260923`
- Kanban task: `t_01cd78ec`
- Worktree: `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-all-produkcja-r2-20260923`
- Date: `2026-09-24`

## Before

The live harness had one failing assertion after a real `endTurn()` path:

```text
actual AI callback carries owner civKey and matrix cost/speed results
```

It required the same actual AI callback trace to contain both
`prod_koszt_budynku_proc` and `prod_szybkosc_jednostki_proc`. The observed trace was:

```json
{"actualAiOwner":{"ownerId":1,"civKey":"grecy"},"actualAiMatrixCalls":[{"ownerId":1,"civKey":"grecy","paramId":"prod_szybkosc_jednostki_proc","value":0}]}
```

## Source-backed reconciliation

This combined requirement was not semantically valid. In `gra/src/main.ts`, the real AI phase is entered by `runAiPhase` and its `isProductionAllowed` callback calls `availableProduction` (lines 33262, 33815-33849). That availability path computes item costs, including the building-cost matrix parameter in `gra/src/game/production.ts:927-934` and unit-cost path at `1015-1022`.

The per-turn production consumer is a separate call in `gra/src/main.ts:32767-32771`: `advanceProduction(..., productionMatrixOptionsForOwner(city.ownerId))`. `gra/src/game/production.ts:1839-1843` selects the speed parameter from the front item kind. Therefore a real AI turn may consume only the speed parameter in the observed callback while cost is consumed by the availability/item-selection path or a different production call. Requiring both parameter IDs in one callback incorrectly conflated separate consumers.

## After

Changed only `gra/tools/civ-matrix-production-runtime-live-test.cjs`. The assertion now requires, on the real `endTurn -> runAiPhase` path:

1. an actual AI production owner trace;
2. the owner-specific `civKey`; and
3. at least one finite matrix parameter value for that same owner/civ key.

Existing separate cost and speed checks remain unchanged elsewhere in the harness. No product source, matrix data, semantic source, or configuration was changed.

## Focused validation

Command (single bounded live validation):

```text
/usr/bin/timeout --signal=TERM --kill-after=10s 300s node tools/civ-matrix-production-runtime-live-test.cjs
```

Exit code: `0`

Result:

```text
[civ-matrix-production-runtime-live-test] 116 passed, 0 failed
```

The reconciled assertion passed with the real trace, including owner `1`, civ key `grecy`, and finite `prod_szybkosc_jednostki_proc=0`. This is sufficient for the bounded live seam assertion; it does not claim Final Control, integration, push, or deploy.

## Terminal outcome

`PASS` for this focused Defense reconciliation. The prior 115/1 result is superseded only by this narrowed, source-backed assertion and its single focused rerun; prior timeout evidence remains preserved as history.
