# 03-evaluator-routing-recovery — bounded routing repair

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1
ROLE: Evaluator
TASK: t_b62c133a
RUN: 893

## Werdykt

Niezależny bounded Evaluator potwierdza spójność istniejącego zakresu produktu i naprawionego routingu karty Evaluatora. Wynik domenowy pozostaje `PASS-WITH-NOTES` wyłącznie dla częściowej implementacji pokrytej dowodami; 97 parametrów nadal ma jawny status `UNWIRED` i `D_REQUIRED-001..D_REQUIRED-097`, więc nie są deklarowane jako zaimplementowane.

Nie znaleziono numerowanych zarzutów produktowych. Nie utworzono Defense ani Final Control z tej fazy przed odczytem terminalnego eventu bieżącego runu, zgodnie z kontraktem recovery.

## Routing i proweniencja

| Pole | Readback |
|---|---|
| Board | `the-game-real24` |
| Project | `p_9ae9ac64` / `the-game` / The Game Box |
| Profile / assignee | `default` |
| Parent | `t_29f09234` |
| Workspace | `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-semantic-labels-implementation-20260921` |
| Branch | `hermes/R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1-20260921` |
| Base / HEAD / origin/main | `f4c89d0081c622c16b207d338b49c8bacafc4553` / `f4c89d0081c622c16b207d338b49c8bacafc4553` / `f4c89d0081c622c16b207d338b49c8bacafc4553` |
| Current task / run | `t_b62c133a` / `893` |
| Native `created` event | `15331` |
| Model / provider | `gpt-5.6-luna` / `openai-codex` |
| Reasoning / service tier | `max` / `priority` |
| Idempotency key | `R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1:evaluator:routing-recovery-20260921` |

The native `created` payload contains `project_id=p_9ae9ac64`, `process_phase=evaluator`, explicit `model_override=gpt-5.6-luna`, `provider_override=openai-codex`, `reasoning_effort=max` and `service_tier=priority`. The durable task row contains the attempt-specific idempotency key exactly once in the board database. The `created` payload does not repeat `idempotency_key` or `branch_name` for this `dir` workspace; this projection limitation is recorded in `03-routing-evidence.json`, not silently filled with an assumption. The key, parent link, task body, current Git branch and run request fields all agree.

The project anchor was read back as:

- primary: `/home/ubuntu/projects/The-Game`;
- primary Git root: `/home/ubuntu/projects/The-Game`;
- board: `the-game-real24`.

The prior Evaluator `t_02f263c1/run892` remains historical evidence with `project_id=null`; it was not mutated or duplicated. The recovery card is the separate, correctly routed Evaluator attempt.

## Independent artifact reconciliation

Read back the exact Operator receipt, `01-allocation.json`, `01-semantic-contract.json`, `01-consumer-provenance.md`, `01-evidence.json`, prior `02-evaluator.md` and `02-evidence.json`.

- 113 parameter definitions;
- 15 civilizations;
- 1695 expected, actual and unique cells;
- 11 `REAL_GAMEPLAY` parameters / 165 cells;
- 5 `UI_ONLY` parameters / 75 cells;
- 97 `UNWIRED` parameters / 1455 cells;
- complete `D_REQUIRED-001..D_REQUIRED-097` sequence;
- 9 source hashes from the allocation evidence recomputed and matched;
- prior Evaluator objections: 0.

The prior report's product evidence remains bounded and internally consistent: Normal median, polarity correction, exact-median `POZYTYWNY 1`, signed intensity, neutral AI/relations presentation, no Greece fallback and no semantic-label persistence. The prior report's build and Chromium results are read-back evidence, not a new recovery claim.

## Bounded checks executed in recovery

- `node tools/civ-matrix-semantic-labels-test.cjs` — `PASS 41; FAIL 0`.
- `node ./node_modules/typescript/bin/tsc --noEmit` — exit `0`, `PASS`.
- `git diff --check` — exit `0`, `PASS`.
- independent JSON/status/hash reconciliation — exit `0`, `PASS`.

Production build, Chromium, Greece regression and difficulty regression were not repeated in this bounded routing recovery. Their exact prior results were read back from `02-evidence.json`; no product file or test was changed.

## Product boundary and holds

- No product file was modified by this recovery.
- No Tauri/Rust, natural-war runtime, save migration, commit, push, merge or deploy was performed.
- The 97 unresolved consumer rows remain a product-scope `DECISION_REQUIRED` hold. Missing Greece precedent is not converted into a guessed consumer, zero adapter or gameplay effect.
- This result is not `READY_FOR_DEPLOY` and does not authorize integration.

## Objections and next gate

OBJECTIONS: none.

The next legal routing decision requires a readback of the terminal `completed` event for `t_b62c133a/run893`. Only after that terminal receipt is present may the Orchestrator evaluate the normal next phase; this worker does not create a Defense or Final Control while the recovery card is non-terminal.

DEPLOY/PUSH: NIE WYKONANO
