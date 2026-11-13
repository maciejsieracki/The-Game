# AutoBot Evaluator: 100-turn large-empire performance run

Date: 2026-10-28 UTC
Verdict: **PASS WITH PERFORMANCE CAVEAT**

I independently inspected `65-operator-large-empire-perf-resume.md`, its structured 100-turn evidence, and the earlier turn-47 timeout evidence. I did not rerun the live test and made no product-code changes.

The JSON contains exactly 100 samples, all marked `advanced: true`, advancing world turn 1 to 101. Its recomputed wall-time mean is 35,360.89 ms; maximum is 58,139 ms at iteration 39 (turn 39→40). No EOT reached 60,000 ms. This matches the operator report and passes the stated strict `<60s` gate, with only 1,861 ms headroom. The run records zero errors and zero yield-budget failures. The reported duration also agrees with the recorded start/end timestamps (66m 26.499s).

The seeded start scenario is internally consistent: owner 0 has 40 cities, six major AI owners have 15 apiece, and seven minor owners have one each, totaling 137 cities. It records 180 improvements, the five reported buildings per city, and 21 starting units. All ten 10-EOT checkpoints (iterations 10 through 100) match the table in the operator report field-for-field, including world turn, cities, units, sampled heap, renderer calls/triangles, average/max EOT and batch wall time. The ending sample/checkpoint has 153 cities and 106 units.

Build identity is internally consistent and unchanged across the build: HEAD is `87098d15f056848dfb43c59fed5438ff00a9127f`; `main.ts`, `production.ts`, the input tree, and harness hashes match the operator report and `sourceBeforeBuild == sourceAfterBuild`. The generated bundle is 70,023,715 bytes with SHA-256 `660841bd0001052ade49caf4d3a9f03a9fa520e41e34ba94e1a38148d498d99e`. The summary JSON is 3,911,821 bytes with SHA-256 `951ffdf7dfd11facab21b26f2005ec870a0e105ab2e704e79b58b53c77ab20f7`.

The 990 warnings are present and correctly described rather than hidden: 882 EndTurn blocked/in-progress or decision-gate messages, 104 building-upkeep shortage messages, and four WebGL `GPU stall due to ReadPixels` driver warnings. They did not correspond to recorded page/console errors or harness errors. This is a warning-bearing pass, not a clean-warning run. The heap high-water mark of 780.6 MiB and the near-limit slow EOT warrant follow-up profiling; the report correctly cautions that phase timings overlap and should not be summed.

The prior evidence file has the reported SHA-256 `801bec06a736263350dedf2f4752aa294cf75da408bd2aac110f8d725f3d0396` and ends at iteration 47, turn 47, in `eot-timeout-state-read`. It reports that `page.evaluate`, state read and screenshot all failed because the target page/context/browser had already closed; it has no captured in-game error. This is consistent with an externally stopped run, not proof of an EOT hang. The exact prior 1,800-second shell cap is stated in the operator report but is not encoded in that JSON, so the cap attribution relies on the run-command record rather than the timeout JSON alone. The new 100-turn run with a longer outer cap completed without reproducing a hang.

Repository check at evaluation: `HEAD == origin/main == 87098d15f056848dfb43c59fed5438ff00a9127f`; the only untracked paths were the operator report and its evidence directory. No tracked modifications were present. The evaluator report is an additional untracked documentation artifact.

**Conclusion:** the evidence supports a completed 100-EOT stress-test pass against the stated 60-second threshold. It does not establish comfortable performance headroom; investigate the measured siege-scan spike, recurring trade-route recomputation, autosave/AI costs, and high heap watermark before treating the large-empire performance issue as fully resolved.
