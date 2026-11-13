# Final Control resume — shared AUTO / Skip frame ticks

**Decision: PASS.** Candidate `239bb988b` on base `638e90bea` meets the recorded breach parity goal and the preservation gates reviewed here. No product code was changed by Final Control.

I checked the `battleScene.ts` diff and confirmed the AUTO clock keeps its existing clamp-and-scale behavior: the old negative-delta clamp followed by the 100 ms upper clamp and `speedMul` multiplication is equivalent to the new shared scaler for wall deltas. Skip now advances by that same scaler applied to the 16 ms frame budget; its callback queue is snapshotted before callbacks run.

To close the candidate AUTO breach evidence gap, I ran a fresh candidate AUTO-only live case through the production Vite build served over local HTTP in headless Chromium: seed 1, speed index 3 (8×), at most 200 pumped frames per evaluate, 540 s limit. It completed at round 400 with no JS errors or timeout. The row is preserved at `/tmp/skip-candidate-auto8x-seed1.jsonl`; checkpoints are at `/tmp/skip-candidate-auto8x-checkpoints.jsonl`.

That candidate AUTO result matches the archived candidate Skip result in winner (defender), round (400), breach state, losses (attacker 26, defender 7), survivors (13 and 21), and HP (2,651 and 807). The reported virtual clocks differ by 1 ms (AUTO 9,134,081; Skip 9,134,080). These are rounded virtual-clock outputs from different frame-loop counts; there is no HP or combat-result discrepancy.

Preservation evidence: candidate no-breach-150 JSON contains both AUTO and Skip rows, each a draw at round 150 without breach or losses, with 988/1,008 HP. The operator's bounded evidence reports field battle parity and manual Skip during an in-progress move (D0–D3, no duplicate same-turn activation); the evaluator inspected these claims and reported them passing. I did not repeat those browser cases because the focused candidate AUTO run closed the outstanding traceability gap and the evaluator had reserved browser capacity.

Independent checks: `battle-skip-siege-parity-test.cjs` passed 17/17; `node --check` passed for both modified live test scripts; `git diff --check 638e90bea..239bb988b` passed. The evaluator also reports `tsc --noEmit` passing. Source SHA-256 matches the operator's candidate hash `d2e3cdd361184375888fb627338745af06f28f22f0eabc4707b98f51e8cb193a`.

No merge, deployment, or push was performed.
