# AutoBot Operator — batching siege scan capture refreshes

**VERDICT: safe only after separating model/UI side effects from renderer projection.** A direct “call `refreshMapAfterCityCapture` once after the loop” change is not yet demonstrated safe. A narrowly scoped renderer batching design looks viable because the scan and capture handlers are synchronous, but `refreshFog()` is not a renderer-only operation and must not simply be skipped per capture.

## Source identity

- Workspace: `/workspace/all-topics-candidate`.
- Git HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`.
- `gra/src/main.ts` SHA-256: `a9e9875dfa204f4bdc51b8635d2f36b37444738320647551a85638b778c7742d`.
- Stress harness SHA-256: `75bfa86a42c70ff284c0de99c13731bbb4e0406f5e26f4475a2400698d1bc739`.
- Input operator report: `31-operator-siege-sync-fix.md` (same run directory).
- Raw result: `/tmp/large-empire-direct-siege-56018-3v9cb7.json`, SHA-256 `75e1b04c3b8f123fcfb225cf9cd965c490d4c80269b136e0ab853b66a1b1cdd3`.
- Bundle recorded by raw result: SHA-256 `f2163b5821ee05afdbb4d2e25c4ed52701c74f3fa32e9b4c338111d7bf16741b`.

## Findings

`scanAutoSiegesAfterAiTurn()` (`main.ts:15564`) synchronously iterates the live `cities` array and invokes `executeSilentSiegeStorm()` for assault decisions. Successful defender-backed captures reach `finishSiegeStormBattle()` → `afterSiegeUi()` → `refreshMapAfterCityCapture()` (`:31424–31428`). Captures without defenders instead reach `captureCityWithoutBattle()` → the same refresh (`:31312`). The measured fixture had four of each path; therefore a scan-level batching proposal must cover both, not only the new successful-battle sync optimization. The measured 8 captures spent 15.4 seconds in scan; battle-backed `afterSiegeUi` each cost about 1.62–1.71s. The four empty captures had independent full refreshes as well.

The capture and battle state mutations happen before refresh: owner, population/loot/elimination, army losses and positions are updated synchronously. Later scan decisions read `cities`, `units`, siege flags, and diplomacy/model state; I found no read in the loop that consumes renderer geometry. This supports deferring *projection* until the loop ends. No `await` or browser frame is yielded during the scan. The AI capture hints are emitted synchronously per capture; the toast naturally ends with the last capture's message.

However, `refreshFog()` (`:11472`) also performs stateful work: it marks minimap dirty, updates diplomatic discovery, mutates explored state, reconciles camp/village meshes, checks diplomatic contacts and veteran education, and may emit notices/update journal and HUD state. Therefore coalescing the whole refresh call may change when those notices appear relative to the per-capture siege hint, or even which toast remains at scan end. It also calls `syncUnitsRender()` internally, in addition to the explicit call directly before it in `refreshMapAfterCityCapture()`. This path is intentionally expensive but is not safely removable as a single opaque call based on the current inspection.

`refreshMapAfterCityCapture()` also updates selection/highlight/path/hover state and force-visible selection for each lead, runs `finishUnitEnterCityHex()` for player-owned lead units, and queues a `requestAnimationFrame` callback to clear the force-visible id and sync units. On this AI scan path, captors are non-player owners, so the player city-entry callback does not run. The lead-selection/force-visible and queued-frame behavior still need explicit handling in a batch: one final refresh yields only the last lead's force-visible id and one deferred sync, whereas today each capture queues a callback. Existing `selectedId` semantics are cumulative (first refresh can set it when null; later captures do not replace it), so the batch should preserve that first applicable selection update while using final map state for projection.

Other `refreshMapAfterCityCapture` callers are `applyMapBattleOutcome()` for non-siege captures (`:29849`), `captureCityWithoutBattle()` (`:31312`), and siege `afterSiegeUi()` (`:31427`). Keep any batching mode private to the synchronous `scanAutoSiegesAfterAiTurn()` scope so ordinary player captures, other battles, and siege assaults outside this scan retain immediate refresh behavior. Note `maybeAiAssaultAfterMachines()` also calls `executeSilentSiegeStorm()` outside the scan, so it must stay immediate.

## Recommended safe scope

Use a scan-local refresh accumulator enabled only while `scanAutoSiegesAfterAiTurn()` runs. Capture paths should still perform each capture's model mutations, capture callbacks, UI notice calls, fog/discovery state updates, and selection-state bookkeeping in current order. Accumulate only renderer projection requests, then do one final projection after the city loop using the final model/fog state. This requires separating `refreshFog()`'s model/discovery/notice work from its renderer application; until that split exists, do not skip repeated `refreshFog()` calls wholesale. If that separation is too invasive, leave refreshes immediate: the current optimization already removes a redundant unit sync for successful defender-backed AI captures, and further batching lacks proof.

For projection accumulation, preserve the first `selectedId === null` assignment behavior, final captured lead's `forceVisibleUnitId`/selection hex behavior, and exactly one final animation-frame cleanup/sync. Verify `cityRenderer.sync`, fog visibility application, resource/improvement/settlement overlays, camp/village mesh reconciliation, territory border, minimap dirtying, and unit-token sync all reflect the final state. Ensure the final projection executes in `finally` if the loop exits abnormally after any capture.

## End-to-end test plan

Use an instrumented deterministic fixture equivalent to the raw JSON input (137 cities, 57 units, four empty targets and four defender-backed targets), but do not repeat a browser scan or 100-turn stress for this investigation. For the implementation validation:

1. Compare a baseline run and batched run from identical save/seed. Assert all eight target owners, unit survivors/positions/HP, city ownership and capture-event/report data, active sieges, and diplomacy/exploration state match.
2. Count calls: per-capture model/discovery/notice hooks retain their current count/order; final renderer projection calls (`cityRenderer.sync`, fog visibility/mesh projection, unit render sync) occur once per synchronous scan. Capture resolution and each scan decision must see the same model state as baseline.
3. Assert toast/journal behavior, minimap dirtiness, selection/highlight/route/hover state, force-visible unit cleanup, and one RAF follow-up sync match the intended baseline semantics. Include a first-contact/veteran notice fixture so notice ordering is not hidden by the siege-only case.
4. Exercise a failed assault, defense win, draw, empty capture, no-capture/retreat, and `maybeAiAssaultAfterMachines()` outside the scan to prove the batch is closed and immediate behavior remains. Force an exception after one capture and verify `finally` flushes accumulated projection.
5. Compare user-visible map/fog output after the scan and capture counts/per-capture timings. The expected win should be near one full renderer/fog projection per scan rather than per capture, while the current measured one-scan baseline is 15,445ms for eight captures.

No browser scan, stress run, or product edit was performed for this report.
