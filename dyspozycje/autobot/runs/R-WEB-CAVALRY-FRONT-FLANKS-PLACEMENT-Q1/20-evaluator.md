# Independent evaluator — R-WEB-CAVALRY-FRONT-FLANKS-PLACEMENT-Q1

STATUS: PASS — independent scope checks complete

## Independent checks completed

- `node tools/battle-cavalry-front-flank-placement-test.cjs`: **PASS, 163 checks**. This executes the production `BattleScene` placement methods. It covers F1/F2/F3 for front/flanks/rear on attacker and defender axes, ordinary and mixed rosters (up to 394 units / 96 mounted), collision-free planned and stretched destinations, close flanks, legacy missing-mode fallback, manual-mode replay restoration, and the model mutation that removes the front offset.
- `npm run typecheck`: **PASS**.
- Existing `battle-deploy-cavalry-flanks-test.cjs`: **PASS, 536 checks**, maximum distance to own unit 3.
- Existing `battle-flank-close-formation-test.cjs`: **PASS, 994 checks**.
- Existing `battle-formation-rules-test.cjs`: **PASS**.
- `git diff --check HEAD`: **PASS**.
- `node tools/battle-cavalry-front-flank-placement-test.cjs --live`: **PASS**. In production UI over HTTP/Chromium, the default was `flanks`, the visible popup offered `front` / `flanks` / `rear`, selecting front moved all 8 mounted units to the actual forward axis (`cavFront=30`, `bodyFront=28`), and there were no console errors. Removing the front popup row through a Vite source mutation was detected.

Source review confirms that stretched main-role bands use `max(configured role lines, ceil(unit count / drag span))`, so the configured depth remains a minimum and more ranks are added only to fit the chosen lane. Front cavalry is placed on the army-facing depth axis using side-aware column offsets. Replay captures each player's effective group mode and restores only the recognized `front` / `flanks` / `rear` values; snapshots without this field leave metadata unset and fall back to the `flanks` toolbar default. A restored manual group value takes precedence in `_cavalryModeForDeployUnits` over that global default. The changes remain in `battleScene.ts`; `formationRules.ts` is untouched.

The live run also refreshed the two screenshots: the popup shows all three Polish choices with flanks selected, and the applied-front state is captured.

## Scope and remaining limit

The evidence supports the actual planner and replay fallback behavior, including collision-free destinations across both axes and mixed large rosters. This is not a full campaign or terrain-specific live collision-resolution evaluation.
