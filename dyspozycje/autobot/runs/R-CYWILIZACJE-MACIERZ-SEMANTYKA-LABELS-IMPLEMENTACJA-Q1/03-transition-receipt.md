# 03-transition-receipt — bounded Evaluator routing recovery

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1
ROLE: Evaluator
TASK: t_b62c133a
RUN: 893

BASE: f4c89d0081c622c16b207d338b49c8bacafc4553
HEAD: f4c89d0081c622c16b207d338b49c8bacafc4553
ORIGIN/MAIN: f4c89d0081c622c16b207d338b49c8bacafc4553
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1-20260921
WORKSPACE: /home/ubuntu/projects/The-Game/.worktrees/civ-matrix-semantic-labels-implementation-20260921
BOARD: the-game-real24
PROJECT: p_9ae9ac64
PROFILE: default
PARENT: t_29f09234

## Native routing readback

Current card `t_b62c133a` was created with native event `15331` and the following route:

- `project_id=p_9ae9ac64`;
- `process_phase=evaluator`;
- `model_override=gpt-5.6-luna`;
- `provider_override=openai-codex`;
- `reasoning_effort=max`;
- `service_tier=priority`;
- workspace kind/path: `dir` / the exact path above;
- parent link: `t_29f09234 → t_b62c133a`;
- durable idempotency key: `R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1:evaluator:routing-recovery-20260921`, unique to this card.

The native event payload does not duplicate the idempotency key or branch name for a `dir` workspace. The task row, uniqueness readback, task body and live Git branch provide those values; this schema projection note is preserved in `03-routing-evidence.json`.

## Read-only verification

- Operator receipt and all `01-*` artifacts read back.
- Prior Evaluator `02-evaluator.md` and `02-evidence.json` read back.
- 113 parameters × 15 civilizations = 1695 cells; 1695 unique.
- Statuses: 11 `REAL_GAMEPLAY`, 5 `UI_ONLY`, 97 `UNWIRED`; cells 165 / 75 / 1455.
- `D_REQUIRED-001..D_REQUIRED-097` complete and retained.
- 9 source hashes recomputed and matched.
- Semantic focused test: `PASS 41 / FAIL 0`.
- TypeScript noEmit: `PASS`.
- `git diff --check`: `PASS`.
- Prior build/Chromium/Greece/difficulty evidence was read back, not repeated.

## Scope and terminal boundary

Recovery wrote only the three allowlisted `03-*` process artifacts. No product path was modified. There was no commit, push, merge, deploy, Tauri/Rust work or natural-war runtime work.

The bounded product verdict is `PASS-WITH-NOTES`; the 97 `UNWIRED` rows remain `DECISION_REQUIRED`. No numbered objections were found.

The orchestrator must first read back the terminal completion event for `t_b62c133a/run893`. Do not create Defense or Final Control from a non-terminal recovery run.

DEPLOY/PUSH: NIE WYKONANO
