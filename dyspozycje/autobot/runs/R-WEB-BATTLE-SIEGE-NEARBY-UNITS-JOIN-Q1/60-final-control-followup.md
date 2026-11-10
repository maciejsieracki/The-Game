# R-WEB-BATTLE-SIEGE-NEARBY-UNITS-JOIN-Q1 — Final Control follow-up (2026-11-10)

**Werdykt: PASS-WITH-NOTES — etap 8/11 zakończony; kandydat gotowy do integracji w zatwierdzonym zakresie.** Product candidate remains `8784fdd49c5eadb432ebb0e8e23359740bd7d9b5`. This follow-up documentation is at `a1f91ea03b30b1e3e87b9a09a132fb07d681e509`. The original FAIL in `50-final-control.md` is preserved as the decision made against the earlier state.

## Disposition of the two findings

1. **Helper outside the initial allowlist — resolved.** `30-defense.md`, the dated corrections in `00-dispatch.md` and `10-operator-source-model-tests.md` accurately record that the helper was already in the candidate when the issue was found. They do not imply prior approval. The orchestrator then explicitly authorized the narrow scope addition for `gra/src/game/diplomacy-siege-war-gate.ts` to provide the shared actual-war/formal-active-alliance predicate. I accept that documented authorization for this integration gate.
2. **Missing Rust parity ledger entry — resolved.** `dyspozycje/rust-port/LEDGER.md` now records the exact task ID, web candidate commit `8784fdd49c5eadb432ebb0e8e23359740bd7d9b5`, the siege-roster parity obligation for Rust P3+, and status `NIE ROZPOCZĘTO / odroczone do P3+`. It clearly says the entry does not authorize Rust work now.

## Candidate and evidence

The candidate source has not changed since the original Final Control review: `git diff 8784fdd49..a1f91ea03 -- gra/src` is empty. The follow-up commit changes only `00-dispatch.md`, `10-operator-source-model-tests.md`, `30-defense.md`, and `dyspozycje/rust-port/LEDGER.md`. The focused test previously passed **14/14**, typecheck passed, and the relevant regression suite was independently recorded as passing in `20-evaluator.md`; no source changes require rerunning those checks for this documentary follow-up.

The `GOAL` and task ID remain consistent. The evaluator reported no product objections, so no Operator defense round was needed before the initial FC; `30-defense.md` is the documented response to the two FC process findings. The scope and ledger issues no longer block integration after the orchestrator’s explicit authorization and the exact ledger entry.

## Browser note

Live browser evidence remains **NIE_ZMIERZONO**. `/usr/bin/chromium` exists, while the related helper hardcodes `/opt/pw-browsers/chromium`; the new roster test has no live-browser scenario. I do not claim browser PASS. I judge this nonblocking for the current source-level, non-visual roster change; the browser-specific requirement for visual/UX work in `R-PROC-AUTOBOT.md` §9, item 6a does not apply.

**Readiness:** integration may proceed for the exact authorized candidate and documented allowlist. This is not `READY_FOR_DEPLOY`, deployment approval, or authorization to start Rust P3+ work.
