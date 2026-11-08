# AutoBot Operator — bounded EOT harness diagnosis

**WERDYKT: PASS for the bounded harness diagnostic; 100-turn release gate remains open.** One fresh build and one three-EOT reproduction; no product edits, no retry, no commit/push/deploy.

## Identity

- Built source at both pre/post-build checks: `src/main.ts` SHA-256 `9853426d44f0f9e6b34cb42323cad29508a83831c60a9186ccb6a00f94e6f68a`; `src/game/production.ts` SHA-256 `f382de35b3262c301b51ac0319540e96f8f65bf2908c9a4e29626ea24a9a2361`.
- Build input tree SHA-256: `fcb041e0f5faec49b4bf26dc3552e598048e2b9a6b0b61af1b40e1dd07c6ebaf`.
- Harness SHA-256 used by the build: `e7f26ac5b2277bebbf3b2c67bb832c2031c3eb9a39ed6db32a9c3ee4ab3fcfec`.
- Single-file bundle SHA-256: `2480dcbe9f2b3f9539cb774c61a4a5c87a861bb953ad90baadcaa68e17e32b62` (70 023 548 bytes; 914 modules).
- Raw run summary: `/tmp/large-empire-stress-summary-66950-3sm41d.json`, SHA-256 `7cb32948622c0d108633e2ccab0621985faea2cb927b4a3b3f7e8ff650ecd1f3`.
- Run: `timeout --signal=TERM --kill-after=15 20m env STRESS_COMPACT=1 STRESS_EOT_TIMEOUT_MS=60000 STRESS_EVALUATE_TIMEOUT_MS=60000 node tools/perf-large-empire-stress-live-test.cjs 3`.

## Harness change and checks

The harness now hashes `src`, `data`, HTML/config/package inputs before and after Vite build and refuses browser startup if they changed. It prints phase markers for offer resolution, lifecycle read, end-turn trigger, state read, turn wait and completion. All `page.evaluate()` calls run through a deadline wrapper; timeout handling tries screenshot first, then a bounded diagnostic state read and writes phase/error evidence. Timeout recovery state, modal and body reads are bounded, as is browser shutdown. The EOT wait remains capped at 60 seconds. `STRESS_HARNESS_SELF_TEST=1` simulates a never-resolving evaluation and confirms timeout evidence JSON/state and screenshot creation. `node --check` and this self-test passed.

One earlier build-only attempt was intentionally refused because its source changed during compilation; no browser was launched for it. The successful build records identical before/after source-tree hashes above.

## Bounded run outcome

The fixture seeded as expected: 137 cities, six major AI owners with 15 cities each, seven one-city minors, 40 player cities and 180 improvements. Initial heap was 443 409 061 bytes. All three EOTs completed and produced both `eot-completed` markers and production `START`/`DONE` warnings:

| Transition | Harness wall time | Instrumented world EOT |
|---|---:|---:|
| 1→2 | 20.255 s | 13.678 s |
| 2→3 | 41.255 s | 16.649 s |
| 3→4 | 30.368 s | 23.053 s |

For all turns, the end-turn wait observed `world.turn > turnBefore` and `endTurnInProgress === false`, followed by lifecycle completion. Every Playwright evaluation completed under its 60-second deadline; no timeout screenshot was needed. The three turn-2 AI offers were resolved through the real audience reject UI, with each ID removed from pending; EOT 2→3 then completed. The harness logged 0 JS/page errors, 0 yield-budget failures and 0 `Force-clearing stuck transition` warnings. The 58 warnings included expected HUD blocker checks while offers or EOT were active. Final state: turn 4, 137 cities, 25 units, heap 434 602 454 bytes.

This directly shows that the turn-2 offer sequence and EOT trigger are not stuck in the tested bundle. It also shows why report 41's last offer line did not establish the run's current turn: compact mode had no per-turn success log, while the new phase instrumentation does. This three-turn result does not establish what happened in the earlier manually stopped run or whether a later turn stalls; its source snapshot predates subsequent shared edits. It is not a substitute for the 100-turn performance gate.

## Next step

The harness diagnostic is ready. After product edits stop changing, run one fresh build with the same bounded three-EOT command and confirm its pre/post tree hashes match the final candidate. Keep the performance gate open until the separately requested late-game validation has adequate evidence.

**Process:** exited cleanly. **Product code:** unchanged by this task.
