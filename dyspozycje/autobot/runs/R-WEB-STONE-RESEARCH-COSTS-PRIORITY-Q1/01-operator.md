STATUS: PASS-WITH-NOTES — Operator complete; sequential Evaluator required.
DOMAIN: GAME
TEMAT: R-WEB-STONE-RESEARCH-COSTS-PRIORITY-Q1
GOAL: Restore Garncarstwo to 40 PN and set Gospodarka wodna and Koło to 180 PN, preserving all other tech costs and their prereqs, levels, and unlocks; keep tempo multipliers 1/2/4.
ZMIANY/COMMIT: `gra/data/tech.json` changes only the three requested `Koszt nauki` fields (5→40, 72→180, 88→180). Encyclopedia sources and generated wiki bundle are aligned for those same three entries. Updated the linked Garncarstwo regression and added an actual-cost/tempo regression. No `gra/src/game/*` changes. Brązownictwo remains 180 PN pending owner clarification. Candidate commit: this report is included in the candidate commit at branch HEAD.
TESTY: `node gra/tools/stone-research-costs-test.cjs` — 44 pass, 0 fail, testing actual `techCost` and tempo 1/2/4 for all three changes plus unchanged Brązownictwo. `node gra/tools/tech-pottery-fifth-test.cjs` — 45 pass, 0 fail, preserving the four-prerequisite rule and fifth position. `node ./node_modules/typescript/bin/tsc --noEmit` from `gra/` — exit 0. `git diff --check` — pass. Scope proof against base: only `Koszt nauki` changed in those three technology records; `tempo_gry` unchanged; generated wiki diff contains only the three corresponding encyclopedia entries.
BLOKADY: Brązownictwo 180→480 is intentionally not changed until the owner clarifies the ambiguous request. Linked task `R-WEB-POTTERY-RESTORE-PREVIOUS-COST-Q1` was registered in this worktree with dispatch only; the Garncarstwo change and passing evidence here address its requested 40 PN restoration without duplicating the implementation.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator reviews candidate and linked Garncarstwo evidence. Owner clarification is needed only for Brązownictwo.
DEPLOY/PUSH: NIE WYKONANO
