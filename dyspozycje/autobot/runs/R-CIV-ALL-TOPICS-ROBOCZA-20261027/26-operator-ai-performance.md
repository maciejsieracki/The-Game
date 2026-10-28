# AutoBot Operator — AI render batching and large-empire performance

**STATUS: focused validation complete; late-game performance gate remains open**
**BASE:** `99bb834c6fe158d3bc59eb741f8fde9637b77027`
**SCOPE:** review current uncommitted AI city-render/progress batching against existing large-empire profiles; focused tests only. No browser stress run and no product edits.

## Diff identity

The tracked working-tree diff against the stated HEAD has SHA-256 `59dfb671cab6aaeb0fdccc233345c35568e218d151ffffda86b8377a7db65b8d` (`git diff --binary | sha256sum`). The checkout also contains untracked files, so this digest identifies the tracked diff only. The current tree is a broad mixed change set (73 status entries), not an isolated performance patch; review the working tree at this HEAD before attributing outcomes to these render changes.

Relevant untracked implementation/test file identities:

- `gra/src/game/dirtyRenderSync.ts`: `3b925234224d0e007caacec3716920b588935a6c46407b19a8a199b7ba00d670`
- `gra/src/ui/aiOwnerProgressFrame.ts`: `87c6941de4324eaca800e6933e7800f8a7f88fc9658068e68dd24da9c1df294d`
- `gra/tools/ai-city-render-batch-test.cjs`: `112045e77d6e09c1bc13d35f71f8b847f666a563527714537c43502c6b5fe710`
- `gra/tools/ai-owner-progress-frame-test.cjs`: `397c3e5475606bd0c63aedcbaccf0fad9caab9e49f782e4d4c265b979cdbeee6`

## Focused validation

- `node tools/ai-city-render-batch-test.cjs`: **17 assertions passed**. It checks dirty batching, retry after renderer failure, flush before owner-progress paint and battle handoff, and flush after AI completion/error.
- `node tools/ai-owner-progress-frame-test.cjs`: **13 assertions passed**. It checks first/every-third/last owner cadence, resumed loops, and that all owner progress state and AI work remain in the loop.
- `node tools/forced-war-reguly-multi-turn-simulation-test.cjs`: **50/50 passed** (adjacent AI/capture gating regression coverage).

These are helper and source-contract checks. They do not measure the late-game turn or demonstrate a visible-frame or EOT improvement.

## What the existing evidence says

The current batching changes are plausible and correctly bounded in source: AI-founded cities mark the renderer dirty instead of synchronizing for every founding; the batch is flushed before a selected progress-frame yield, battle handoff, and AI-phase exit. Owner progress still updates on every owner, while awaited paints are limited to the first, every third, and final owner (with cadence restarting on resume).

Historical evidence supports coalesced owner paints as a useful improvement, but not a resolution: a controlled short A/B previously measured 20.447 s mean with every-owner yields versus 17.431 s with coalesced yields, about 3.016 s or 14.8% per tested turn. It used four turns per mode, so the estimate is noisy and does not establish the effect at turn 40. The uncommitted city batching has no corresponding late-game A/B measurement.

The confirmed large-empire failure remains the turn 39→40 breach: 69.796 s engine phase / 77.678 s wall in the watchdog run (a separate earlier profile recorded 76.059 s measured). The phase report shows `runAiPhase` at 37.545 s and `scanAutoSiegesAfterAiTurn` at 30.734 s on that turn; these are nested/overlapping measurements and must not be added. Owner UI-yield overhead and AI diplomacy also accumulated substantially over the run. The city-render batching change targets founding-time syncs and progress paints, but does not establish that either explains most of that turn's time.

Most actionable measured hotspot: automatic siege consequences. A separate controlled direct scan over the same 137-city fixture took 18.270 s for eight forced assaults/captures; detection and stance selection were under 2 ms total, while the eight `executeSilentSiegeStorm` calls accounted for 18.265 s. For defended captures, `applyMapBattleOutcome` did a unit render sync averaging 409 ms, then the synchronous capture refresh immediately did another averaging 391 ms, plus city sync around 385 ms and fog refresh around 707 ms. There is no frame yield between these syncs. This makes the duplicate unit sync after a successful defended AI capture a concrete, narrow optimization candidate. It has not been changed in the current diff, and this synthetic scan does not quantify the natural t39→40 share. Empty captures also cost about 2.17 s apiece and do not use that defended-battle path.

The 14.954 s not attributed by the historical turn-40 top-level phase timers remains unexplained. Do not assign it to rendering or autosave based on the available profile. The recorded autosave completion timer overlaps the turn and is asynchronous; synchronous snapshot construction plus serialization measured only about 46 ms in the corrected early-turn fixture. There is no evidence here to change autosave cadence.

## Next actionable step

Keep the performance gate open. The most evidence-backed next optimization investigation is to avoid the first `syncUnitsRender()` only after a **successful capture in the silent AI siege path**, allowing the immediately following `refreshMapAfterCityCapture()` to provide the final sync. Preserve the shared/default battle behavior for all other cases. Add focused coverage for successful capture and negative cases (no capture, loss/draw, field battle, player siege), then measure the same direct-scan fixture before/after. This targets a measured ~0.4 s per defended capture; it cannot by itself clear a >60 s large-empire turn. A late-game saved-state EOT profile is still needed to validate the current batching and investigate the remaining AI/diplomacy and unaccounted phase time.

No autosave cadence change is supported by these measurements. No browser stress, build, deploy, merge, or push was performed for this operator task.
