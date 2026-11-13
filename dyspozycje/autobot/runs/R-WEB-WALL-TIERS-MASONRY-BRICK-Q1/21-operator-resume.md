# Operator resume — masonry progression blocker

STATUS: PASS — evaluator finding fixed; candidate ready for re-evaluation
ID: R-WEB-WALL-TIERS-MASONRY-BRICK-Q1
BRANCH: `codex/walls-resume`
BASE: `6cea090f5`

## Finding and correction

The independent evaluator showed that a city with the legacy `mury` brick ID could still be offered `mury_kamienne`; a delayed stone completion could also leave both IDs built. Added one shared weaker-tier suppression used by `availableProduction` and `eraBuildingCatalog`. A completed or queued brick tier (and a completed or queued Citadel) now hides stone; a queued stronger wall also suppresses the palisade. `buildableProduction`, used by the AI auto-builder as well as player-facing build selection, inherits the same rule.

`applyCompletedBuildingIds` now protects the highest tier at completion: delayed stone or palisade queue items cannot downgrade or coexist with brick, and a delayed palisade cannot coexist with stone. Citadel and Baszta IDs are retained. Existing `mury` IDs remain unchanged for old saves.

## Verification

- `node tools/upgrade-budynki-test.cjs` — 61 passed, 0 failed. Covers actual `availableProduction`, `buildableProduction`, `eraBuildingCatalog`, queued/buildable state, stale completion guards, additive Citadel/Baszta retention, and legacy ID preservation.
- `node tools/auto-manage-test.cjs` — 45 passed, 0 failed. AI auto-management continues to consume the shared `buildableProduction` selector.
- `node tools/prereq-budynkow-test.cjs` — 62 passed, 0 failed.
- `node tools/palisade-battle-wall-rules-test.cjs` — 55 passed, 0 failed.
- `npx tsc --noEmit` — pass.
- `git diff --check` — pass.

Only `production.ts` and its wall progression regression test changed for this correction. No balances, card data, renderer, or unrelated systems changed. Candidate is pushed to `codex/walls-resume`; re-evaluation is the next gate.
