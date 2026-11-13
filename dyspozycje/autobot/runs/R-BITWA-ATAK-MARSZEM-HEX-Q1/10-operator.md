# Operator report — Atakuj-marszem

**Branch:** `autobot/battle-attack-move-command-q1`
**Base:** `747ade419e9771f5a94eb1f82f174ceda100eaa1`
**Owner override:** Kanban is waived for this project; work proceeded without a Kanban card or graph.
**Scope:** a distinct manual battlefield attack-move command to an empty ground hex. No merge, push, or deploy.

## Implementation

Added an armed **Atakuj-marszem** control to the selected-unit battle bar. In this mode, an empty-ground click assigns a waypoint order. Enemy clicks still assign exact-target Attack, and ordinary empty-ground clicks still assign move-only Move. Escape disarms the mode and cancels selected attack-move orders; the selected-unit bar also exposes **Anuluj marsz**. Issuing another order replaces the waypoint order.

The route scout runs a grid BFS through passable terrain, respecting the active blockade and allied occupancy. It treats enemy cells as provisional path cells to identify threats on the route, then attacks a threat only when the production `_canStrikeTargetFrom` rules allow it. If the threat is out of range, the unit routes to a legal attack tile. Actual waypoint movement blocks every occupied cell and uses an exact waypoint path, so loaded ranged units do not stop at an incidental firing tile. Dead or routed enemies disappear from threat selection; the order remains until the waypoint is reached or explicitly cancelled.

Selected groups keep the normal move formation offsets. Their orders are issued through the existing serialized per-unit activation queue, which rechecks live occupancy between members. The command is only available in the existing manual-control UI, leaving the player commander gate and automatic-only behavior unchanged.

## Verification

- `node tools/battle-attack-move-order-test.cjs` — PASS. Exercises actual production `BattleScene` order/path methods: kill then resume to waypoint, legal loaded shot, dry ranged approach, routed target, route blocked by an impassable barrier, allied path blocker and off-route target, group offsets and queued dispatch, cancellation/replacement, renderer label contract, and enemy-click/Move separation. A mixed 42-unit group (melee, ranged, mounted) runs through the production immediate activation queue for two successive activations, checking per-unit waypoint retention and occupancy after each serialized move.
- `node tools/battle-manual-orders-routing-test.cjs` — PASS; existing exact-target, blocker, dry-ammo, mounted, and 42-unit group regressions remain green.
- `node tools/battle-manual-choice-contract-test.cjs` — 9/9 PASS; commander/manual-control contract remains green.
- `node tools/battle-ranged-mounted-doctrine-test.cjs` — 9/9 PASS.
- `npm run typecheck` — PASS.
- `npm run build` — PASS; Vite built 917 modules. Output bundle: 70,032,496 bytes, SHA-256 `9e70f1c1e8b94e4fc1ccd0fc29d14e501dbbd38a08b741acfb89ba188368e737`.
- `TMPDIR=/workspace/tmp-battle-operator node tools/battle-attack-move-pointer-test.cjs` — PASS in Chromium using the production BattleScene renderer and real mouse input. It selected a production player unit through the roster, clicked the Atakuj-marszem control and an empty waypoint on the battle canvas, then verified ordinary Move and exact-target Attack with further canvas clicks. All five browser checks passed with no page/console errors. The test instruments the production preset to one unit per side for headless responsiveness and removes only the unrelated world-map loading overlay; JSON evidence is in `01-live-pointer-evidence.json`. Chromium could not save a screenshot within its timeout, so the pointer actions and resulting production orders are captured in JSON instead.
- `git diff --check` — PASS.

The battle order lives in the tactical scene’s existing transient `playerOrder` state; this work does not add persistence across save/load. Queued-order consumption, repeated activations, target death/rout handling, and arrival cleanup are covered in the focused logic test.

## Status

Operator implementation and validation are complete. Ready for independent evaluation and Final Control. No merge, push, or deployment was performed.
