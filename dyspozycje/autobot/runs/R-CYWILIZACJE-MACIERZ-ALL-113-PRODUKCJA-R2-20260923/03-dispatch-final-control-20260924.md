# 03-dispatch — Final Control — Production r3

STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: `R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2-20260923`
ROLE: Final Control — independent, read-only gate
RUNDA: 3/5
DATA: 2026-09-24
BOARD: `the-game-real24`
PROFILE: `default`
PROJECT: `p_9ae9ac64`
TENANT: `the-game`
MODEL: `gpt-5.6-luna`
PROVIDER: `openai-codex`
REASONING EFFORT: `ultra`
COMPLETION: `local-only`

## Terminalny łańcuch wejściowy

- Operator: `t_ca542f20` / run `1202` — terminal `PASS`.
- Independent Evaluator: `t_a48da8d3` / run `1203` — terminal `FAIL`, one numbered objection: missing proof of the live `main.ts → runAiPhase → availableProduction` seam.
- Conditional Defense: `t_c6df85cf` / run `1210` — `TIMEOUT`, preserved as history.
- Bounded Defense recovery: `t_a3f64b99` / run `1211` — `TIMEOUT`, preserved as history.
- Focused Defense reconciliation: `t_01cd78ec` / run `1212` — terminal `PASS`, focused live validation `116 passed, 0 failed`.

Final Control must decide whether the complete production candidate is ready for
Orchestrator integration. It must preserve all timeout and FAIL history; it may
not relabel or erase those records.

## Worktree and base

WORKTREE: `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-all-produkcja-r2-20260923`
BRANCH: `hermes/R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2-20260923`
BASE: `origin/main=a8c9cf6c181f688201dd45e6a5871da1b0eb1301`

The worktree is intentionally dirty and protected. Do not reset, clean, stash,
checkout, restore, pull, merge, commit, push, deploy, or delete prior evidence.
Do not change product source, matrix data, semantic source, `ai_*`, save schema,
configuration, or test logic. Final Control may write only the Final Control
artifacts listed below.

## Goal

Independently verify that the Production r3 candidate satisfies the original
five-field production-matrix goal for player, AI and city-state runtime paths,
including the corrected live AI seam, and that the candidate is ready for a
separate Orchestrator integration gate.

Final Control is not integration, publication, push, merge, deploy, or owner
approval. It must not issue `READY_FOR_DEPLOY`; at most it may issue
`READY_FOR_INTEGRATION` / `gotowość do integracji: TAK` in its own report.

## Read-only source and evidence set

Read all of the following before deciding:

- `00-dispatch.md`
- `01-operator.md`
- `02-evaluator-r3.md`
- `02-transition-receipt-r3.json`
- `03-dispatch-defense-r3.md`
- `attempt-defense-recovery-20260924/00-dispatch-defense-recovery-r3-attempt2.md`
- `attempt-defense-recovery-20260924/01-timeout-receipt.md`
- `attempt-defense-reconciliation-20260924/00-dispatch-defense-reconciliation-r3-attempt3.md`
- `attempt-defense-reconciliation-20260924/02-reconciliation-receipt-attempt3.md`
- live logs `/tmp/production-defense-r3-live.log` and
  `/tmp/production-defense-r3-reconciled-live.log` when present
- live Kanban readback for every parent and run listed above
- actual `git status`, `git diff --stat`, full diff against the declared base,
  and allowlist readback in the declared worktree

Read the actual source call-sites needed to validate the evidence, including:

- `gra/src/main.ts` — `runAiPhase`, `isProductionAllowed`,
  `availableProduction`, `advanceProduction`, and owner routing;
- `gra/src/game/production.ts` — cost and speed matrix consumers;
- `gra/src/game/auto-manage.ts`, `gra/src/game/civ-matrix.ts`,
  `gra/src/ui/cityPanel.ts`;
- `gra/tools/civ-matrix-production-consumer-test.cjs`;
- `gra/tools/civ-matrix-production-runtime-live-test.cjs`;
- `gra/tools/civ-matrix-production-consumer-evidence.md`;
- `gra/data/civ-matrix.json` only as read-only source data.

## Exact allowlist

Product and test paths allowed for review, and already named by the Operator
chain:

- `gra/src/game/auto-manage.ts`
- `gra/src/game/civ-matrix.ts`
- `gra/src/game/production.ts`
- `gra/src/main.ts`
- `gra/src/ui/cityPanel.ts`
- `gra/tools/civ-matrix-production-consumer-test.cjs`
- `gra/tools/civ-matrix-production-runtime-live-test.cjs`
- `gra/tools/civ-matrix-production-consumer-evidence.md`
- this topic's run directory under
  `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2-20260923/`

