# Evaluator — independent review

**Verdict: PASS.** Reviewed candidate `271fcf39f` in `/tmp/codex-peace-ten-turns`; no source changes made during evaluation.

The implementation meets the requested timing rule. `PEACE_PROPOSAL_MIN_WAR_TURNS` is the shared threshold (10) used by the server-side proposal evaluator, AI↔AI forced-peace queue, and war-weariness tick. The evaluator blocks `pokoj`, `rozejm`, and `trybut_oferta` while the pair is at war and elapsed war time is 0–9; elapsed 10 proceeds into the existing valuation/acceptance path. Because pending offers are evaluated through the same evaluator, a saved or already-pending offer cannot settle early.

The central `setDiploRelation` transition stamps `wojnaStartTura` on entry into war and clears it on exit. Pair metadata is included in save/load. This covers ordinary and era wars, and a later transition back into war starts a fresh window. A truce expiry restores war state through the central transition, so it receives a new start stamp. AI↔AI requests are not registered early; pre-existing saved requests stay queued until elapsed 10. The war-weariness tick still updates fatigue in the blocked window, while deferring offer creation and resolution.

Manual proposal submission and counteroffer/edit resolution route through `evaluateProposal`; AI→player resolution also uses the evaluator. The guard is therefore server-side and shared across directions, not a UI-only restriction. I found no changed post-window valuation or acceptance thresholds.

The threshold is a code constant, not a dispatch/config data field. That is consistent with the implementation request for one shared minimum and avoids separate values drifting across paths; it would need a follow-up only if the product later requires scenario-level tuning.

Commands run from `gra/`:

- `node tools/diplo-war-peace-gate-test.cjs` — **24 pass, 0 fail**; real evaluator coverage for all three actions at elapsed 0, 9, and 10, plus directions, war kinds, save/load and restarted wars.
- `node tools/ai-war-nearest-city-peace-2t-test.cjs` — **41 pass, 0 fail; 16/16 mutants killed**; includes a saved pending AI↔AI request held until elapsed 10.
- `node tools/ai-war-weariness-peace-test.cjs` — **96 pass, 0 fail**; fatigue continues at elapsed 9 and automatic peace may settle at elapsed 10.
- `node tools/diplo-war-peace-main-guard-test.cjs` — **31 pass, 0 fail**; central stamp lifecycle and pair metadata serialization.
- `npm run typecheck` — **PASS**, `tsc --noEmit`, exit 0.

No browser/live UI run was performed; no browser claim is made. The candidate remains unpushed and undeployed.
