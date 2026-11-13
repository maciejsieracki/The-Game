# AutoBot Operator — battle, leadership, merge UI closeout

**Result: PASS for current non-performance battle scope.** No product changes were needed in this round. The user's clarification that Wódz and Generał share the same rout/death/battle rules is already represented by the shared `isArmyCommander` combat flag and owner-dependent title; the rules do not branch on title.

## Current source identity

- `gra/src/battle/battleScene.ts`: SHA-256 `0ba23c48bcd1088d84246ccce60d7cc11d52799a4e6b133f1a0f69b5adde7a04`
- `gra/src/game/army-leadership.ts`: `c59548336c4d21c0552cb5da90737c1463520699544929937b161a4a69df813b`
- `gra/src/main.ts`: `39d9198daab6436a7a988f62f4e2d8cd3b6e8faaa8f188a730cea897023ef365`
- `gra/tools/battle-large-return-live-test.cjs`: `d262cb7d903ae38e68ab344bd22fc2bacf98035fcfa28f2ac892a29ed691a2b5`
- Built production bundle: SHA-256 `d2866c368ae7edc6e45f1d382f2ece6e0475e54cbb152abb95c2bcd1d48eaaf1`, 70,011,834 bytes.

## Checks performed

- `node tools/army-leadership-test.cjs` — PASS: title selection, +10% Wódz / +20% Generał army morale, commander excluded from aggregate rout, commander withdrawal when ordinary troops break, commander-only defeat.
- `node tools/pre-battle-defender-retreat-test.cjs` — PASS: manual mode is commander-gated; Auto remains available.
- `node tools/battle-formation-rules-test.cjs` — PASS: fighting line and cavalry wings, Attack pacing, Charge behavior, ranged fire on range entry.
- `node tools/army-merge-panel-scroll-real-render-test.cjs` — **21/21 PASS** in real Chromium: 150%-relevant narrow viewport contract, scrollable list, fixed visible CTA, three-column grid, 40-unit roster, merge/separate clicks, no horizontal overflow/errors.
- `timeout 210s env BATTLE_RETURN_MAP_BOOT_MS=90000 node tools/battle-large-return-live-test.cjs` — PASS: generated the playtest world, opened a production 28v28 battle, ran to result, used the return action, confirmed the battle canvas disconnected while the map canvas remained connected, map frames advanced and wheel input worked; no page/console errors. The map generation was slow (~77 seconds to ready) but continued to report progress.
- `npm run typecheck` had passed in the preceding independent battle evaluator on the same `battleScene.ts`/leadership source hashes; `git diff --check` passed in that review.

Evidence retained under `evidence/battle-return-latest/`: post-return screenshot and state JSON. Screenshot SHA-256: `da487bd487e107d4d74af349593fa0cea1f50f2471512ee9ba30c0ccb6b1b029`.

## Limits

This closes the bounded rendered-battle-return and 150% merge-panel checks. The 28v28 run uses a synthetic map preset and software WebGL; it does not reproduce the exact long campaign save that previously showed a white screen or test every GPU/driver. The separate 100-turn large-empire performance gate is explicitly out of scope for this report. No commit, merge, push, or deploy was performed.
