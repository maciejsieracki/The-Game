# Performance validation — 2026-10-27

**Target Robocza bundle:** `gra-robocza/Gra-ROBOCZA.html`
**Expected SHA-256:** `38526ae35906328b1e2a76c4158f28795c04c7ad945ad9d03a452993e023d692`
**Observed SHA-256 before the run:** identical.
**Source:** current `main`/release source (`92d124b` feature commit; subsequent `99bb834` changes are release documentation).

## Long-session attempt

Ran the existing `tools/perf-long-session-live-test.cjs` for 100 turns, checkpoints every 10. Its Vite build succeeded. The environment did not have the harness's configured Chromium binary, so a temporary, untracked copy was used to point at `/usr/bin/chromium` and serve the generated single-file build over localhost (the system browser blocks `file://` with `ERR_BLOCKED_BY_ADMINISTRATOR`). The temporary copy was removed after the run; no product source was changed.

The game booted at turn 1 (2 cities, 4 units). The run stopped at iteration 3: turn 3 did not advance within the 20-second end-turn timeout because a real pre-battle modal was open (`isPreBattleOpen`; warning `[EndTurn] blocked: preBattleOpen {pending:false}`). Total elapsed time was 37.876 seconds; the blocked turn attempt took 22.454 seconds. This is a scenario blocker, so the run does **not** measure a 100-turn performance profile and does not establish a performance regression. Screenshot: `evidence/perf-long-session-stuck-turn-3.png`.

## Historical slowdown gate preflight

Inspected `tools/web-turn-slowdown-test.cjs`. It defaults to 40 turns, builds 2–3 Vite variants, and runs 2–3 Chromium sessions; its header estimates 25–40 minutes on SwiftShader. Preflighted its five source anchors without launching builds: P1 visible, P1 explored, P2 memo, and P3 nodes each occur once, but the P4 `cities.filter(c => c.ownerId === ownerId)...computeLostToNearerSiblingByCity(cities, map)` anchor occurs zero times. The gate would stop before building, so it was not run. It is not compatible with this source snapshot without a separate test update.

## Result

The blocked run above did not produce a performance measurement. A separate controlled 100-turn run on the exact published bundle completed later; its turn-time and JavaScript-heap observations are recorded in `07-gameplay-save-load-validation.md`. That small scenario (2 cities, at most 15 units) showed no rising turn-time trend and no monotonically growing sampled JS heap. It does not represent the large-empire late-game workload that triggered the user's report, and does not measure total browser/GPU memory or compare against a baseline.

**Large-empire performance verification remains open.** The historical comparative gate is incompatible with the current P4 source, and the 100-turn run is bounded stability evidence rather than a late-game stress benchmark. No product files were changed by these validations.
