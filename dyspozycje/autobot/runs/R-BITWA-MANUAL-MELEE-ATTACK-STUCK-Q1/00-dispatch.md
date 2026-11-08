# R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1 — dispatch

TEMAT: `R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1` · RUNDA: 1/5 · 2026-10-29 · DOMAIN: GAME
STATUS: Operator active. Owner clarified that The-Game work does not use Kanban; the repo registry and this dispatch are the task ledger.
GOAL: In a large battle, infantry/melee units must advance, engage and exchange damage under the `Atak` doctrine. The owner clarifies that the failure is doctrine-specific: the same warriors fight normally under `Szturm`.
WYZWALACZ: owner report (2026-10-29): in `Atak`, warriors stood in place while archers shot and chariots charged; under `Szturm` warriors fought normally.

## Acceptance (binary)

1. Reproduce through production BattleScene in Chromium with a large mixed roster (at least 24 units per side, including a meaningful melee contingent), not only mocked helpers.
2. Run a controlled A/B on the same seed/map and exact roster/IDs: `Atak` versus `Szturm`. Trace target selection, legal distance, movement/candidate-step allowance, melee attack events and target HP over multiple activations; include both sides where applicable.
3. Compare archers/chariots against melee in the same run so active ranged/mounted behavior cannot hide idle infantry. Specifically determine whether `Atak` stops before adjacency, rejects a legal formation step, or reaches adjacency but fails to dispatch a melee strike.
4. Exercise path/terrain occupancy, unit selection, commander control gate and empty/dead/routed targets. Distinguish expected hold/blocked states from silent no-op.
5. If a product defect reproduces, add focused regression and fix the smallest underlying cause. If it does not reproduce, record exact browser trace and conditions; do not claim the broader issue resolved by a helper-only test.
6. Chromium artifacts, source/logic regression, typecheck, build and independent Evaluator + Final Control PASS before integration.

## Scope / owner

Dedicated Operator `/root/battle_melee_attack_operator`, branch `autobot/R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1`, isolated worktree `/workspace/battle-melee-attack-operator`, base explicit current `origin/main` plus task-registration commit. Keep independent from attack-move UI feature; coordinate with battle pointer candidate only through evidence/commit review.

## 11 stages

1. Registry/dispatch — DONE.
2. Production-path reconnaissance and baseline — Operator.
3. Reproduction and root cause — Operator ACTIVE.
4. Fix and focused/mutation tests — conditional on reproduction.
5. Large browser matrix, typecheck/build/regression — Operator.
6. Independent Evaluator.
7. Operator Defense if objections.
8. Final Control.
9. Integrate exact accepted hunks to main.
10. Deploy Robocza, smoke and remote readback.
11. Push, receipt, update registry and close.

No broad change to the battle system or auto-battle fallback; no operator merge/deploy/push.
