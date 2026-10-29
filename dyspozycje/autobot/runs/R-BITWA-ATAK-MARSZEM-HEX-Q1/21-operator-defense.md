# Operator Defense — R-BITWA-ATAK-MARSZEM-HEX-Q1

**Stage 7 disposition:** both Evaluator notes are accepted as evidence limits and do not identify an unimplemented product requirement. I added a stronger production-method group progression regression. No broader save/load feature or full-roster pointer harness was added.

## 1. Large mixed army is not driven by Chromium pointer

The browser scenario deliberately uses one production unit per side to keep Chromium responsive. It still runs the real `BattleScene` renderer and manual UI, and sends real mouse input to select a player unit, arm **Atakuj-marszem**, click a ground waypoint, issue ordinary Move, and click an exact enemy target.

Group support is separately tested through production order and activation methods, where the group behavior lives. `battle-attack-move-order-test.cjs` now builds a 42-member mixed group with melee, ranged, and mounted units, issues one shared attack-move through `_issueBattleAttackMove`, then runs two successive batches through the real `_executeUnitsImmediate` and `_performPlayerOrder` methods. It confirms each member advances once per activation, keeps its formation-specific waypoint, and avoids collisions as occupancy updates. The existing 42-unit manual routing regression independently exercises blocker/terrain routing and exact-target preservation.

The browser and group logic tests cover different boundaries: pointer wiring and rendered controls in Chromium, then large-roster path/order/turn progression through production methods. A full 42-unit pointer run would add a WebGL performance stress condition without changing the pointer dispatch code exercised by the 1v1 run. This remains a validation limitation, not a missing group-order behavior.

## 2. Tactical battle order is not persisted in campaign save/load

The current save format stores campaign state. `SaveGame` has world-map `RuntimeUnit[]` and `City[]` fields in `gra/src/game/save.ts:349`, while tactical orders belong to `RuntimeBattleUnit.playerOrder` in `gra/src/battle/battleScene.ts:1965`. `buildSaveGameSnapshot()` serializes campaign units and cities, but has no `BattleScene`, tactical roster, or tactical-order snapshot (`gra/src/main.ts:32208`). The manual save/load flow operates on that campaign snapshot. The tactical scene is tracked as a separate modal scene, and surrounding map/turn flows explicitly suspend or defer work while it is open (`gra/src/main.ts:32808`, `gra/src/main.ts:33101`).

There is no supported in-battle save/load operation for this command to round-trip through. Extending the format to save and reconstruct an active tactical encounter would require persisting the full battle scene state, not just one waypoint order, and exceeds this request's field-order scope. Attack-move instead remains in the battle scene across its tactical activations, then ends on arrival or cancellation. The new 42-unit regression proves two consecutive activations preserve the waypoint; the focused single-unit test proves the waypoint clears on arrival after the threat is killed. Campaign save/load remains unchanged and takes place around the resolved battle outcome.

## Defense verification

- `node gra/tools/battle-attack-move-order-test.cjs` — PASS, including the 42-unit mixed group across two real activation batches.
- `node gra/tools/battle-manual-orders-routing-test.cjs` — PASS, including 42-unit blocker/terrain route coverage.
- `node gra/tools/battle-manual-choice-contract-test.cjs` — 9/9 PASS.
- `node gra/tools/battle-ranged-mounted-doctrine-test.cjs` — 9/9 PASS.
- `npm run typecheck` — PASS.
- `npm run build` — PASS, 917 Vite modules.
- Chromium real pointer scenario — PASS; 1v1 instrumented production battle, four order semantics checked, zero page/console errors. Evidence: `01-live-pointer-evidence.json`.

No merge, push, or deploy was performed. The changes remain ready for Final Control.
