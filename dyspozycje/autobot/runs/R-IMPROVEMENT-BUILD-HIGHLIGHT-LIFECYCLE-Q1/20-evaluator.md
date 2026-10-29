# Independent Evaluator — R-IMPROVEMENT-BUILD-HIGHLIGHT-LIFECYCLE-Q1

Verdict: **PASS-WITH-NOTES** for implementation and verification scope. Stage 6/11. No product files changed by Evaluator; no merge, deploy, or push.

## Independent review and reruns

- Reviewed the operator diff in `main.ts`, `units.ts`, `rangeOverlay.ts`, and `buildHighlight.ts`.
- The opacity rule is explicit and relative: generic build highlight `0.35 * 1.20 = 0.42`; mine overlay `0.30 * 1.20 = 0.36`.
- Pending-build filtering is keyed by both hex and improvement type. Successful placement registers the pending key before refresh; failed placement leaves it eligible; undo restores eligibility.
- `improvement-build-highlight-lifecycle-test.cjs` — **39/39 PASS**, including the mutation that removes pending filtering.
- `kopalnia-podswietlenie-heksow-test.cjs` — **76/76 PASS**, including relief/depth behavior and overlay disposal.
- Independently rebuilt the production Vite bundle and ran `improvement-build-highlight-lifecycle-live-test.cjs` in Chromium — **48/48 PASS**, covering all visible improvement types, measured opacities, failed and successful farm placement, reselection, undo, and a mine on hill/mountain relief. No JS or console errors.
- `npm --prefix gra run typecheck` — PASS; `git diff --check` — PASS.

## Notes for Final Control

- The defined interpretation of “20% brighter” is a 20% relative increase in overlay alpha; this is consistent with the renderer's previous alpha values and the agreed measurable interpretation.
- Chromium numeric/state assertions establish the opacity and lifecycle behavior. The supplied before/after screenshots use a live production scene but are not tightly cropped or paired to make the visual brightness delta easy to judge by eye. Keep the numeric opacity assertion as the primary brightness proof, or improve screenshot framing if a purely visual comparison is required.
- No blocking correctness defect found. Final Control should verify the combined game build and interaction with construction undo/turn resolution before integration.
