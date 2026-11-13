# AutoBot Evaluator — capture RAF sync coalescing

**WERDYKT: PASS-WITH-NOTES**
**Zakres:** niezależna inspekcja report 56’s `refreshMapAfterCityCapture()` RAF coalescing against current source, followed by requested focused tests. Bez zmian produktu.

## Tożsamość

- `gra/src/main.ts`: `39d9198daab6436a7a988f62f4e2d8cd3b6e8faaa8f188a730cea897023ef365`
- `gra/tools/capture-render-sync-test.cjs`: `e72b697f0fcd0f17270d670b8e547087fc61e93f17fd3b47a3f80cb3b040d3dd`
- `gra/tools/map-siege-test.cjs`: `433672bdc3b7f329471238c7fcc9f406c8f05f7c51a9cf2bafc2f8fe4951cc69`
- `gra/tools/flaga-mp-nie-gasnie-test.cjs`: `7bc84788778c11a1e2db02a3e47994ca9bfc9388a361083d73424f72b544ddf8`
- `gra/tools/miasto-zdobycie-raport-test.cjs`: `f6ac6698d5bc98ed44899a05af15ec2d4d8da95d81b08896b9314376df1e4bea`

The `main.ts` and sync test hashes match operator report 56.

## Source review

Every capture still resets reachability/highlight/path/hover, conditionally retains the first applicable `selectedId`, updates `forceVisibleUnitId` and selection hex to the newest non-null lead, syncs the city renderer, calls `refreshFog()`, updates HUDs and siege markers, and applies player city-entry handling. Non-gallery `refreshFog()` performs the per-capture unit projection; gallery mode’s early return is paired with the explicit `if (galleryOn) syncUnitsRender()` so gallery tokens still update. Thus coalescing only removes duplicate deferred cleanup/projections, not per-capture refresh work.

The pending state stores the latest non-null lead ID while a RAF is outstanding. In the callback, pending-frame state is reset before sync, the pending ID is consumed, and `forceVisibleUnitId` is cleared only when it still equals that ID. This prevents an older capture callback from erasing a different force-visible unit established in the meantime. A later capture after the callback sees `framePending === false` and schedules a new RAF. Selection remains on the first applicable lead because later captures do not replace a non-null selection, while force visibility follows the latest lead until cleanup.

## Checks

- `node tools/capture-render-sync-test.cjs`: **23 passed, 0 failed**.
- `node tools/map-siege-test.cjs`: **6 passed, 0 failed**.
- `node tools/flaga-mp-nie-gasnie-test.cjs`: **32 passed, 0 failed**.
- `node tools/miasto-zdobycie-raport-test.cjs`: **117 passed, 0 failed**.
- `npm run typecheck`: **PASS**, exit 0.
- `git diff --check`: **PASS**.

**PASS-WITH-NOTES:** required ordering/state retention, one RAF for synchronous capture batches, rescheduling across frames, per-capture fog/unit refresh, and gallery projection are supported by source and tests. The conditional stale-clear guard is present in source; the extracted-body test checks the matching-ID clear but does not explicitly mutate `forceVisibleUnitId` to a different ID before the pending callback to exercise the mismatch branch dynamically. No behavior defect found.
