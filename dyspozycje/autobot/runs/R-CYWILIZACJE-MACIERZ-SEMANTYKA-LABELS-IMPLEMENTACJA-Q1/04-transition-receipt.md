# 04-transition-receipt — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1
ROLE: Final Control
TASK: t_72362f60
RUN: 894

BASE: f4c89d0081c622c16b207d338b49c8bacafc4553
HEAD: f4c89d0081c622c16b207d338b49c8bacafc4553
ORIGIN/MAIN: f4c89d0081c622c16b207d338b49c8bacafc4553
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1-20260921
WORKSPACE: /home/ubuntu/projects/The-Game/.worktrees/civ-matrix-semantic-labels-implementation-20260921
BOARD: the-game-real24
PROJECT: p_9ae9ac64
PROFILE: default
PARENT: t_b62c133a / completed Evaluator routing recovery run 893

## Terminal verdict

`PASS-WITH-NOTES` for the bounded local Normal semantic classifier and full
113-row civilization-profile UI. `DECISION_REQUIRED` remains for the full
113-field consumer requirement: 97 rows retain `UNWIRED` and
`D_REQUIRED-001..D_REQUIRED-097`.

No numbered Evaluator objections were present, so no Defense was created. This
is not `READY_FOR_DEPLOY` and does not authorize integration, push, merge,
deploy, Tauri/Rust work, natural-war runtime work, or a speculative consumer
wave.

## Coverage and contract readback

- 113 parameters × 15 civilizations = 1695 expected/actual/unique cells.
- 11 `REAL_GAMEPLAY` parameters / 165 cells.
- 5 `UI_ONLY` parameters / 75 cells.
- 97 `UNWIRED` parameters / 1455 cells.
- Every `D_REQUIRED-001..D_REQUIRED-097` row retains unresolved actor,
  condition, precedence and behavior-test requirements.
- Normal median over all 15 rows; parameter-specific polarity; harmful metrics
  reverse the comparison direction; exact median is `POZYTYWNY` with intensity
  `+1`; signed intensity is bounded `-10..+10`.
- AI/relations remain `NEUTRALNY` with a separate explanation; unknown/missing
  values are blocked without a Greece fallback; labels are not persisted.
- UI readback: 11 active rows by default; 102 inactive rows in one closed
  `<details>` panel; search and label/status filter are present; no Easy/Hard
  labels in the Normal profile.

## Gates

Final Control independently reran and passed:

- semantic focused test: `41/0`;
- Greece regression: `390/0`;
- difficulty regression: `16/0`;
- TypeScript noEmit;
- direct Vite build: 891 modules, 69,806.34 kB HTML;
- `node --check` of the reused Playwright harness;
- fresh Chromium against the fresh build: 1 profile, 113 rows, 11 active,
  102 inactive, 3 search matches, 11 negative-filter rows, 0 page/console
  errors;
- `git diff --check`.

The prior Evaluator `t_02f263c1/run892` supplied the original independent
build/browser/Greece/difficulty evidence and was `PASS-WITH-NOTES` with zero
objections. The bounded routing recovery `t_b62c133a/run893` did not repeat
those broad gates; it reran only semantic, TypeScript, diff-check and
structural/hash reconciliation. That distinction is preserved, while this
Final Control independently reran the broad gates.

## Routing and product boundary

The prior Evaluator's `project_id=null` is preserved as historical
`INFRA/ROUTING_ERROR`; its card/run was not mutated or erased. Recovery
`t_b62c133a/run893` is terminal `done/completed`, with native event `15331`,
project `p_9ae9ac64`, Evaluator phase, explicit `gpt-5.6-luna` /
`openai-codex`, `max` reasoning and `priority` service tier. Recovery changed
no product files. There has been no commit, push, merge, deploy or publication.

This Final Control wrote only the three allowlisted `04-*` artifacts. The
candidate remains local-only and dirty; the existing Operator product files and
prior process artifacts are not silently treated as integrated.

NEXT GATE: owner decision on the 97 unresolved consumers; if resolved, open a
separate serialized consumer-wiring Operator → independent Evaluator → Final
Control chain.

DEPLOY/PUSH: NIE WYKONANO
