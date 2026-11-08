# 04-dispatch — workerless integration gate for economy reconciliation

STATUS: DISPATCH READY
DOMAIN: PROCESS / GAME EVIDENCE
ROLE: INTEGRATION_REQUIRED — Orchestrator only; no worker
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-ECONOMY-RECON-ORIGIN-20260922
SOURCE_FINAL_CONTROL: t_eb282c93 / run 920
SOURCE_EVALUATOR: t_2f606c7e / run 914
SOURCE_OPERATOR: t_8b0c5dad / run 909
PARENT_PROGRAM: t_69522e22
BOARD: the-game-real24
PROFILE: default
PROJECT: p_9ae9ac64
TENANT: the-game
ROUND: 1/5
ATTEMPT: integration-current-20260922
IDEMPOTENCY_KEY: R-CYWILIZACJE-MACIERZ-WIRING-ECONOMY-RECON-ORIGIN-20260922:integration:r1
SOURCE_WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-economy-recon-origin-20260922
SOURCE_BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-ECONOMY-RECON-ORIGIN-20260922
SOURCE_HEAD/BASE/ORIGIN_MAIN: a0cc8933c2341f63c0c084395e668bd509731392
ORCHESTRATOR_WORKSPACE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-integration-current-20260922

## PURPOSE

Hold the bounded economy reconciliation for Orchestrator readback. This is a
process/evidence gate only, not a gameplay worker and not a product integration
candidate. It must remain blocked, unassigned and without a run. It does not
authorize additional economy wiring, commit, push, merge or deploy.

## ACCEPTED EVIDENCE BOUNDARY

Final Control is `PASS-WITH-NOTES` for the bounded evidence bundle:

- full matrix: `113 × 15 = 1695` cells;
- economy scope: `32 × 15 = 480` cells;
- remaining reconciliation: `31 × 15 = 465` cells;
- ledger: `32` unique rows, byte-for-byte equal to the prior accepted ledger;
- `1 WIRED_REAL_GAMEPLAY`: `lud_wzrost_proc`;
- `31 BLOCKED/DECISION_REQUIRED`;
- `0 DEAD_UNWIRED`, `0 UI_ONLY` in this economy scope;
- approved live consumer: `gra/src/game/population-growth-v85.ts:230-232`, with shared owner mapping at `:448-459`;
- no new consumer for the 31 blocked IDs;
- no zero/no-op adapter, Greece fallback, fabricated formula, unapproved difficulty mapping, player/AI contract or persistence contract;
- Evaluator objections: `[]`, so no Defense phase;
- focused gates and TypeScript passed;
- known baseline remains `population-growth-v85`: `exit 1`, `48 passed, 2 failed`;
- provenance correction only: one malformed parent metadata path omitted `-ORIGIN`; corrected artifact path exists and product evidence is unchanged.

This does not complete the economy domain or the full matrix and does not make
any of the 31 blocked fields eligible for implementation without an owner
contract.

## PROCESS-ONLY BOUNDARY

This gate accepts only the Final Control evidence/receipt readback. There is no
approved product-path allowlist from this bounded reconciliation because Final
Control verified an unchanged product tree: `HEAD`, `origin/main` and
merge-base are `a0cc8933c2341f63c0c084395e668bd509731392`, tracked and staged
diffs are empty, and no runtime/data/save-schema/manifest change was made.

Do not stage the source worktree's untracked reports, focused test copy or
ledger into a product commit. Do not use `git add -A`, `git add .`, or absorb
unrelated dirty worktree state. The ledger SHA is evidence only:
`827f6d31812c579e95edeaed81add2e3376c28a997f1263d00a6eaa26f207c53`.

## ORCHESTRATOR ACCEPTANCE

Before closing or annotating this gate, read back:

1. source task/run/event graph, Final Control metadata and exact receipt/evidence;
2. source branch, full HEAD/base, tracked diff and untracked process paths;
3. ledger SHA and byte-for-byte comparison evidence;
4. current aggregate gate parents and sibling Final Controls;
5. the current integration workspace, which is already dirty with separate meta,
   combat and AI process/evidence candidates.

The legal result for this topic is `NO-OP/AUDIT-ONLY` unless a later owner
explicitly creates a separate, newly contracted economy implementation topic.
Do not manufacture a product commit from a ledger or from the existing
`lud_wzrost_proc` row; that consumer is already present in the verified base.

## HARD BOUNDARY

- Keep this card `blocked`, `assignee=null`, `current_run_id=null`, with no worker claim.
- Do not dispatch, promote or assign it.
- Do not edit `gra/src/**`, `gra/data/**`, save schema, `gra-robocza/**`, `WERSJE.md` or `KANAL-PRACA.md` from this gate.
- Do not wire the 31 `BLOCKED/DECISION_REQUIRED` economy parameters without owner-approved contracts.
- Do not call this `READY_FOR_DEPLOY`.
- Do not create a duplicate successor if the exact idempotency-key gate already exists.

## NEXT LEGAL ACTION

The Orchestrator performs the bounded process-evidence readback and records
`NO-OP/AUDIT-ONLY` on this gate. This process gate remains blocked and is never
dispatched as a worker; it does not authorize product integration or deployment.
