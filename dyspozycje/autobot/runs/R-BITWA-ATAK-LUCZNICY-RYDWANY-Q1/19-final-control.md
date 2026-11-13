# Final Control — R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1

**Verdict: PASS-WITH-NOTES**
**Candidate:** `484fcc24bb632a46bccb49fa44555cc25bac86e3`
**Comparison:** `origin/main` at `689afb69af98980aa3471d9cd844f412c6dcc59a`
**Review:** independent audit of the R6 evaluator closeout and candidate evidence.

No production source patch is present: the candidate diff has no files under `gra/src/`. The code changes are test/harness files under `gra/tools/`, with run reports and evidence. `git diff --check origin/main...HEAD` passes. The worktree has an unrelated pre-existing modification to `dyspozycje/REJESTR-PROSB-I-ZADAN.md`; this audit did not change it.

The evaluator's bounded findings are supported by the reviewed artifacts: the default headless matrix reports 36 scenarios with zero RED, the focused seven-activation matrix reports four scenarios with zero RED, and the R6 production activation replay selects an in-range target and spends an arrow (12→11) while dealing zero HP damage. The R5 natural-placement trace records a real War Chariot moving under Attack and moving/attacking under Charge. These observations support no product fix for the reproduced cases; they do not establish broad army or terrain behavior.

Scope remains explicit: the R5 natural battle is a test-filtered 8v8 `rzym_grecja` preset, not a large campaign engagement; R6 hydrates the captured R5 end-of-round-4 state and directly invokes one production Archer activation, not a naturally scheduled full next round. R5 defenders were `steady`, so Defense was not verified there. The 28v28 traces contain Horsemen and no chariots. The report does not claim broad formation/terrain coverage, nor a deployment or new production fix. No commit, integration, push, or deployment is asserted.

**Disposition:** PASS-WITH-NOTES. Keep any broader ranged-unit approach concern open for a separately reproduced natural terrain/large-roster case. The independent evaluator report is `18-evaluator-r6-closeout.md` in `/tmp/autobot-battle-evaluator-r5/dyspozycje/autobot/runs/R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1/`.
