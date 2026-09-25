# Conditional Defense recovery receipt — TIMEOUT

- Task: `t_a3f64b99`
- Run: `1211`
- Parent objection: `t_a48da8d3` / run `1203`
- Recovery of: `t_c6df85cf` / run `1210`
- Date: `2026-09-24`
- Result: `TIMEOUT` — not `PASS`

## Scheduler result

```text
status: blocked
run status: timed_out
outcome: timed_out
error: elapsed 1204s > limit 1200s
retry_status: ready in the run event, but task max_retries=1 and the task is blocked/gave_up
```

The recovery was not re-unblocked and no third same-topic dispatch was created. The timeout is an escalation point, not evidence of the live chain.

## Evidence observed before timeout

The worker:

- read the evaluator, original defense body/dispatch, and attempt-specific dispatch;
- inspected the real `main.ts` seams and the run-local live harness;
- executed `node tools/civ-matrix-production-runtime-live-test.cjs` through the real run-local harness; that attempt ended with exit `1` after approximately `120.3s`;
- performed several Playwright-based live-runtime attempts; multiple attempts ended with exit `1` or were interrupted by the task timeout;
- did not produce a terminal live-chain receipt;
- did not produce a verified proof of `main.ts → runAiPhase → availableProduction`;
- did not create a new evidence artifact under the Production run directory before timeout.

The scheduler log ends with a still-running investigation interrupted by the task timeout. No `PASS` claim is allowed.

## Worktree safety readback

At the final readback the worktree still showed the pre-existing Production changes plus the existing run-local/untracked harness files; no merge, push, deploy, reset, clean, stash, checkout, restore, or pull was performed.

The next legal action requires a new bounded strategy with a materially different proof path or explicit infrastructure remediation. Do not blindly rerun the same browser/Playwright sequence.
