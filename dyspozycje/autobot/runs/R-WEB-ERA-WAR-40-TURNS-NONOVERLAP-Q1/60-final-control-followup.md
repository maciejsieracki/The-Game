# R-WEB-ERA-WAR-40-TURNS-NONOVERLAP-Q1 — final control follow-up

## Verdict

**READY FOR INTEGRATION: YES.** Final control passes candidate `e0dbae712`; the legacy missing-entry bypass is corrected conservatively. The earlier conditional verdict in `50-final-control.md` records the prior candidate and is retained as requested. Save-loader round-trip remains a proof limit, not an integration blocker based on the reviewed call order and focused migration coverage.

## Independent review of the correction

`backfillMissingEraEntryTurns` initializes only missing owner entries for Bronze/Iron owners at the loaded game turn. Restore invokes it for both era maps after restoring owner epochs and after restoring any saved timestamp maps. Player owner 0 is explicitly added using `player.era`; saved AI owner epochs are drawn from `ownerEraByOwner`. `Map.has` preserves known values exactly. Stone and owners still in Stone are omitted.

The both-map initialization also covers a legacy owner currently in Iron with a pending older Bronze trigger: the missing Bronze clock begins at load, so the tagged Bronze eligibility check stays closed through load+39 and opens at load+40. Pending flags are restored and remain unconsumed on an ineligible or overlapping pairing attempt; the existing oldest-tag-first path retains Bronze priority. This resolves the earlier immediate-trigger hole for owners represented in the restored owner-era map.

## Verification

- `node tools/era-war-delays-test.cjs`: **55 passed, 0 failed**. Added cases verify Bronze/Iron-only migration, Stone omission, 39/40 turns from load, and preservation of known timestamps.
- `node tools/era-war-all-eras-test.cjs`: **10 passed, 0 failed**.
- `npm run typecheck`: passed.
- Reviewed the restore call order, both owner-entry maps, player owner 0 inclusion, and existing pending-era selection/consumption path. No source edits were made in final control.

## Limits

The migration test calls the production helper directly; `main.ts` wiring and map restoration order were reviewed, but the DOM-bound full save loader was not executed as a round-trip. The backfill applies to owners available in restored `ownerEraByOwner`, plus player 0. This matches the current forced-war participants; if legacy saves can omit owner-era metadata for an otherwise eligible AI while its era is reconstructed elsewhere, that owner would need to be added to the migration input. No browser/live campaign was run. No staging, commit, push, merge, or deploy was performed by final control.
