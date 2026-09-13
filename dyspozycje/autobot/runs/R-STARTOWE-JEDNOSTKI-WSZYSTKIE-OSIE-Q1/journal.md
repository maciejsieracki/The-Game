# Journal — R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1

2026-09-13 — Operator readback
- Task: `t_af4dfeb8`; phase `operator`; round `1/5`, attempt `1`.
- Worktree and actual Git branch read back. HEAD: `8e5e81255449bc98c9674c6a6e5505d408b343fc`; merge-base/original base: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`.
- Authoritative workbook `/home/ubuntu/.hermes/attachments/The-Game-startowe-jednostki-do-korekty.xlsx` read from XLSX XML; SHA-256 `e04a427c5f761b19471b11855a236f280949b9b3be04682c09fcec2f03739cce`.
- Workbook values recorded: player `2/1/0`; major AI extra units `0/1/2` plus hard extra city `1`; foreign city-state `2/1/0`; player-type city-state `0/1/2` from its own slider.

2026-09-13 — Baseline and source audit
- Fresh HEAD behavior was inspected before changing values. Product wiring in `main.ts` already separated PM same-type, player, foreign PM and major AI paths; first-city state was per owner.
- Existing broad `ai-test.cjs` result: `291 passed, 4 failed`, all four failures in diplomacy/trade. The same result was reproduced from a clean `git archive HEAD`; no unrelated fix was introduced.

2026-09-13 — Minimal implementation
- Changed `playerStartUnitCount` to `easy=2`, `normal=1`, `hard=0`.
- Changed level-3 AI start-unit data and fallback to `2`; left level-3 hard extra-city value `1` and fallback behavior intact.
- Updated allowlisted tests only. `main.ts` remained unchanged.

2026-09-13 — Verification
- Focused logic: `90`, city-state logic: `16`, AI balance: `18`, cluster-difficulty: `31`, all zero failures.
- Map spacing regression: `20` maps; `23281` planned pairs and `25463` runtime-order pairs; zero violations.
- Typecheck and all four test-script syntax checks: exit `0`.
- Chromium: city-state runtime `25 pass, 0 fail`; hot-seat first-city runtime `13 pass, 0 fail`; zero browser JS/console errors.
- Mutation restored the old player `1/2/3` helper in an isolated copy; focused test returned `87 passed, 3 failed`, exit `1`; mutant killed.
- Temporary generated bundles and runtime output were removed. `git diff --check` exit `0`.

2026-09-13 — Handoff
- Status: `PASS-WITH-NOTES` solely because the broader pre-existing diplomacy/trade test remains red on both current and clean HEAD.
- No commit, push, PR, merge, deploy or `READY_FOR_DEPLOY`.
- Next gate: independent Evaluator readback.
