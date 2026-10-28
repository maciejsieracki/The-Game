# AutoBot Operator — coalesce deferred unit syncs after synchronous captures

**Result:** implemented the narrow follow-up from report 55. No changes to capture resolution, fog/discovery, city rendering, diplomacy, notices, siege decisions, or per-capture model updates. No 100-turn run, push, or deploy.

## Change

`refreshMapAfterCityCapture()` now tracks whether its cleanup/projection RAF is already pending. More captures before that frame update the pending lead ID rather than enqueueing more callbacks. The one callback clears `forceVisibleUnitId` only if it still matches the latest pending lead, resets the pending state, and performs one final `syncUnitsRender()`. A capture after the callback executes creates a new RAF. The per-capture `refreshFog()` call and its existing unit sync remain unchanged; gallery mode retains its explicit sync because fog refresh returns early.

For an eight-capture synchronous batch, the source-path test verifies eight per-capture fog refreshes/unit projections, one deferred callback, and one deferred final projection. It also verifies selection still follows the first applicable lead, force-visible follows the latest lead until cleanup, and captures after a completed frame schedule a distinct callback.

## Validation

- `node tools/capture-render-sync-test.cjs`: **23 passed, 0 failed**.
- `node tools/map-siege-test.cjs`: **6 passed, 0 failed**.
- `node tools/flaga-mp-nie-gasnie-test.cjs`: **32 passed, 0 failed**.
- `node tools/miasto-zdobycie-raport-test.cjs`: **117 passed, 0 failed**.
- `npm run typecheck`: passed.
- `git diff --check`: passed.
- No EOT replay was run; the extracted-body test verifies the callback boundary directly. No elapsed-time improvement is claimed. The 100-turn/late-game 60-second performance gate remains open.

## Identity at report time

- HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`.
- Shared `gra/src/main.ts` SHA-256: `39d9198daab6436a7a988f62f4e2d8cd3b6e8faaa8f188a730cea897023ef365`.
- `gra/tools/capture-render-sync-test.cjs` SHA-256: `e72b697f0fcd0f17270d670b8e547087fc61e93f17fd3b47a3f80cb3b040d3dd`.
- Shared `gra/src/main.ts` binary diff against HEAD SHA-256: `4881a97511fcc9c3e431646334a70f026089618d5857e32ea45a05b3e81fc2e2`.

`main.ts` includes shared changes by other operators; these hashes identify the combined working-tree state at report time.
