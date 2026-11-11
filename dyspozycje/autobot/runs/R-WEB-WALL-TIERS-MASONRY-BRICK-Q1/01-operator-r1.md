# Operator receipt — masonry and brick wall tiers

STATUS: PASS — candidate ready for review; no merge or deploy
DOMAIN: GAME
ID: R-WEB-WALL-TIERS-MASONRY-BRICK-Q1
OPERATOR: Codex, delegated walls_resume
BASE: `638e90bea` (`codex/walls-resume`, isolated worktree)

## Completed stages

1. Read `README.md`, `docs/decyzje/R-PROC-AUTOBOT.md`, and the registered dispatch; applied the latest owner correction: Palisade +100%, stone +150% after Murarstwo, brick +200% after Budownictwo.
2. Kept the original `mury` ID for save compatibility and renamed it visibly to `Mury ceglane`; added `mury_kamienne`. No save migration is needed for existing `mury` saves. The building-completion test confirms the legacy ID remains intact; save/load stores the unchanged built-building IDs. No full interactive save/load cycle was run.
3. Reused the actual `mury` cost/maintenance template for stone, with no new balancing values. Completing stone replaces palisade; completing brick replaces palisade/stone while preserving independent Citadel and Baszta.
4. Centralized fortification tier selection on the highest tier only, while Citadel and Baszta remain additive. Tactical siege and AUTO city defense use the shared calculation.
5. Rendered brick with the existing stone geometry and a muted brick-red material (`#8b3a2a`) only when the actual built city ID is `mury`. Stone geometry/material and wood palisade remain unchanged. Dedicated brick geometry is recorded as future work in source.
6. Updated canonical building/research card inputs and their generators, Civpedia wikiS/wikiM sources and generated bundle, and the player handbook. User-facing cards distinguish “Mury kamienne” and “Mury ceglane”.
7. Added regression coverage for tier unlocks, build replacement, legacy ID retention, defense totals, and renderer wiring.
8. Captured and visually reviewed live Chromium battle screenshots for all three wall materials and rendered cards for both new tiers; artifacts are in this run's `evidence/` folder.
9. Ran TypeScript typecheck, card/wiki generator checks, and focused defense/progression/card suites.
10. Ran the actual Chromium tactical/AUTO live-render test plus its inside-wall, skip-parity, and range mutations; all mutations were detected.
11. `git diff --check` passed. Candidate is committed and pushed only to `codex/walls-resume`; no merge or deploy was performed.

## Verification

- `npx tsc --noEmit` — pass.
- `node tools/palisade-battle-wall-rules-test.cjs` — 55 passed, 0 failed.
- `node tools/city-wall-towers-test.cjs` — 59 passed, 0 failed.
- `node tools/upgrade-budynki-test.cjs` — 54 passed, 0 failed.
- `node tools/prereq-budynkow-test.cjs` — 62 passed, 0 failed.
- Building card generator `--check`, technology card generator `--check`, and wiki bundle regeneration — pass.
- `BUILD_CARDS_CHROME=/usr/bin/chromium node tools/building-cards-top5-test.cjs --screens ...` — 1207 passed, 0 failed.
- `WDBR_CHROME=/usr/bin/chromium node tools/wall-defenders-bonus-range-test.cjs` — 81 passed, 0 failed. Actual live scene measured palisade 100%, stone 150%, brick 200%; tier material checks and tactical/AUTO parity passed. All three deliberate live mutations were detected.
- Screenshot artifacts: `evidence/wood-palisade.jpg`, `evidence/stone-wall.jpg`, `evidence/brick-wall.jpg`, `evidence/mury_kamienne.png`, `evidence/mury.png` (each under 1 MB).

## Allowlist and remaining gates

Changes are limited to wall/building data and tech, defense/building consumers, siege renderer, wall-related regression tests, canonical card/wiki sources and generated outputs, handbook, this receipt, and direct visual evidence. No unrelated war/siege mechanics were changed. No blockers remain for parent evaluation. Parent review/merge is the next gate; the candidate remains isolated.
