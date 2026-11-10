# Final control — R-WEB-CAVALRY-FRONT-FLANKS-PLACEMENT-Q1

STATUS: PASS — candidate is ready for release integration
READINESS: 8/10
CANDIDATE: `2bf964154260b4392a5848227975f9f2c184129d`

## Independent verification

- The production placement model test passes: **163 checks**. Coverage includes all three cavalry modes, both army axes, default and legacy fallback, restoring a manually selected group mode through replay, and mixed rosters with collision-free planned and drag destinations. The test detects removal of the forward placement offset.
- Configured 1–3 role ranks remain a minimum. In the stretched drag planner, each main band uses the greater of its configured rank count and the ranks needed to fit the selected lane. Rear cavalry also receives enough ranks for the lane. The test covers narrow lanes and verifies unique planned destinations.
- Default starting formation remains close to the main body: **536 checks**, maximum distance 3. The close-flank regression passes **994 checks**, and the formation-rules regression passes.
- `npm run typecheck` and `git diff --check HEAD` pass.
- The independent Chromium evidence in the evaluator report and screenshots demonstrates the actual popup's three choices, default flanks, applying front to all 8 mounted units ahead of the body, and no console errors. The popup-row mutation is detected.
- Scope review confirms the implementation is confined to the deploy planner in `battleScene.ts`; `formationRules.ts` and combat balance are untouched. Replay restores only recognized per-group cavalry modes; absent values in legacy snapshots retain the toolbar default of flanks.

## Release limits

The evidence verifies deploy planning, replay mode restoration, and the live deploy UI. Movement and attack execution were not replayed in the live browser session; the reviewed combat path consumes placed runtime coordinates. Terrain-specific collision resolution in a live battle was not separately exercised. These limits do not block release of the scoped deploy-control change.

No source changes were made during this control. No push, merge, or deploy was performed.
