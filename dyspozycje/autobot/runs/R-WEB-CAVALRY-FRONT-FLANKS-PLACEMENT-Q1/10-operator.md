# Operator report — R-WEB-CAVALRY-FRONT-FLANKS-PLACEMENT-Q1

STATUS: OPERATOR COMPLETE; independent evaluation pending

## Diagnosis and change

The cavalry deploy control previously exposed only `flanks` and `rear`; the planner had no front-mounted role. The replay snapshot preserved unit groups and attack direction but omitted each group's effective cavalry mode. `_initDeployUI()` clears group metadata before replay, so a manually chosen group mode could be lost. The new snapshot stores the effective mode per player unit and restores recognized modes; old snapshots with no mode still use the default. The toolbar default remains `flanks`.

The shared stretched-placement path also kept the configured 1–3 depth ranks when a role band was wider than the drag lane. A representative 11-cell drag lane with 32 melee/javelin units and two configured ranks produced overlapping destinations; the physical placement resolver could then leave units behind. The planner now adds enough depth ranks to fit the chosen lane, while retaining the configured rank count as a minimum. Rear cavalry uses the same width constraint. This stays within the deploy planner; `formationRules.ts` and combat balance were not changed.

The popup now offers `Z przodu`, `Z boku`, and `Z tyłu`. Front cavalry occupies the forward axis for either side; flank placement stays beside the main body. Combat movement and attacks consume the placed runtime coordinates (`q/r`); they do not read the deploy-mode enum. No movement or attack rules were changed.

## Verification

- `battle-cavalry-front-flank-placement-test.cjs`: **163 checks pass**. It exercises F1/F2/F3, front/flanks/rear, both army axes, mixed rosters through 394 units including 96 mounted units, collision-free planned and dragged layouts, close wings, legacy missing mode, replay restore, and fallback to default flanks. A planner mutation that removes the front depth offset is detected.
- Existing `battle-deploy-cavalry-flanks-test.cjs`: **536 checks pass**, maximum distance to own unit 3.
- Existing `battle-flank-close-formation-test.cjs`: **994 checks pass**.
- Existing `battle-formation-rules-test.cjs`: pass.
- `npm run typecheck`: pass; `git diff --check`: pass.
- Chromium production UI run: pass. Default was `flanks`; the actual popup displayed all three options. Choosing front placed 8 mounted units on the forward axis (`min q=30`, body `min q=28`); there were no console errors. A Vite source mutation removing the front popup row was detected by the browser check.

Screenshots: `evidence/cavalry-options-live.png` and `evidence/cavalry-front-applied-live.png`.

## Limits

The browser check validates the real deploy popup and placement callback. Attack and movement execution were not replayed in that browser session; the unchanged combat path was reviewed to confirm it uses placed coordinates. The test verifies planned and drag destinations, but not terrain-specific collision resolution during a live battle.

No push, merge, or deploy performed. Candidate commit: recorded in the handoff message.