Forbidden as changed paths: `gra/data/civ-matrix.json`,
`gra/src/game/civ-matrix-semantic.ts`, every `ai_*` path, save schema,
configuration, `gra-robocza/**`, `dyspozycje/WERSJE.md`,
`dyspozycje/_handoff/**`, `.git/**`, unrelated files, and all external effects.

## Required independent checks

1. **Chain and objection resolution**
   - Verify the exact task/run chain above from native Kanban readback.
   - Preserve the Evaluator's single numbered objection and both Defense timeouts.
   - Confirm the reconciliation receipt is terminal and source-backed, not a
     prose-only claim.
   - Decide the objection per the Final Control contract: `NAPRAW`, `ODDAL`, or
     `DO DECYZJI CZŁOWIEKA`. A PASS requires the objection to be resolved or
     explicitly dismissed with exact evidence; no unresolved numbered objection
     may be hidden in a note.

2. **Scope and provenance**
   - Compare the full dirty diff with `a8c9cf6c181f688201dd45e6a5871da1b0eb1301`.
   - Confirm every changed path is in the exact allowlist and no unrelated hunk
     was absorbed.
   - Confirm no product source was changed by Defense reconciliation; the only
     Defense code edit is the run-local live-test assertion correction, with its
     receipt and focused command.
   - Confirm no commit, push, merge, deploy, or publication occurred.

3. **Production behavior and parity**
   - Independently read the formulas and call-sites for all five `prod_*`
     parameters.
   - Confirm real owner-scoped routing for player, AI and city-state, including
     the actual `main.ts → runAiPhase → availableProduction` path.
   - Confirm the reconciled assertion does not incorrectly require cost and speed
     fields in one callback, while separate cost/speed coverage remains present.
   - Confirm the evidence covers 15 civilizations, all five fields, neutral/
     unknown and ±10% boundaries, auto-build/auto-manager, player/AI/city-state,
     city panel/rush and world-end-turn without double counting.
   - Treat raw data reads, helper-only probes, fixtures, static token search and
     comments as non-evidence for live gameplay.

4. **Repeatable gates**
   Run only bounded, project-local, read-only validations as needed. Record exact
   commands, exit codes and outputs in the report:

   - `node --check` for both production test scripts;
   - focused consumer test;
   - corrected real Vite/headless runtime gate, with explicit timeout;
   - `node tools/logic-test.cjs` or the exact logic gate used by the Operator;
   - project-local TypeScript check from `gra/` using the repository compiler;
   - JSON parse/validation for `gra/data/civ-matrix.json`;
   - `git diff --check`;
   - any additional bounded check must be justified and must not mutate the
     product or broaden the allowlist.

Do not convert a timeout, partial log, or worker summary into PASS. If a required
read-only check cannot be completed within the bounded window, report the exact
`INFRA/UNKNOWN` limitation and do not claim product acceptance.

## Final Control artifact contract

Write only these files under the topic run directory:

- `03-final-control.md`
- `03-final-control-evidence.json`
- `03-transition-receipt-final-control.md`

The report must contain the canonical fields:

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA
DOMAIN: GAME | INFRA
TEMAT: R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2-20260923
GOAL: ...
ZMIANY/COMMIT: ...
TESTY: exact commands/results
BLOKADY: ...
RUNDY: 3/5
NASTĘPNY KROK: ...
DEPLOY/PUSH: NIE WYKONANO
```

The machine-readable evidence must include at least:

- exact chain and terminal run IDs;
- objection decision and Defense resolution;
- base, branch, worktree and changed-path allowlist result;
- independent test results;
- product acceptance boolean;
- `ready_for_integration` boolean;
- explicit `commit`, `push`, `merge`, `deploy` false;
- artifact paths;
- limitations/notes and the one legal next step.

## Verdict boundary

- `PASS` or `PASS-WITH-NOTES` is legal only if the live seam, scope, tests,
  parity and evidence are independently complete and no blocking objection
  remains.
- `FAIL`/`BLOCK`/`INFRA` is required for any unresolved live-evidence gap,
  out-of-allowlist change, product regression, or unverifiable provenance.
- Never issue integration or deployment authorization from a timeout or from
  the old `115 passed / 1 failed` log alone.
- Do not create successors from inside this worker. The Orchestrator will read
  the terminal event and, only after a confirmed Final Control PASS, create one
  workerless `INTEGRATION_REQUIRED` gate that remains blocked/unassigned.
