# R-BITWA-ATAK-MARSZEM-HEX-Q1 — Evaluator r2

**Reviewed commit:** `efe9ab1ea6dadc917185c372a958c82ed21a7dda`  
**Verdict: PASS-WITH-NOTES.** Operator Defense resolves the two prior evidence notes within the agreed scope. No blocking correctness issue was found in the added 42-unit mixed-group progression regression or the save/load boundary. Ready for Final Control; no product files were edited by this evaluator.

## Independent review of Defense

- Reviewed the Defense diff and the test `gra/tools/battle-attack-move-order-test.cjs` directly.
- The 42-unit fixture is mixed (melee, ranged, mounted), calls the production `_issueBattleAttackMove`, `_executeUnitsImmediate`, and `_performPlayerOrder` methods, and tests two successive activation batches. It asserts that all units preserve their individual offset waypoint, advance once per activation, and that the occupancy map prevents collisions as the serialized queue updates it.
- The fixture stubs lower-level movement/combat and uses deterministic open lanes with an off-route enemy. Thus it verifies group order dispatch, queue progression, waypoint retention, and occupancy sequencing; it does not simulate 42 fully animated units or mixed combat in Chromium. This is a bounded test, not full mixed-roster gameplay acceptance.
- The save/load note is a valid scope boundary: `SaveGame` stores campaign map units/cities, and `buildSaveGameSnapshot()` serializes campaign state. Active tactical `RuntimeBattleUnit.playerOrder` belongs to `BattleScene`; the current save flow does not serialize or reconstruct an active tactical encounter. Persisting the waypoint alone would not round-trip the full battle. The request is therefore fulfilled for tactical activations, with no promise of active-battle save/load.

## Rerun results

- `node tools/battle-attack-move-order-test.cjs` — PASS. The two-batch mixed 42-unit checks passed (`moves=42`, then `moves=84`; zero blocked occupancy attempts; all individual attack-move waypoints retained).
- `npm run typecheck` — PASS (`tsc --noEmit`, exit 0).
- `git diff --check 747ade419e9771f5a94eb1f82f174ceda100eaa1..efe9ab1e` — PASS.

## Remaining notes

1. The large mixed-group activation regression is production-method coverage with deterministic movement/combat adapters, not a full 42-unit pointer-driven Chromium battle. The existing browser evidence remains a reduced 1v1 interaction test. Final Control should retain this boundary in its acceptance record.
2. Tactical battle progress/orders are not persisted across campaign save/load because active tactical encounters are outside the existing save format. The attack-move order does persist across activations within the tactical scene, as checked by the two-batch test.

No Operator Defense objection remains open. No merge, deployment, or push was performed.
