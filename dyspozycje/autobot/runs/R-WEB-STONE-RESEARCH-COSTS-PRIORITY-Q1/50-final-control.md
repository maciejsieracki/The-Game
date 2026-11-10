# Final Control — R-WEB-STONE-RESEARCH-COSTS-PRIORITY-Q1

STATUS: PASS — stage 8 complete; ready for integration review
DOMAIN: GAME
ID: R-WEB-STONE-RESEARCH-COSTS-PRIORITY-Q1
FINAL CONTROL: Codex, `gpt-6-luna` / high (independent)
BASE: `86c97f387`
CANDIDATE: `c6e464fac9df017b3c953b9c603ece6480d4caea`

## Scope and process

The requested scope is Garncarstwo 40 PN, Gospodarka wodna 180 PN, and Koło 180 PN. Brązownictwo remains 180 PN pending owner clarification. Comparing `gra/data/tech.json` at BASE and CANDIDATE shows exactly three changed values, all `Koszt nauki` on those records (5→40, 72→180, 88→180); every other technology field and record is unchanged. `tempo_gry` is unchanged. No `gra/src/game/*` file changed.

The initial evaluator report `20-evaluator.md` remains an accurate historical FAIL: its candidate had stale `wikiS` summaries. The defense fixed the three encyclopedia Wiki-S source strings and regenerated the bundle. The fresh evaluator follow-up `40-evaluator-followup.md` passes. Comparing the bundle at `0764ab4d6` with CANDIDATE shows only the three intended encyclopedia records changed; each now has the corrected value in `wikiS` and `wikiM`. Brązownictwo remains 180 PN in both. The three source pages agree with the bundled summaries. No source edits were needed during this control.

## Direct verification

- PASS — `node tools/stone-research-costs-test.cjs` from `gra/`: 44 passed, 0 failed; exercises runtime `techCost`, tempo 1/2/4, and unchanged Brązownictwo.
- PASS — `node tools/tech-pottery-fifth-test.cjs` from `gra/`: 45 passed, 0 failed; preserves Garncarstwo’s four prerequisites and fifth position.
- PASS — `npm run typecheck` from `gra/`.
- PASS — `git diff --check 86c97f387..c6e464fac9df017b3c953b9c603ece6480d4caea`.
- PASS — source and generated `wikiS`/`wikiM` costs agree for Garncarstwo 40 PN, Gospodarka wodna 180 PN, Koło 180 PN; Brązownictwo remains 180 PN.
- PASS — candidate tree is the expected isolated worktree at CANDIDATE. The only uncommitted files at control time were the evaluator reports and this run-local final-control report; no product source was modified during control.

## Verdict and limits

Aggregate verdict: **PASS**. Stage 8 is complete and the candidate is ready for orchestrator integration review. The requested cost changes use the existing runtime tempo calculation; this control independently reran the specified regressions and typecheck, without a separate interactive game session. Brązownictwo 180→480 remains pending owner clarification. The linked Garncarstwo task can close on publication using this same implementation and evidence, without duplicating its counts.

Integration, deploy, push, and cleanup are outside this Final Control and are not claimed complete. This report does not issue `READY_FOR_DEPLOY`.
