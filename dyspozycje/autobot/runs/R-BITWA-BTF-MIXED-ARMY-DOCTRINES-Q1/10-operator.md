# Operator report — mixed-army doctrine matrix

**Branch:** `autobot/R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1`
**Base:** `origin/main` at `9f6f7771`
**Operator scope:** mixed large-army behavior under Attack (`steady`), Defense (`defensive`), and Charge (`aggressive`), target-priority variants, ranged-line settings, and terrain.

## Test design

`gra/tools/battle-large-mixed-doctrine-matrix-test.cjs` runs production `BattleScene` activation, target-selection, doctrine movement, mounted routing, and formation slot logic headlessly. Its `_doMove` and `_doAttack` adapters update fixture positions/ammo and capture actions; it does not animate, inflict production damage, or render the battlefield. `BTF_ROSTER_SCALE` enables an explicit stress roster while the default remains 42 units per side. `BTF_LINES` and `BTF_TURNS` select test variants.

Production currently caps the battle roster at `MAX_PER_SIDE=120` per side (`gra/src/battle/battleScene.ts:688`). The main 42/side scenario is the agreed representative large engagement; the 84/side synthetic stress run remains below that cap but has static enemy occupancy/no damage and is not a live gameplay result.

## Results

- 42 units/side, two ranged lines, 12 activations: **12/12 scenarios, 0 red conditions**. Compact result is saved in `../R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1/01-max-42-per-side.json`. Matrix: three doctrines × two target-priority variants × engaged/corridor terrain. The results include ranged fire/movement and mounted attack/movement consistent with each doctrine.
- 84 units/side, two ranged lines, 6 activations: **12 scenarios, 7 red conditions**. The seven were steady/engaged center archers that failed to reduce distance to a valid firing position (initial distance 4; final 4–6). Attackers and defenders remain static in this headless harness and no unit takes damage, so congestion persists forever. This identifies a crowded-line path worth following up with dynamic occupancy, but does **not** confirm a production gameplay bug. Compact traced evidence is in `02-stress-84-per-side.json`.
- `gra/tools/battle-ranged-mounted-doctrine-test.cjs`: **9/9 passed** for in-range defense fire/hold, Attack ranged advance/fire, and mounted action routing in Attack/Defense/Charge.
- Chromium production variant `battle-doctrine-live-r4-test.cjs`: **passed** all checks after opening a real 28v28 production scene (30 ranged/16 mounted total), starting through the real UI, and observing live ranged target selection and projectile attacks during round one; no browser errors. It then intentionally isolates a small deterministic set of real production actors/targets for instrumentation. This is not a full 28v28 visual-quality or manual-control browser run. Evidence: `/workspace/tmp-battle-operator/battle-doctrine-r4-evidence-300511-zppp4c/`. A second controlled production Chromium run (`battle-manual-orders-live-open-tile-deterministic-test.cjs`) also passed dynamic occupancy: a ranged hit killed a 1-HP defender, freed its tile, and the battle remained active with a second defender; there were no page/console errors. Evidence: `/workspace/tmp-battle-operator/battle-manual-orders-live-open-tile-deterministic-evidence-307460-yhbsl3/`.
- `npm run typecheck`: passed.

## Remaining follow-up

The 84/side static-occupancy red cases should be rerun with dynamic deaths/routs and exact browser-observed target movements before changing AI formation/pathing. The production Chromium probe used a live production scene and damage pipeline for ranged attack behavior; it did not exercise actual mouse-drawn manual attack orders. No deployment or push was performed.
