# Operator follow-up — full mixed-roster pointer control

**Status: Stage 5/11 — full-roster pointer regression added and passing; ready for independent evaluation.**

## Evidence

- New test: `gra/tools/battle-manual-full-roster-pointer-live-test.cjs`.
- Test builds the current production bundle, opens a generated game in Chromium, opens the production `bitwa_duza_pole` battle, and confirms the real 28-vs-28 mixed roster before any order. The test then retains the full roster.
- Actual Playwright pointer inputs select a friendly unit on the battle canvas, select all 28 player units through the visible production roster chip, shift-click a specific visible enemy, and shift-click a visible empty ground hex.
- The exact clicked enemy ID is written to all 28 selected units' production `playerOrder`; all 28 queued IDs are present. The empty-ground pointer replaces those orders with 28 `move` orders. No browser errors occurred.
- Player-side composition in this live roster was 20 ranged and 8 mounted; overall roster was 28 attackers and 28 defenders, with ranged and mounted units on both sides.
- Test result: **6/6 PASS**, zero page/console errors. JSON and screenshot: `evidence-full-roster/`.
- Run command: `TMPDIR=/workspace/tmp-manual-large-pointer BATTLE_RETURN_MAP_BOOT_MS=90000 node tools/battle-manual-full-roster-pointer-live-test.cjs` from `gra/`.

## Scope boundary

The harness keeps every real production roster member alive and checks real browser pointer routing through the production BattleScene, but uses Shift-click to queue the 28 orders instead of simulating their combat/movement execution. The selected commander gate is disabled through the existing test observer before clicking the production start button; therefore this is evidence for pointer ordering after manual battle is entered, not for authorization to enter manual battle without a commander. No product source was changed.

## Next gate

Independent Evaluator should rerun the full-roster test, inspect exact IDs and order records, and then decide whether the existing production-path order-resolution matrix plus this real-pointer test closes the browser coverage gap. No merge, deploy, or push performed.
