# AutoBot Final Control — ready-subset integration candidate

**Verdict: PASS-WITH-NOTES. Exact subset is ready to publish.**

Candidate: `/tmp/the-game-ready-subset-20261028`, branch `integration/robocza-ready-subset-20261028`, base `99bb834c6fe158d3bc59eb741f8fde9637b77027`. The worktree product/test diff is limited to leader roster selection (`generals.ts`, `main.ts`), capital commander recruitment card wiring (`cityPanel.ts`, `empireDetailPanel.ts`, scoped `main.ts` import/title/callback), default formation/doctrine (`battleScene.ts`, `formationRules.ts`), and their focused tests. No unexpected changed paths were found.

I read the matching army/General operator and evaluator reports (22, 27), recruitment operator/evaluator reports (34, 35, 60), formation/leadership reports (49–52, 61), current candidate control (63), and the battle browser-return follow-up (51). Their behavior limits remain scoped: Wódz/Generał AI follow behavior and large-empire performance are not release claims here. The explicitly excluded commander badge/emblem, AI sea priority, AI five-turn march, and large-empire performance work are outside this candidate.

Checks on the exact worktree:

- `general-eligible-unit-roster-test.cjs`: **137 checks passed** across civ/era availability, chariot/cavalry selection, and gates.
- `general-capital-recruitment-order-test.cjs`: **all checks passed**, including real Chromium card click, transaction, capital-only and era-limit rejections.
- `empire-mass-recruitment-test.cjs`: **30 passed, 0 failed**, including actual commander card mount/click and panel fit at 404px.
- `battle-formation-rules-test.cjs`: **PASS** for default roles, mounted wings, Attack pacing, and ranged fire on range entry.
- `bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs`: **12 passed, 0 failed** across Atak, Obrona, and independent Szturm targeting.
- `npm run typecheck -- --pretty false`: **PASS**.
- `git diff --check`: **PASS**.
- `npm run build -- --outDir /tmp/the-game-ready-subset-final-control-20261028`: **PASS**, 916 modules; output is `/tmp/the-game-ready-subset-final-control-20261028/index.html` (69,924.29 kB).

Browser coverage note: the recruitment suite renders the production commander card in Chromium and verifies the real callback, and the battle suite bundles the production BattleScene seam for deterministic doctrine checks. This control did not run the full game UI across a responsive viewport matrix or complete a fresh live battle interaction for the revised formation. Earlier 28v28 battle-return browser evidence verifies return/render cleanup, not this exact formation change. No assertion failures were observed in the requested focused gates.

This report makes no claim that the excluded performance or AI features are ready. No product source was edited for final control; no commit, push, or deploy was performed.

## Addendum — base and exact tested diff correction

**Correction:** the candidate base is `0b28d67fe6fae0bfbf9be39bd0ec84130080fb4d`, not `99bb834c6fe158d3bc59eb741f8fde9637b77027`. `git rev-parse HEAD`, `git log`, and the reflog identify `0b28d67f` as `HEAD` on `integration/robocza-ready-subset-20261028`; `origin/main` points to the same commit. The earlier `99bb834` value came from older AutoBot reports and was incorrectly carried forward into this report.

The requested assertions were run in this same worktree path against the then-current diff. Review of the current status and paths confirms the exact product/test subset assessed is these 11 files: the six source files and five focused test files listed below. The three new tests are untracked relative to the base, so ordinary `git diff HEAD` fingerprints alone omit them; these per-file SHA-256 values bind the current tested files:

| File | SHA-256 |
|---|---|
| `gra/src/battle/battleScene.ts` | `9a8237281d56a5fed9b0e52a016623d34e9164ecd1417d958b697ef0d25384b8` |
| `gra/src/battle/formationRules.ts` | `0cfd3d249af3453c7b900f36c88e67d2c85c7439743b03be6d6e322c35df2f7b` |
| `gra/src/game/generals.ts` | `401ea4782a57817f01d4a19d87e758ccbd2817bfe4d3ea57eeec6e8eeafb6673` |
| `gra/src/main.ts` | `009a91946096fd23563e8c3499fd9b86d2cf29c2a52a199b728601fc4c277470` |
| `gra/src/ui/cityPanel.ts` | `6a5cfb3853b5dbb69dd43be0eb8405625039a2e869d830b0c824bfaf9f9d3cd4` |
| `gra/src/ui/empireDetailPanel.ts` | `c1e7691c456087580bf9669a80e9e7c6b515aa1abd129132f830f89a150f94fc` |
| `gra/tools/battle-formation-rules-test.cjs` | `f16c123ea08968219a1a1f595b7d064a0030995485d29339525b6dd9fbe8ee8b` |
| `gra/tools/empire-mass-recruitment-test.cjs` | `3466f442b2bc3aaacc71b771bb86050b39af2c7430f9b713cc4feb24685f4535` |
| `gra/tools/bitwa-auto-atak-wielojednostkowy-evaluation-test.cjs` | `fa855db232b56ae238ab46078db196077a60f35783c2106f731b083452f57f96` |
| `gra/tools/general-capital-recruitment-order-test.cjs` | `626e50713a725d1b837fa9da4ee3ab0873df1144cc39073081f71e1716088ecd` |
| `gra/tools/general-eligible-unit-roster-test.cjs` | `e4dde85f1ecd5309e1a5de5b4b1441a0dd5c6b7fc1525d97787eb8ae2cfac4c9` |

At this readback the tracked source/test diff remains exactly the eight expected paths; the three focused additions are the new test files above. Other untracked AutoBot run folders are separate records and were not included in the product/test review. No source/test files were edited for this correction; no commit or deploy was performed.
