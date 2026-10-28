# AutoBot Evaluator — AI city render batching and owner progress frames

**STATUS: PASS-WITH-NOTES**
**BASE:** `99bb834c6fe158d3bc59eb741f8fde9637b77027`
**SCOPE:** independent focused review of city-render batching and reduced owner-progress paints. No product edits and no full stress run.

## Current source identity

The current checkout is still at HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`. The working tree has changed since the operator report: `git diff --binary | sha256sum` is now `1305fef5a691276c3202ba5c7d3880dcf389f2a977075855919707f69a9f78c4`, with 81 `git status --short` entries. This remains a broad mixed change set, so the following focused findings do not validate or attribute the rest of the tree.

Focused file hashes match the operator report:

- `gra/src/game/dirtyRenderSync.ts`: `3b925234224d0e007caacec3716920b588935a6c46407b19a8a199b7ba00d670`
- `gra/src/ui/aiOwnerProgressFrame.ts`: `87c6941de4324eaca800e6933e7800f8a7f88fc9658068e68dd24da9c1df294d`
- `gra/tools/ai-city-render-batch-test.cjs`: `112045e77d6e09c1bc13d35f71f8b847f666a563527714537c43502c6b5fe710`
- `gra/tools/ai-owner-progress-frame-test.cjs`: `397c3e5475606bd0c63aedcbaccf0fad9caab9e49f782e4d4c265b979cdbeee6`

`gra/src/main.ts` currently hashes to `a9e9875dfa204f4bdc51b8635d2f36b37444738320647551a85638b778c7742d`; this is a tracked file in the mixed diff, so its hash is recorded for review identity, not as an isolated patch hash.

## Focused checks

From `gra/`, reran:

- `node tools/ai-city-render-batch-test.cjs` — **PASS**, output: `ai-city-render-batch: 17 assertions passed`.
- `node tools/ai-owner-progress-frame-test.cjs` — **PASS**, output: `ai-owner-progress-frame: 13 assertions passed`.

The tests transpile and execute the production helpers. They also inspect `main.ts` source contracts; they do not run a browser or measure frame time.

## Boundary and error-path review

AI city founding completes domain initialization, adds the city, and marks the batch dirty without calling `cityRenderer.sync()` per city. The `createDirtyRenderSync` helper does nothing when clean, coalesces repeated marks into one sync, and clears the dirty bit only after a successful sync. If the supplied sync throws, the dirty bit stays set, allowing a later boundary to retry.

The integration flushes before each selected owner progress paint, before handing a human battle to the battle UI, and after the AI phase returns or throws, before the barbarian transition. The progress helper selects the first owner from `startIndex`, every third owner thereafter, and always the final owner; it rejects empty/out-of-range starts and indices. The main loop still calls `setTurnTransition` for each owner before the optional yield, and existing awaited AI and battle-resume control remains in place.

One limitation remains in the renderer-failure path: `flushAiCityRenderBatch()` catches and logs a sync error, so the current UI boundary proceeds even though the batch remains dirty. A later boundary can retry, but if retries keep failing, a progress or barbarian paint can happen with stale city renderer models. The tests verify helper retry semantics and source placement, but do not exercise a persistent failing renderer through the integrated loop. This is an explicit error-tolerance tradeoff, not evidence of a normal-path failure.

## Separate whole-game gate

The operator report's whole-game performance gate remains **OPEN**. It records a confirmed turn 39→40 breach above 60 seconds (69.796 s engine phase / 77.678 s wall) and lacks a late-game A/B showing that these focused render changes clear the breach. The two passing focused tests establish batching/cadence helper and source-contract behavior only; they do not establish a whole-game 100-turn runtime improvement or pass the >60-second gate.
