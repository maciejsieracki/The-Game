# D-FOG-F measurement scripts — operator evidence

STATUS: HARNESS FIX IMPLEMENTED; BOUNDED LIVE PREFLIGHT PREPARED, AWAITING ORCHESTRATOR LOCK
BASE: `8778e36138d2ec42f0d28df9bc9a59981933fb7f`

## Identified scripts and allowlist (recorded before edits)

Only these three registered measurement scripts may be edited:

1. `gra/tools/longrun-100-turns-leak-q1-measure.cjs`
2. `gra/tools/memory-unit-static-merge-game-measure.cjs`
3. `gra/tools/memory-growth-rootcause-q1-measure.cjs`

All three prepare/build a copied `gra/` tree and start the real `doStartGame` path through the harness hook `__aiBuildingsTestDebug.startNewGame`. The generated options currently omit the approved test option `fogRevealKeyFEnabled`, so their subsequent `F` keypress does not enable map reveal under the deployed default-OFF gate. Their measurement contracts otherwise remain the existing long-run memory/leak and renderer profiling procedures; only copied harness setup may change.

No product files, shared harness helpers, or other test files are in scope. FALA 587’s deployed option is already implemented and will not be reimplemented. Browser execution is held pending the orchestrator’s browser-lock grant.

## Work and evidence

`longrun-100-turns-leak-q1-measure.cjs --prepare` now configures `fogRevealKeyFEnabled: true` in the disposable copy's `__aiBuildingsTestDebug.startNewGame` object passed to real `doStartGame`. The copy exposes the resulting closure state and fog toggle state for regression checks. All three measurement runners pass the approved option in their setup call and assert that the resulting game state is `true` before disabling victory checks or taking measurements. The memory scripts inherit the prepared hook from the documented `memory-growth-rootcause --prepare` flow.

The longrun runner also has a `--preflight-only` mode for a short Maly-map run. It checks that F does not change fog while the option is OFF, that the real `doStartGame` call turns the option ON, and that F turns fog OFF then ON. It exits before the turn loop and records `PREFLIGHT-OK`, without sampling or benchmark output. Browser navigation now serves the selected copied dist directory over loopback HTTP, and Chromium is pinned to `/usr/bin/chromium`.

Checks completed:

- `node --check` on each of the three allowlisted scripts: PASS.
- `node tools/fog-reveal-key-f-option-test.cjs`: 25 OK / 0 FAIL (existing deployed-option contract).
- Ran `longrun --prepare` on a temporary copy of `src/main.ts`: PASS; copied `doStartGame` params contain `fogRevealKeyFEnabled: true`, and the test hook contains the closure-state probe.
- Ran `memory-growth-rootcause --prepare` on a temporary copy: PASS; same option field/probe are present alongside `__memProbe`.
- `git diff --check`: PASS.
- Fresh temporary-copy `memory-growth-rootcause --prepare`: PASS; injected game option, state probes, negative-control setter, and `__memProbe` coexist.
- Clean-HEAD isolated preflight copy at `/tmp/d-fog-f-preflight.ZWfbNX`, overlaid only with the three allowlisted scripts and local `node_modules` symlink: Vite build PASS (1,011 modules, 14.64 s).
- Bounded live Chromium preflight: PASS, exit 0, `PREFLIGHT-OK`. Run used the Maly map and `--preflight-only`; it stopped before any turn or measurement loop. Raw output is saved in `evidence/preflight-seed4242.jsonl` and `evidence/preflight-seed4242.DONE`. The JSON records OFF negative-control state `{enabled:false,fogOff:false}`, post-`doStartGame` option `true`, and F toggle results `true` (FoW off) then `false` (FoW restored). No performance measurement or benchmark result is claimed.

Only the three files in the allowlist above were edited for this task. The run folder contains this evidence record; no product code, shared helper, or commit was changed.
