# 04-dispatch — workerless integration gate for AI/diplomacy reconciliation

STATUS: DISPATCH READY
DOMAIN: PROCESS / GAME EVIDENCE
ROLE: INTEGRATION_REQUIRED — Orchestrator only; no worker
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-AI-RECON-ORIGIN-20260922
SOURCE_FINAL_CONTROL: t_f475a224 / run 921
SOURCE_POST_DEFENSE_EVALUATOR: t_12bb8087 / run 917
SOURCE_DEFENSE: t_6d7d452d / run 916
SOURCE_OPERATOR: t_a3c99ae6 / run 910
PARENT_PROGRAM: t_69522e22
BOARD: the-game-real24
PROFILE: default
PROJECT: p_9ae9ac64
TENANT: the-game
ROUND: 1/5
ATTEMPT: integration-current-20260922
IDEMPOTENCY_KEY: R-CYWILIZACJE-MACIERZ-WIRING-AI-RECON-ORIGIN-20260922:integration:r1
SOURCE_WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-ai-recon-origin-20260922
SOURCE_BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-AI-RECON-ORIGIN-20260922
SOURCE_HEAD: a0cc8933c2341f63c0c084395e668bd509731392
SOURCE_BASE/ORIGIN_MAIN: a0cc8933c2341f63c0c084395e668bd509731392
ORCHESTRATOR_WORKSPACE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-integration-current-20260922

## PURPOSE

Hold the bounded AI/diplomacy reconciliation for Orchestrator readback and
allowlist-only integration handling. This gate is not an implementation worker,
does not wire the two unresolved fields, and does not authorize merge, push or
deploy. It must remain blocked, unassigned and without a run.

## ACCEPTED EVIDENCE BOUNDARY

Final Control is `PASS-WITH-NOTES` only for the bounded evidence bundle:

- `16 × 15 = 240` cells;
- `9 REAL_GAMEPLAY`, `5 UI_ONLY`, `2 DECISION_REQUIRED/UNWIRED`;
- `30/30` cells unresolved for the two fields;
- semantic snapshot `150 REAL_GAMEPLAY / 75 UI_ONLY / 1470 UNWIRED` out of `1695`;
- `dip_nastawienie_bazowe` corrected to `UNWIRED`, removed from proven consumers and default visibility;
- `dip_agresja_archetyp` remains `DECISION_REQUIRED / UNWIRED`, with no silent mapping to `ai_agresywnosc`;
- post-Defense Evaluator objections: empty;
- focused gates, typecheck and diff-check passed;
- known broad AI baseline remains `exit 1; 290 passed, 5 failed`;
- generic process-docs audit is not applicable as a green GAME gate because it rejects the two accepted Defense `gra/` paths by design.

This is not completion of the AI domain and is not completion of the full
`113 × 15 = 1695` matrix.

## APPROVED PRODUCT ALLOWLIST

The only product paths eligible for a later Orchestrator integration readback
from this source are the accepted Defense correction:

- `gra/src/game/civ-matrix-semantic.ts`
- `gra/tools/civ-matrix-semantic-labels-test.cjs`

The source worktree also contains untracked process/evidence artifacts and an
inherited focused test. Do not stage them into the product commit unless a
separate process-evidence allowlist explicitly names them. Do not stage with
`git add -A` or absorb unrelated worktree dirt.

The approved correction is semantic/provenance truthfulness only. It does not
create a live gameplay consumer for either unresolved field and does not change
runtime source, matrix data, save schema or gameplay contracts.

## ORCHESTRATOR ACCEPTANCE

Before any integration decision, read back:

1. source task/run/event graph, Final Control metadata and exact receipt/evidence;
2. source worktree branch, full HEAD/base, tracked diff and untracked paths;
3. exact two-path product allowlist and absence of forbidden product paths;
4. current aggregate gate parents and sibling Final Controls;
5. a fresh integration worktree from verified `origin/main`, because the current
   orchestrator workspace is already dirty with other bounded candidates and
   process artifacts.

Apply only the two named product paths in a clean, dedicated candidate. Re-run
semantic labels, AI/diplomacy boundary, relevant focused regressions, project
TypeScript and `git diff --check`. Preserve the exact broad baseline and the
fact that both unresolved fields remain unwired.

## HARD BOUNDARY

- Keep this card `blocked`, `assignee=null`, `current_run_id=null`, with no worker claim.
- Do not dispatch, promote or assign it.
- Do not edit `gra/data/**`, save schema, `gra-robocza/**`, `WERSJE.md` or `KANAL-PRACA.md` from this gate.
- Do not wire `dip_nastawienie_bazowe` or `dip_agresja_archetyp` without an owner-approved gameplay contract.
- Do not treat the semantic correction, ledger, UI labels or classifier as full runtime wiring.
- Do not call this `READY_FOR_DEPLOY`; Final Control explicitly forbids merge, push and deployment.
- Do not create a duplicate successor if an exact idempotency-key gate already exists.

## NEXT LEGAL ACTION

The Orchestrator performs the source and clean-candidate readback, then either
integrates exactly the two approved semantic paths through a separate explicit
product integration action or records a bounded `NO-OP/AUDIT-ONLY` result if the
correction is already present in the verified target. The gate remains a
process boundary and is never dispatched as a worker.
