# AutoBot Operator: 100-turn large-empire performance run

Date: 2026-10-28 UTC

**Result: COMPLETED 100/100 turns; the <60-second per-turn gate passed, with little headroom.** The run completed from 10:29:15.447Z to 11:35:41.946Z (66m 26.499s). Average EOT wall time was 35,360.89ms; the slowest was 58,139ms (turn 39→40), 1.861s under the 60s gate. There were no harness/browser/JavaScript errors and no yield-budget failures. This is a successful run under the stated gate, but not evidence of comfortable performance margin.

## Scenario and exact build

Ran the single authorized seeded 100-turn stress scenario against clean `origin/main` HEAD `87098d15f056848dfb43c59fed5438ff00a9127f`. Initial fixture: 137 cities (40 player, 6 major AI civilizations with 15 each, 7 one-city minor/city-state owners), 180 terrain improvements, and five buildings in every city (`stolarnia`, `spichlerz`, `targowisko`, `koszary`, `biblioteka`). Initial units: 21. Normal game execution continued during the test; by turn 41 there were 143 cities and by turn 51 there were 153, as the AIs founded/captured cities. The run ended at 153 cities and 106 units, so the game was exercised at and beyond the initial 40-city-player fixture rather than keeping ownership artificially static.

Command:

```sh
timeout --signal=TERM --kill-after=30 5400s env STRESS_COMPACT=1 STRESS_EOT_TIMEOUT_MS=120000 STRESS_EVALUATE_TIMEOUT_MS=120000 node tools/perf-large-empire-stress-live-test.cjs 100
```

The production source and harness hashes were identical before and after build:

- `main.ts`: `4a152bd077153f221a5ac872bc0f173d49fcd6e10f8f49009a36e670cfecaea1`
- `production.ts`: `f382de35b3262c301b51ac0319540e96f8f65bf2908c9a4e29626ea24a9a2361`
- build input tree: `67d5e1c49ce00e3e9e807a996a627f07cdae86ceecb42114398e677753134de0`
- harness: `e5bbf93c29cc0d67b014565944256a7ed1c82d394e675651be42d7e5c5e340a4`
- generated bundle: 70,023,715 bytes, SHA-256 `660841bd0001052ade49caf4d3a9f03a9fa520e41e34ba94e1a38148d498d99e`

## Checkpoints

Each checkpoint covers the preceding ten EOTs. Heap figures are the harness's sampled JS heap; renderer figures are calls / triangles.

| EOTs | World turn | Cities | Units | Heap MiB | Render calls / triangles | Avg EOT ms | Max EOT ms | Batch wall ms |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | 11 | 137 | 44 | 522.4 | 643 / 1,403,104 | 25,927 | 36,218 | 277,732 |
| 20 | 21 | 137 | 84 | 419.0 | 757 / 1,407,854 | 33,836 | 41,310 | 358,119 |
| 30 | 31 | 137 | 84 | 411.4 | 258 / 1,409,390 | 34,002 | 47,510 | 359,406 |
| 40 | 41 | 143 | 89 | 449.9 | 259 / 1,416,474 | 40,194 | 58,139 | 421,204 |
| 50 | 51 | 153 | 92 | 513.1 | 265 / 1,422,228 | 34,433 | 43,361 | 363,967 |
| 60 | 61 | 153 | 98 | 658.8 | 267 / 1,430,580 | 35,528 | 40,079 | 375,417 |
| 70 | 71 | 153 | 102 | 566.1 | 269 / 1,440,912 | 35,717 | 38,340 | 377,029 |
| 80 | 81 | 153 | 106 | 554.2 | 274 / 1,451,090 | 36,609 | 38,005 | 386,566 |
| 90 | 91 | 153 | 106 | 559.7 | 281 / 1,459,950 | 38,293 | 40,402 | 403,808 |
| 100 | 101 | 153 | 106 | 670.0 | 284 / 1,468,488 | 39,070 | 41,102 | 410,636 |

Across all 100 samples, the mean was 35,360.89ms, minimum 20,491ms and maximum 58,139ms; exactly one turn reached 50 seconds and none reached 60 seconds. Sampled JS heap peaked at 818,488,497 bytes (780.6 MiB) around turn 80 and was 702,536,449 bytes (670.0 MiB) in the final sample. Heap use fluctuated rather than rising monotonically, but the high-water mark is worth tracking in future runs. Final renderer count was 284 calls / 1,468,488 triangles.

## Performance findings and diagnostics

Instrumentation's largest per-phase costs were:

- `runWorldEndTurn_total`: 27.780s average, 51.037s maximum.
- `autosave_async`: 13.257s average, 23.138s maximum.
- `runAiPhase`: 10.387s average, 31.605s maximum.
- `city_economy_phase`: 8.409s average, 12.808s maximum.
- `recomputeTradeRoutesNow`: 4.861s average, 7.821s maximum.
- `scanAutoSiegesAfterAiTurn`: 2.081s average, 23.981s maximum.

The single slowest EOT (turn 39→40, 58.139s) coincided with a 23.981s automatic-siege scan, including 23.979s across seven `silentStorm` calls. That is the clearest measured spike and a useful next optimization target. Trade-route recomputation is a persistent multi-second cost each turn; autosave and AI phase are also material. These timings are instrumentation phase totals, so they are not additive attribution of the whole EOT.

The harness recorded 0 errors and 0 yield-budget failures, alongside 990 warnings: 882 `[EndTurn]` blocked/in-progress or decision-gate messages, 104 building-upkeep resource shortage messages, and 4 Chromium WebGL driver performance warnings (`GPU stall due to ReadPixels`). No pageerror or console-error events were recorded. The warning count is not zero; these warnings did not stop the run. Three AI offers were processed.

The earlier attempt stopped after 47 turns because its outer shell cap was `timeout 1800s` (30 minutes). The saved evidence records browser closure immediately after that external cap; it did not establish an in-game turn hang. This resumed run used a 5,400-second outer cap and 120-second EOT/page-evaluation observers, completed all 100 turns, and did not reproduce an EOT hang.

## Evidence and cleanup

Full structured output, including all 100 samples, phase rows/summaries, warnings, errors, ownership changes, and checkpoints: `evidence/perf-resume-20261028/100-turn-stress-summary.json` (3,911,821 bytes; SHA-256 `951ffdf7dfd11facab21b26f2005ec870a0e105ab2e704e79b58b53c77ab20f7`). The prior turn-47 timeout JSON and startup probe screenshots remain in the same evidence directory: `turn47-external-timeout-evidence.json` has SHA-256 `801bec06a736263350dedf2f4752aa294cf75da408bd2aac110f8d725f3d0396`.

No product code was changed. The harness removed its generated `/tmp/large-empire-stress-89754-dmy5kr` bundle directory on exit; `gra/dist` was absent and required no cleanup. The summary was copied into the run evidence, then its `/tmp` copy was removed. `node_modules` and unrelated diagnostics were retained. Previously authorized cleanup removed only the two verified clean ancestor worktrees and the listed generated scratch artifacts; all other worktrees were preserved. No commit, push, or deploy was performed.

Performance gate: **PASS at the strict 60-second threshold; near-limit run deserves follow-up profiling of siege storms, trade-route recomputation, autosave, and AI.**
