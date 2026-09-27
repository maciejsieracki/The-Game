# 03-dispatch-final-control-correction-20260923 — Oblezenie wiring Final Control after narrow AI correction

STATUS: DISPATCH READY
ROLE: Final Control (independent — highest-level acceptance after corrected AI consumer)
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
BOARD: the-game-real24
PROFILE: default
PROJECT: p_9ae9ac64
TENANT: the-game
PARENT: t_fb7db0be (independent Evaluator narrow AI siege correction, PASS)
WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-oblezenie-20260922
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
BASE: origin/main=0caa4dfa31d37337cd74fdbab95ee77da4806d98
HEAD: f52f3b76b4761136a43dc0ab32dde50552a176fe
MODEL: claude-sonnet-5
PROVIDER: anthropic

## CONTEXT

The original Operator and Evaluator passed the 45-cell Oblężenie wiring. A
bounded provider-fallback Final Control then found one blocking live consumer:
AI siege defender-strength/tier/stance decisions in
main.ts → siegeAi.ts → siege.ts ignored the defending city's
obl_mur_proc and obl_obrona_miasta_proc. One narrow Operator correction was
completed and an independent Evaluator PASS verified the correction.

Read independently and do not trust self-reports:
- 00-dispatch.md and 00-dispatch-round2-fix.md;
- 01-operator.md, 01-evidence.json;
- 02-evaluator.md, 02-evidence.json;
- 03-final-control-recovery-20260923.md and 03-evidence-recovery-20260923.json;
- narrow-correction-20260923/operator-report.md and operator-evidence.json;
- narrow-correction-20260923/evaluator-report.md and evaluator-evidence.json;
- the complete current product diff and current worktree state.

## ACCEPTANCE QUESTIONS

1. Confirm the narrow correction closes the exact prior blocking objection: both
   production AI siege callers pass the defending city's real civKey into the
   shared city-defense formula, with null/unknown data neutral and no Greece
   fallback.
2. Confirm no double application: siegeAi's AI-only strength estimate may use
   the structure multiplier once, while the later real battle path remains
   independent and does not receive a second application from the AI estimate.
3. Confirm backward compatibility and scope: the default/unknown path remains
   the pre-correction neutral behavior; attacker-side obl_machines_proc and the
   previously accepted map/interactive battle wiring remain unchanged.
4. Confirm the correction is limited to the existing allowlist and evidence
   paths, the branch/base/HEAD are the stated ones, and no commit/push/merge/
   deploy was performed.
5. Reconcile the independent test evidence, including the exact 83/17/213/34/29
   focused counts and the two preserved unrelated baseline failures. Any
   remaining issue must be classified as blocking or nonblocking with file,
   line, and consequence.

## ALLOWLIST

Product paths already approved for this topic:
- gra/data/civ-matrix.json
- gra/src/battle/battleScene.ts
- gra/src/game/city-defense.ts
- gra/src/game/siege.ts
- gra/src/game/siegeAi.ts
- gra/src/game/siegeMachines.ts
- gra/src/main.ts
- gra/tools/civ-matrix-oblezenie-wiring-test.cjs

Evidence may be written only under:
- dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922/**

Do not modify product files, prior reports, tests, Kanban records, WERSJE.md,
KANAL-PRACA.md, gra-robocza, or any remote ref. Do not commit, push, merge,
deploy, reset, clean, stash, rebase, checkout, or widen the allowlist.

## VERDICT CONTRACT

Return native terminal PASS, PASS-WITH-NOTES, FAIL, or BLOCK/INFRA. PASS or
PASS-WITH-NOTES requires product_acceptance=true and no blocking objections.
A PASS/PASS-WITH-NOTES result routes to exactly one workerless
INTEGRATION_REQUIRED gate, blocked/capability, assignee=null, no worker and no
current run. FAIL preserves the evidence and returns to the existing topic only
for a specific narrow correction; do not blind-retry the old Final Control.

PUSH/MERGE/DEPLOY: NIE WYKONANO.
