# Final control — ten-turn peace and truce gate

**Decision: PASS for stage 8 code/evidence readiness.** Candidate reviewed: `271fcf39f323de6c7fd03e72d7529815e074915b` in `/tmp/codex-peace-ten-turns`. I found no blocker to advancing this candidate to the next authorized review step. This is not a release or deployment approval.

The server-side guard checks the current war state and elapsed turns for `pokoj`, `rozejm`, and `trybut_oferta`. While the pair is at war, elapsed 0 through 9 is blocked; elapsed 10 passes to the existing evaluation and acceptance rules. `evaluateProposal` is used for manual submission, counteroffers/edited offers, and AI-to-player decisions, so the guard applies in both proposal directions and during resolution of existing pending proposals. The UI hints call the same timing predicate, but the rule is enforced in the shared evaluator.

The independent automatic paths are covered too. AI-to-AI request registration and tick resolution check the shared 10-turn threshold; a request already in the save remains queued until elapsed 10. The war-weariness tick continues to update its peak fatigue state during elapsed 0–9, but defers offer creation and resolution until the threshold. Thus the gate does not pause fatigue progression or reset the pending request's timer.

The central relation setter stamps `wojnaStartTura` on transition into war and clears it on transition out. That covers ordinary declarations, forced/era wars, and truce expiry returning a pair to war. Pair metadata carries the stamp through save/load. A new war after peace or truce receives a fresh window; the existing pending offers are still subject to the evaluator guard. The tests exercise start/stop/restart, both war kinds, and save/load.

There is one shared code constant, `PEACE_PROPOSAL_MIN_WAR_TURNS = 10`, used by the evaluator, AI-to-AI forced-peace flow, fatigue flow, and UI hint. It is not a scenario/data config field. That is coherent with this task's single shared minimum and prevents path drift; scenario-specific tuning would require an explicit follow-up design decision.

I reran the candidate checks from `gra/`:

- `node tools/diplo-war-peace-gate-test.cjs` — 24 pass, 0 fail.
- `node tools/ai-war-nearest-city-peace-2t-test.cjs` — 41 pass, 16/16 mutants killed.
- `node tools/ai-war-weariness-peace-test.cjs` — 96 pass, 0 fail.
- `node tools/diplo-war-peace-main-guard-test.cjs` — 31 pass, 0 fail.
- `npm run typecheck` — pass (`tsc --noEmit`).

**Readiness limits:** no browser/live UI session was run, so this report makes no visual interaction claim. The candidate is not pushed, merged, or deployed. The decision is limited to the ten-turn rule, its enumerated offer paths, lifecycle persistence, and the checks listed above.
