# D-FOG-F measurement scripts — independent evaluation

STATUS: PASS WITH NOTES — scoped harness contract only; no full performance result is claimed.

## Independent checks

- `node --check` passed for all three allowlisted measurement scripts.
- `node tools/fog-reveal-key-f-option-test.cjs` passed: 25 OK / 0 FAIL.
- Review of the preparation and runner code confirms that the copied `doStartGame` call receives `fogRevealKeyFEnabled: true`; each measurement runner then reads the closure state and throws unless it is `true` before continuing to its measurement procedure. The deployed default-OFF and F-key gate are covered by the 25-check option contract.
- The longrun `--preflight-only` branch checks the menu baseline with the option OFF and F pressed, starts a Maly game with the option enabled, checks an in-game OFF negative control, then verifies F turns fog off and the second F restores it. It writes `PREFLIGHT-OK` and returns before victory-check changes, turn processing, or benchmark sampling.
- The saved JSONL contains only `start`, two `negative-control-pass` states (`enabled:false`, `fogOff:false`), and `preflight-pass` (`fogRevealKeyFEnabled:true`, `fToggleOff:true`, `fToggleRestored:false`). The DONE marker contains `PREFLIGHT-OK`.
- The preflight copy is based on the recorded base `8778e36138d2ec42f0d28df9bc9a59981933fb7f`. Comparing its tracked `gra/` files to that base after preparation found the three allowlisted runner overlays plus the expected generated `src/main.ts` test instrumentation. The prepared copy retains `__leakDump` and `__memProbe`; the memory runners still require and call `__memProbe.stats()`.
- `git diff --check` passed for the three scripts. The operator's task-specific source diff is limited to the three allowlisted runner scripts. The shared worktree has other concurrent edits outside this task's allowlist.

## Evidence limits

This verifies option wiring and the bounded F-key preflight only. It does not validate turn-loop behavior, heap growth, renderer timings, CPU profiles, or any other performance claim. Actual duration was not measured independently here (`NIE ZMIERZONO`); filesystem mtimes can reflect artifact copying, so they cannot confirm or refute the operator's reported runtime. The recorded `PREFLIGHT-OK` and state assertions remain valid.
