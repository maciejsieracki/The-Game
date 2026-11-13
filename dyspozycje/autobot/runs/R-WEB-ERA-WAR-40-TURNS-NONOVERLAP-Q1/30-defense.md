# Defense — R-WEB-ERA-WAR-40-TURNS-NONOVERLAP-Q1

Status: compatibility correction implemented and committed as a local candidate. No push, merge, deploy, or publication.

## Compatibility policy

A legacy save with no Bronze/Iron entry timestamp does not contain enough information to recover the actual historical entry turn. On restore, owners already in Bronze or Iron receive the current saved game turn as their missing entry timestamp. Their 40-turn clock therefore starts at load, preventing an immediate forced era war while avoiding a fabricated historical date. Existing saved timestamps are preserved exactly. The initialized maps use the existing save metadata path, so subsequent saves retain this conservative clock. Pending era-war flags remain restored and unconsumed while the threshold or non-overlap gate blocks a declaration.

The backfill applies to AI owners whose era is restored in `ownerEraByOwner` and to player owner 0 from `player.era`. Stone uses its existing game-start clock. Owners in Stone receive no Bronze/Iron timestamp.

## Allowlist and scope

Changed only `gra/src/game/war-rules-multiwar.ts` for the pure missing-entry migration helper, `gra/src/main.ts` for restore-time invocation, and `gra/tools/era-war-delays-test.cjs` for focused coverage. Core threshold values, ordinary war handling, queue selection, and active era-war exclusion are unchanged.

## Evidence

- Legacy empty maps backfill only current Bronze/Iron owners at load turn 219; Stone is omitted.
- Legacy owner remains blocked at load+39 and opens at load+40.
- Existing saved owner entries 180 and 190 remain unchanged during backfill at turn 219.
- `node tools/era-war-delays-test.cjs`: 55 passed, 0 failed, including existing 39/40 and forced-war non-overlap/queue coverage.
- `node tools/era-war-all-eras-test.cjs`: 10 passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check`: passed.

## Proof limits

The restore call is connected in `main.ts`; its owner/turn inputs and save metadata path were reviewed. The focused test exercises the migration helper and elapsed-time gate; it does not instantiate the DOM-bound full game restore or perform a browser campaign round trip.
