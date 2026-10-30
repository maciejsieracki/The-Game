# Operator R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1 — live run blocked

**Status:** Stage 8/11 remains incomplete; the new live Chromium run is **BLOCKED / NOT RUN**. No browser test is currently active.

## Work prepared

The isolated harness `gra/tools/battle-manual-control-multicycle-live-test.cjs` extends the existing queue-lifecycle scenario. It retains the actual 28v28 mixed roster and production canvas/UI interaction, and adds:

- choosing an upcoming player unit with an exact visible enemy in legal strike range, issuing the real pointer attack order, and waiting for its target HP to fall;
- toggling the production Atakuj-marszem control, clicking an empty waypoint whose route crosses a threat, then checking both real HP loss and movement continuing while the attack-march order remains set;
- run-specific evidence output under this AutoBot run directory.

Static syntax check passed: `node --check gra/tools/battle-manual-control-multicycle-live-test.cjs`.

## Blocking evidence

- Chromium was not running when checked, and no build/test was started, following the orchestrator instruction.
- Overlay filesystem had **60 MB available** (`df -h /workspace`); the existing production single-file bundle is **67 MB**.
- Existing candidate bundles in `main-integration`, `The-Game`, `commander-integration`, and `battle-attack-move-operator` contain `__eraTestDebug` only. None contains the required `startLargeBattleForTest` or `__battleLargeReturnProbe` hooks, so they cannot run this instrumented scenario without rebuilding.
- Therefore there are no new runtime assertions, screenshots, console records, HP deltas, or movement traces to report. This must not be marked PASS or active progress.

## Next transition

After the 981044 diagnostic run finishes, reassess available disk and browser ownership. If space is available, build and execute this bounded single-run e2e, then save its complete trace/evidence here. Until then, remain **BLOCKED at stage 8/11**. No product code changed; no commit, deploy, or push was performed.
