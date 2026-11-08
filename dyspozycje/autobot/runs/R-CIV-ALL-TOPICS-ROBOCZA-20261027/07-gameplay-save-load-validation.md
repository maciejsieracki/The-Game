# 100-turn gameplay and save/load check — 2026-10-27

**Artifact:** `gra-robocza/Gra-ROBOCZA.html`
**SHA-256:** `38526ae35906328b1e2a76c4158f28795c04c7ad945ad9d03a452993e023d692`
**Browser:** Chromium `/usr/bin/chromium`, headless, viewport 1440×900
**Access:** exact Robocza bundle served locally over HTTP; no source rebuild or product changes.

## Outcome

PASS for this bounded runtime scenario. Starting from game turn 1, 100 end-turn actions advanced the game to turn 101. A manual save was made through the in-game save dialog at turn 51, loaded through the in-game load dialog, and the observed state matched: 2 cities, 13 units, and turn 51 before and after load. The game then completed the remaining 50 end-turn actions. There were no JavaScript page errors.

The 100 actions took 656.8 seconds including the initial world generation and save/load. The ten-turn checkpoint averages ranged from 3.76 to 3.92 seconds per turn after the initial checkpoint; checkpoint maxima ranged from 4.10 to 4.37 seconds. Each measured turn includes engine completion and the scripted handling of visible battle/audience UI when present.

Chromium `performance.memory` sampled used JS heap between 192.2 MB and 222.9 MB at checkpoints; it did not grow monotonically. This is a JS-heap observation only, not a measurement of total browser memory, GPU/texture memory, listener counts, or resource-release behavior.

## Test setup and limits

The run used the existing game test hooks to start a seeded normal game and found the player city after world generation. The test disabled the victory check to allow the long run, moved player units back to their home city before each turn to avoid unrelated modal battles, resolved any visible battle through the real `Auto` button, and dismissed first-contact diplomacy cards through their normal `Wyjście` button. Turns were advanced by trusted mouse clicks on the real HUD end-turn button. These controls make this a bounded turn-stability/save-load check, not an unassisted human-play acceptance test or a representative large-empire performance benchmark.

The browser emitted two `Failed to load resource` console messages. The local HTTP server log identified both as `GET /favicon.ico` returning 404; the game bundle itself returned HTTP 200. There were no JavaScript page errors, and the missing favicon did not affect play, saving, loading, or the remaining turns.

Evidence:

- Checkpoint data and per-turn timings: [`result.json`](evidence/100-turn-run/result.json)
- In-game state before save/load: [`turn-51-before-load.png`](evidence/100-turn-run/turn-51-before-load.png)
- In-game state after load: [`turn-51-after-load.png`](evidence/100-turn-run/turn-51-after-load.png)
