# AutoBot Operator: guarded capture-refresh harness compatibility

Date: 2026-10-28 UTC

**Outcome: harness compatibility PASS; bounded live run INCONCLUSIVE before EOT.** No product code was edited by this operator.

The first attempt against the current product failed before launching a browser. The seeder plugin's transform expected one exact unconditional capture-refresh sequence (`syncUnitsRender(); cityRenderer.sync(...); refreshFog(); ...`). Current `src/main.ts` conditionally calls `syncUnitsRender()` under `if (galleryOn)`, so the harness threw `temporary-large-empire-stress-seeder expected exactly one capture refresh render/fog timing transform anchor` at line 623. This was a harness/source-shape mismatch, not a product runtime failure.

Updated only `tools/perf-large-empire-stress-live-test.cjs`. The timing transform accepts exactly one of the legacy unconditional or current gallery-guarded anchors, and times the unit sync only within the guard for the new form. The self-test now asserts that both source forms match exactly once. `node --check` and `STRESS_HARNESS_SELF_TEST=1 node tools/perf-large-empire-stress-live-test.cjs` passed. The self-test also retains the prior bounded-evaluate timeout and recovery evidence checks.

One run was started with `STRESS_COMPACT=1 STRESS_EOT_TIMEOUT_MS=60000 STRESS_EVALUATE_TIMEOUT_MS=60000 node tools/perf-large-empire-stress-live-test.cjs 3`, bounded by an outer 5-minute timeout. Build completed with 914 modules in 17.31 seconds. Source identity immediately before and after build matched:

- `main.ts`: `9aef37f69d40624009ae4c5244ed44a61786a3049fdc9f620a8887a6cfbd1cdb`
- `production.ts`: `f382de35b3262c301b51ac0319540e96f8f65bf2908c9a4e29626ea24a9a2361`
- build input tree: `98a82bd4cc15159897a71541f0152c800faaacdb7a3b7bd27415b0d3da944564`
- harness: `6505d2cc65f5b09d473a7387aab4785363abb6d6e87dd03cba887d9d07ae98c4`
- bundle `index.html`: 70,023,527 bytes, SHA-256 `c6dc4fe0185920f996fc695d230ca27e33b7036c1d840e86b6b53ffd5560d368`
- git HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`

The browser passed `page-load`, `test-hooks-ready`, and `new-game-start`, then remained in `world-generation-wait` without a harness phase update. At the parent's 90-second cap for this phase, Chromium's renderer was active at approximately 105% CPU; this supports ongoing map-generation work, not a demonstrated deadlock or product hang. The run was stopped with Ctrl-C at the cap. It reached zero EOTs, seeded no large-empire scenario, produced no stress summary, and is not a performance result. Process inspection confirmed the harness/browser had exited. No timeout evidence file was produced because no bounded `page.evaluate` timed out; the phase was waiting on Playwright's `waitForFunction` for world generation.

A follow-up `sha256sum` observed current `src/main.ts` at `77dac8a0ec23518888d64e239897545781ea6b0cf37c7c005fd3c79f944548ba`, differing from the build-time `9aef...` identity. This means a concurrent edit changed `main.ts` after the build (or immediately after the recorded source check); the HTML bundle remains the exact artifact hash above, but it does not represent the then-current main source. The harness correctly checks source stability during the build, not after startup. `production.ts` remained at `f382...` and harness remained at `6505...` at final inspection.

Recommended next bounded diagnostic: compare current source/build identity with the previous run that reached world generation in about 64 seconds, especially changed world-generation hooks and seed startup code. Then run one build-only source identity check and one startup-only Playwright probe capped at 90 seconds that logs renderer CPU and polls map-load overlay/start-city debug state; do not start EOT or the 100-turn test until startup behavior is explained. This attempt's late source hash change also argues for coordinating edits or adding a source identity check immediately before fixture seeding.
