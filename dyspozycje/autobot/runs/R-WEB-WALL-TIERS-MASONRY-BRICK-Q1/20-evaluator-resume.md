# Independent evaluator — masonry and brick wall tiers

**STATUS: FAIL — one concrete progression blocker remains.** The defense tiers, legacy ID preservation, costs, battle rendering, cards, and documentation match the request. The player and AI production catalog still offers the weaker stone wall after a city already has brick walls.

## Finding

`mury_kamienne` has no `upgradeFrom` relationship, and both `availableProduction()` and `eraBuildingCatalog()` only suppress the palisade when a stronger wall exists. With a current epoch of 2, Murarstwo and Budownictwo unlocked, and `builtBuildingIds: ['mury']`, I called the actual `buildableProduction()` function: it returned `mury_kamienne` as buildable. After brick walls are built, the game therefore allows a second, weaker wall to be queued. `applyCompletedBuildingIds()` also leaves `mury` in place if stone is completed afterward, so both tiers can persist in the city state.

Relevant locations: [production.ts](/tmp/walls-resume/gra/src/game/production.ts:975) and [production.ts](/tmp/walls-resume/gra/src/game/production.ts:2484) only block palisade; [production.ts](/tmp/walls-resume/gra/src/game/production.ts:834) removes lower tiers when brick completes, but has no inverse guard. The AI uses the same production availability callback, so it can also choose the weaker wall after brick. Add a shared stronger-wall suppression for `mury_kamienne` and cover both the player catalog and AI selection before resubmitting.

## Verified

- `npm run typecheck` passed.
- `prereq-budynkow-test.cjs` passed 62/62; `upgrade-budynki-test.cjs` passed 54/54; `palisade-battle-wall-rules-test.cjs` passed 55/55.
- `building-cards-top5-test.cjs --screens /tmp/walls-eval-cards` passed 1207/1207 using `/usr/bin/chromium`; I visually reviewed the stone wall card.
- `wall-defenders-bonus-range-test.cjs` completed its Chromium live scenes and mutations. It measured Palisade 100%, stone 150%, brick 200%; confirmed stone stays gray, brick uses the red material, and palisade stays wood. No shared material recoloring appeared.
- A direct `serializeGame()` → `deserializeGame()` round trip preserved the legacy `cityBuilt` IDs `['mury', 'fort', 'baszta']` unchanged.
- Building and technology card generators passed `--check`; wiki bundle generation to a temporary file matched the checked-in bundle. `git diff --check` passed.
- No unrelated building/research costs changed. The stone wall uses the existing brick wall cost and maintenance values; the legacy `mury` record and its +200% tier remain intact.

The live battle run and save serialization checks pass, but the downgrade path means this candidate is not ready for Final Control.
