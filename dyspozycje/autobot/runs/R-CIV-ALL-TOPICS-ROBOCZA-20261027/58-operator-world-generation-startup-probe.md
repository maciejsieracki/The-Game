# AutoBot Operator: bounded world-generation startup probe

Date: 2026-10-28 UTC

**Harness: PASS. Startup probe: INCOMPLETE at its 160-second polling cap.** The probe reached no player-start-ready state and performed no empire fixture seeding or end turns. All edits in this task were confined to the stress harness.

Added `STRESS_STARTUP_PROBE=1` mode to `tools/perf-large-empire-stress-live-test.cjs`. It starts the seeded standard 6-rival world, polls every five seconds, and records bounded page responsiveness, loading overlay text/HTML including bar width, optional `__cityStateStartUnitsTestDebug.dumpState()`, hook readiness, and a screenshot every 30 seconds. Each page evaluation has a seven-second timeout and each screenshot a ten-second timeout. It exits after readiness or the configured cap; it does not start a city fixture or EOT. `node --check` and `STRESS_HARNESS_SELF_TEST=1 node tools/perf-large-empire-stress-live-test.cjs` passed.

Ran once with a 180-second outer process cap and a 160-second probe cap (leaving room for build and cleanup):

```
timeout --signal=TERM --kill-after=10 180s env STRESS_STARTUP_PROBE=1 STRESS_STARTUP_CAP_MS=160000 STRESS_EVALUATE_TIMEOUT_MS=7000 STRESS_SCREENSHOT_TIMEOUT_MS=10000 STRESS_COMPACT=1 node tools/perf-large-empire-stress-live-test.cjs 1
```

The build transformed 914 modules in 16.55 seconds. Input identity was stable before/after build:

- `src/main.ts`: `77dac8a0ec23518888d64e239897545781ea6b0cf37c7c005fd3c79f944548ba`
- `src/game/production.ts`: `f382de35b3262c301b51ac0319540e96f8f65bf2908c9a4e29626ea24a9a2361`
- build input tree: `6ef5b71666ee9590d43e8889cc51c8add5fe1bf49d6ca61831ec6ea498308f1d`
- harness: `e5bbf93c29cc0d67b014565944256a7ed1c82d394e675651be42d7e5c5e340a4`
- bundle `index.html`: 70,023,667 bytes, SHA-256 `0042114ff1453b1ae984d78a2bd592647fad151ed29773d60f1e0322bfa631d5`
- git HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`

The browser and JS/CDP remained responsive for all 32 polls; there were no probe errors or evaluate timeouts. At 5.4 seconds the overlay reported `6/10 · Rzeki — główne` (main rivers), with the start debug state present (`awaitingFirstPlayerCity=true`, player start hex `{q:19,r:13}`), but the loading overlay remained active, so the fixture-ready predicate correctly stayed false. The overlay progressed from 6/10 at 50% to 7/10 at 60% at 105.7 seconds, then to 61% by 135.8 seconds. At the 160-second cap it still reported `7/10 · Rzeki — uzupełnianie` (river completion), 61%, and the overlay was still present. This is direct evidence of slow ongoing generation with a responsive page, not a page/CDP hang. The probe does not establish why this generation phase is unusually slow.

Structured evidence: `/tmp/large-empire-startup-probe-74128-ssbnib.json` (32 polls, 160,000ms). Screenshots were captured at 0, 30.4, 60.5, 90.6, 120.7, and 150.8 seconds, for example `/tmp/large-empire-startup-74128-ssbnib-t150825-1793176262653.png`. Process inspection after exit showed no harness or Playwright Chromium process. There were zero EOTs; this is not a performance gate result.

Next bounded step: inspect world-generation phase 6–7 implementation and determine why river generation/overlay progress takes roughly 100 seconds in this browser workload. If a source change is made, rebuild and run this same startup-only probe once with the same seed before attempting any EOT stress run.
