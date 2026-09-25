# Focused live-seam reconciliation — Production r3 — attempt 3

- Program: `R-CYWILIZACJE-MACIERZ-ALL-113-Q1-20260923`
- Topic: Production / live AI wiring
- Prior recovery: `t_a3f64b99` / run `1211` (`TIMEOUT`)
- Worktree: `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-all-produkcja-r2-20260923`
- Date: `2026-09-24`

## Why this is a materially different strategy

The previous two Defense runs timed out while repeatedly exploring the browser path. The existing focused live harness already produced a concrete result before timeout:

```text
115 passed, 1 failed
```

The single failure is an over-broad combined assertion. The observed live trace was:

```text
actualAiOwner: { ownerId: 1, civKey: "grecy" }
actualAiMatrixCalls: [
  { ownerId: 1, civKey: "grecy", paramId: "prod_szybkosc_jednostki_proc", value: 0 }
]
```

This attempt must reconcile that one assertion instead of repeating the full Playwright exploration.

## Required scope

1. Read `/tmp/production-defense-r3-live.log` and the existing run-local harness before acting.
2. Read the real source call-sites for `runAiPhase`, `availableProduction`, `productionMatrixOptionsForOwner`, and `advanceProduction`.
3. Decide from the source and the observed trace whether the assertion requiring both `prod_koszt_budynku_proc` and `prod_szybkosc_jednostki_proc` in the same AI callback is valid. `availableProduction` uses matrix cost; `advanceProduction` uses the speed parameter by front item kind. Do not infer that one callback must emit both parameters without source proof.
4. If the assertion is invalid, edit only the run-local test harness so the acceptance condition proves the real seam that actually executes: owner-specific civ key plus a finite matrix parameter observed during the real `endTurn → runAiPhase` path, with separate existing tests retaining cost and speed coverage. Do not weaken the test to static token presence or helper-only execution.
5. If the assertion exposes a product defect rather than a test defect, return `FAIL` with the exact source-level reason; do not modify product source in this task.
6. Run one focused validation of the changed assertion. A targeted live browser run is allowed once, but no broad exploratory Playwright loops and no retries after the timebox.
7. Produce a terminal receipt under `attempt-defense-reconciliation-20260924/` containing the exact before/after assertion, command, exit code, and why the result is or is not sufficient for `main.ts → runAiPhase → availableProduction`.

## Prohibitions

- No reset, clean, stash, checkout, restore, pull, merge, push, deploy, or unrelated edits.
- No product-source, matrix-data, semantic-source, or config changes.
- No `probeOwner`, fixture-only substitute, static token search, comments, or synthetic claim as live proof.
- Do not claim `PASS` merely because the log has 115 passes; the one failure must be resolved by a defensible source-backed assertion and a focused rerun.
- If focused validation cannot finish, return `FAIL`/`INFRA-MISSING`, not `TIMEOUT` converted to `PASS`.
