# Operator audit: army, Generals, recruitment

Scope: independent read-only validation of current uncommitted army, General, and recruit mechanics in `/workspace/all-topics-candidate`. No product or test files were edited by this audit. No deployment or push performed.

## Diff identity

- HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027` (`integration/robocza-all-topics-20261027`)
- Tracked worktree patch fingerprint: SHA-256 of `git diff HEAD --binary`: `59dfb671cab6aaeb0fdccc233345c35568e218d151ffffda86b8377a7db65b8d`
- The above fingerprint includes all tracked uncommitted changes in the shared worktree, not just this audit's scope. New untracked files are excluded by `git diff`; relevant additions observed were `gra/src/game/generals.ts`, `gra/src/game/ai-era-unit-promotion.ts`, and their focused test files.

## Findings

No blocking defect found in the inspected mechanics.

General recruitment is wired through the CityPanel and Empire/Army recruitment mount. The offer is capital-only, selects the strongest currently purchasable capital unit as the General's base form, limits quantity to one, and displays alive/queued counts. The transaction revalidates capital, requested offer identity/cost, quantity, and era slot limit before charging or queueing. Queued Generals reserve a slot. The runtime browser test confirms non-capital and over-limit requests fail without queue/resource mutation; valid purchase deducts quoted gold, manpower, and stock, queues one General, and the end-turn recruitment pipeline spawns it with the General marker.

New player recruits follow the live-position General through a regular planned march carrying `generalTargetId`. The destination is synchronized as the General moves; serialization preserves the target across saves, including a follower at stale stored coordinates. Missing/invalid leaders clear the order. Following is skipped for garrisoned or besieging units. The hook currently applies only to the human player's post-spawn path (owner `0`), consistent with the inspected UI/runtime scenario; AI recruits do not receive this follow order.

The General limit is `max(1, floor(era))`, so it starts at one and increments once per numeric era. Alive and queued totals both consume slots. This assumes era values are consecutive positive integers; malformed, fractional, or non-finite values collapse to at least one. Existing Generals are converted to the strongest currently available unit form on the player's era transition while preserving health percentage and movement bounds. The inspected call is tied to era advancement; a tech unlock within an era does not itself trigger form synchronization.

AI peace-time rally now targets only the capital rally hex with capacity sized to the candidate roster plus current occupancy. Units that have arrived are deferred from ordinary patrol/exploration during that turn. Existing army consolidation test covers the revised behavior. AI era promotion delegates to a helper, limits promotion to an eligible later-era same-role replacement, charges only a positive price difference, preserves health percentage, ends movement, and marks replacement used for the turn. A test confirms the fresh-owner-turn call is guarded against command resume duplication.

Recruitment UI changes mount the shared city recruitment cards under each city in the Empire/Army panel and append the capital General card there. Army merge panel changes widen the layout, use a responsive grid for unit rows, and move actions above the scroll body. Existing consolidation E2E check passed; this audit did not run a visual/manual viewport review of merge or mass-recruitment panels.

Unit metadata moves “Rydwan (woły)” to Stone/Wheel availability and changes its recruitment and upkeep resource from bronze to wood. The focused promotion test verifies that metadata and upkeep resolver agree.

## Checks run

- `npm run typecheck` in `gra`: passed (`tsc --noEmit`).
- `node tools/generals-purchase-runtime-test.cjs`: passed, 9 checks. Exercises actual browser runtime purchase, transaction rejection, spawn, and follow-order behavior.
- `node tools/ai-era-unit-promotion-test.cjs`: passed, 12 checks.
- `node tools/army-consolidation-e2e-test.cjs`: passed, 6 checks.

## Limits

These checks cover focused runtime paths and the existing consolidation harness; they do not constitute a full playthrough, broad save compatibility audit, or visual review across viewport sizes. The General sync-on-era behavior and human-only follow behavior above are observations about current wiring, not failures demonstrated by these checks.
