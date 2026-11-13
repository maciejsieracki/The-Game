# 04-dispatch — workerless integration gate for combat reconciliation

STATUS: DISPATCH READY
DOMAIN: PROCESS / GAME EVIDENCE
ROLE: INTEGRATION_REQUIRED — Orchestrator only; no worker
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-COMBAT-RECON-ORIGIN-20260922
SOURCE_FINAL_CONTROL: t_c3a89662 / run 919
SOURCE_EVALUATOR: t_042404eb / run 915
SOURCE_OPERATOR: t_aff5825f / run 913 (bounded review of run 908)
PARENT_PROGRAM: t_69522e22
BOARD: the-game-real24
PROFILE: default
PROJECT: p_9ae9ac64
TENANT: the-game
ROUND: 1/5
ATTEMPT: integration-current-20260922
IDEMPOTENCY_KEY: R-CYWILIZACJE-MACIERZ-WIRING-COMBAT-RECON-ORIGIN-20260922:integration:r1
SOURCE_WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-combat-recon-origin-20260922
SOURCE_BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-COMBAT-RECON-ORIGIN-20260922
SOURCE_HEAD/BASE: a0cc8933c2341f63c0c084395e668bd509731392
ORCHESTRATOR_WORKSPACE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-integration-current-20260922

## PURPOSE

Hold the bounded combat reconciliation for Orchestrator readback and allowlist-only integration handling. This gate is not a gameplay worker and must remain blocked, unassigned and without a run. It does not authorize matrix wiring, merge, push or deploy.

## ACCEPTED EVIDENCE BOUNDARY

Final Control is `PASS-WITH-NOTES` only for evidence scope `60 × 15 = 900`:

- `0 WIRED_REAL_GAMEPLAY`;
- `35 BLOCKED/DECISION_REQUIRED` = `525` cells;
- `25 DEAD_UNWIRED` = `375` cells;
- no scoped-ID production consumers outside loader/semantic metadata;
- no product/data/save-schema changes;
- no numbered Evaluator objections;
- known notes: dispatch-listed `fort-territory-test.cjs` absent but covering gate `85/85`; exact pre-existing `unit-power` baseline `4 passed / 2 failed`.

The evidence is not a claim that combat is wired and is not completion of the `113 × 15` matrix.

## ORCHESTRATOR ACCEPTANCE

Before any integration decision, read back:

1. source task/run/event/artifacts and the exact Final Control receipt;
2. source worktree HEAD/base, tracked diff and allowlist;
3. current aggregate gate parents and sibling Final Controls;
4. current integration worktree from verified `origin/main`.

For this topic, expected product integration is `NO_PRODUCT_DIFF` unless a later owner-approved scope explicitly changes it. Do not stage the source worktree's untracked evidence into product code. If process evidence must be secured, use a separately allowlisted process-only action; never use `git add -A` or absorb unrelated worktree dirt.

## HARD BOUNDARY

- Keep this card `blocked`, `assignee=null`, `current_run_id=null`, with no worker claim.
- Do not dispatch, promote or assign it.
- Do not edit `gra/src/**`, `gra/data/**`, save schema or `gra-robocza/**` from this gate.
- Do not create a replacement for aggregate gate `t_29528055`; that gate has a different parent set and remains an independent aggregate boundary.
- Do not call this `READY_FOR_DEPLOY`; Final Control explicitly forbids gameplay wiring, merge and deployment.

## NEXT LEGAL ACTION

The Orchestrator performs the readback and either records `NO-OP/AUDIT-ONLY` for this bounded evidence topic or executes a separately authorized, allowlist-only process-evidence integration. The gate remains a process boundary until that readback is complete.
