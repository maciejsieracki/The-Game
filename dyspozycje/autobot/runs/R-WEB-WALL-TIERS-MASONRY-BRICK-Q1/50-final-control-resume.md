# Final Control — masonry and brick wall tiers

**STATUS: PASS — candidate `5a2ac1766` is ready for parent review.** No product edits, merge, or deploy were made during Final Control.

## Independent source review

- Compared candidate `5a2ac1766` with requested base `638e90bea`. The candidate contains the wall tier work plus the evaluator-driven progression correction. The correction is limited to `production.ts`, its regression test, and the operator receipt.
- `palisada` remains the 100% tier, `mury_kamienne` is the 150% Murarstwo tier, and legacy ID `mury` remains the 200% Budownictwo brick tier. `cityWallDefenseBonusPercent()` selects the highest wall bonus; Baszta and Citadel bonuses remain additive.
- Stone and brick use the existing wall construction cost and maintenance template. Stone replaces palisade; brick replaces stone or palisade. Completion guards prevent stale lower-tier queue items from downgrading or coexisting with a higher tier and preserve `fort`/`baszta` IDs.
- `isWallTierBlockedByStrongerWall()` is applied in both `availableProduction()` and `eraBuildingCatalog()`. `buildableProduction()` shares the production selector used by AI. Built or queued brick therefore suppresses stone from player and AI selection. The prior evaluator reproduced the original fixture through the actual selectors and `chooseCityProduction()` and confirmed no downgrade candidate.
- The building records, canonical building/research CSV inputs, card generator outputs, handbook, encyclopedia Wiki-S/Wiki-M sources, and generated wiki bundle identify the stone and brick tiers with their correct unlocks and bonuses. The existing `mury` save identity is retained. A real serializer round trip preserved legacy `['mury', 'fort', 'baszta']` state.
- Renderer source uses the existing stone geometry with brick-red material only for a city whose built ID is `mury`; stone stays gray and palisade stays wood. The dedicated brick model is recorded as future work. Earlier independent live Chromium screenshots and deliberate material/mutation checks passed.

## Focused verification

- `node tools/upgrade-budynki-test.cjs` — 61 passed, 0 failed.
- `node tools/auto-manage-test.cjs` — 45 passed, 0 failed.
- `npm run typecheck` — passed.
- The independent evaluator’s focused progression, prereq, defense, save serialization, Chromium render/mutation, generator, and diff checks are recorded in `40-followup-evaluator.md`; all passed. The previous live Chromium and actual-save evidence remains applicable because the follow-up changed only progression selection/completion logic.

No Final Control blocker remains. Parent review is the next gate.
