# R-WEB-D-FOG-F-MEASUREMENT-SCRIPTS-Q1 — final control

STATUS: PASS WITH NOTES — stage 8; scoped harness and bounded preflight contract only.

## Independent control

The requested scope is exactly these three measurement runners:

- `gra/tools/longrun-100-turns-leak-q1-measure.cjs`
- `gra/tools/memory-unit-static-merge-game-measure.cjs`
- `gra/tools/memory-growth-rootcause-q1-measure.cjs`

Independent `node --check` completed successfully for all three scripts. The deployed F-option contract script completed with **25 OK / 0 FAIL**. `git diff --check` completed without errors for the three scoped scripts.

Source review confirms all three runners pass `fogRevealKeyFEnabled: true` in their `__aiBuildingsTestDebug.startNewGame` options, and each checks the exposed closure state is exactly `true` before continuing into the existing measurement procedure. The longrun `--prepare` injection adds the option to the copied `doStartGame` arguments and exposes the option/fog state probes used by the bounded control.

The longrun `--preflight-only` path checks F with the option OFF, starts a Maly game with the option ON, checks the in-game OFF negative control, verifies F turns fog off and the next F restores it, writes `PREFLIGHT-OK`, and returns before victory-check changes, turn processing, or benchmark sampling. The supplied raw JSONL has the expected two negative-control states (`enabled:false`, `fogOff:false`) and preflight state (`fogRevealKeyFEnabled:true`, `fToggleOff:true`, `fToggleRestored:false`); the companion DONE marker contains `PREFLIGHT-OK`.

The root-cause memory runner still prepares and requires `window.__memProbe`, and its measurement loop calls `__memProbe.stats()`. The recorded prepared-copy inspection also confirms `__memProbe` coexists with the fog option instrumentation.

## Evidence limits

This control verifies option wiring and the bounded F-key preflight. It does not establish turn-loop behavior, heap growth, renderer timings, CPU profiles, or a full performance result. Actual preflight duration was **NIE ZMIERZONO** independently; file mtimes do not certify elapsed runtime. No heavy browser rerun was performed for this control.

Evidence reviewed: `10-operator-r1.md`, `20-evaluator.md`, `evidence/preflight-seed4242.jsonl`, and `evidence/preflight-seed4242.DONE`. No source edits or commit were made by this final control.
